/**
 * @license GPL-2.0-or-later
 * Copyright (c) ckeditor5-advanced-markdown contributors.
 * This program is free software; you can redistribute it and/or modify it under the terms of the
 * GNU General Public License as published by the Free Software Foundation; either version 2 of the
 * License, or (at your option) any later version.
 */

import { fromHtml } from 'hast-util-from-html';
import { toMdast, defaultHandlers } from 'hast-util-to-mdast';
import type { State, Handle } from 'hast-util-to-mdast';
import type { Element as HastElement, Root as HastRoot, ElementContent } from 'hast';
import { visit } from 'unist-util-visit';
import { toHtml } from 'hast-util-to-html';
import type { Root, Paragraph, RootContent } from 'mdast';
import { parser, stringifier } from './document.js';
import { parseAttributesJson } from './directiveAttributes.js';
import { DIRECTIVE_CLASS, DIRECTIVE_LEAF_CLASS, RAW_BLOCK_CLASS, RAW_INLINE_CLASS } from './toView.js';

const classesOf = ( node: HastElement ) => ( node.properties.className ?? [] ) as string[];
const attribute = ( node: HastElement, key: string ) => {
    const value = node.properties[ key ];

    return typeof value === 'string' ? value : undefined;
};

function parseAttributes( node: HastElement ): Record<string, string> {
    const json = attribute( node, 'dataMdAttrs' );

    return parseAttributesJson( json );
}

// ラベルは Markdown 原文で保持するため、再パースしてエスケープを統一する
// Label được lưu dạng nguồn Markdown nên parse lại để escape nhất quán
function labelNode( label: string | undefined ): Paragraph | undefined {
    if ( !label ) {
        return undefined;
    }

    const parsed = parser.parse( label ) as Root;
    const paragraph = parsed.children[ 0 ];
    const children = paragraph?.type === 'paragraph' ? paragraph.children : [ { type: 'text', value: label } as const ];

    return { type: 'paragraph', data: { directiveLabel: true }, children };
}

// Markdown で表せないインラインは、中身を Markdown のまま残して前後だけ HTML タグにする
// Inline mà Markdown không biểu diễn được thì giữ nội dung là Markdown và chỉ bọc bằng thẻ HTML
const INLINE_HTML_TAGS = new Set( [ 'span', 'u', 'sup', 'sub', 'mark' ] );

function hasPresentation( node: HastElement ): boolean {
    return node.properties.style !== undefined || node.properties.align !== undefined;
}

// GFM で表せない配置や色を落とさず、XHTML として正しい HTML で出力する
// Không bỏ căn lề hay màu mà GFM không biểu diễn được, xuất ra HTML hợp lệ theo XHTML
function needsHtml( root: HastElement ): boolean {
    let found = false;

    visit( root, 'element', ( node: HastElement ) => {
        if ( !INLINE_HTML_TAGS.has( node.tagName ) && hasPresentation( node ) ) {
            found = true;
        }
    } );

    return found;
}

function xhtml( node: HastElement ): string {
    visit( node, 'element', ( child: HastElement ) => {
        delete child.properties.dataListItemId;
    } );

    return toHtml( node, { closeSelfClosing: true, tightSelfClosing: false } );
}

// 子要素を Markdown のまま残すため、開始タグと終了タグだけを取り出す
// Chỉ lấy thẻ mở và thẻ đóng để các phần tử con vẫn là Markdown
function tagPair( node: HastElement ): [ string, string ] {
    const html = toHtml( { ...node, children: [] }, { closeSelfClosing: true } );
    const close = `</${ node.tagName }>`;

    return [ html.slice( 0, html.length - close.length ), close ];
}

const inlineHtmlHandler: Handle = ( state: State, node: HastElement ) => {
    const plain = node.tagName === 'span' && Object.keys( node.properties ).length === 0;

    if ( plain ) {
        return state.all( node ) as any;
    }

    const [ open, close ] = tagPair( node );

    return [ { type: 'html', value: open }, ...state.all( node ), { type: 'html', value: close } ] as any;
};

const handlers: Record<string, Handle> = {
    u: inlineHtmlHandler,
    sup: inlineHtmlHandler,
    sub: inlineHtmlHandler,
    mark: inlineHtmlHandler,
    div: ( state: State, node: HastElement ) => {
        const classes = classesOf( node );

        if ( classes.includes( RAW_BLOCK_CLASS ) ) {
            return { type: 'html', value: attribute( node, 'dataMdSource' ) ?? '' };
        }

        if ( classes.includes( DIRECTIVE_CLASS ) ) {
            const label = labelNode( attribute( node, 'dataMdLabel' ) );

            return {
                type: 'containerDirective',
                name: attribute( node, 'dataMdName' ) ?? 'div',
                attributes: parseAttributes( node ),
                children: [ ...( label ? [ label ] : [] ), ...state.toFlow( state.all( node ) ) ] as any
            } as any;
        }

        if ( classes.includes( DIRECTIVE_LEAF_CLASS ) ) {
            const label = labelNode( attribute( node, 'dataMdLabel' ) );

            return {
                type: 'leafDirective',
                name: attribute( node, 'dataMdName' ) ?? 'div',
                attributes: parseAttributes( node ),
                children: label ? label.children : []
            } as any;
        }

        return defaultHandlers.div!( state, node );
    },
    span: ( state: State, node: HastElement, parent ) => {
        if ( classesOf( node ).includes( RAW_INLINE_CLASS ) ) {
            return { type: 'html', value: attribute( node, 'dataMdSource' ) ?? '' };
        }

        return inlineHtmlHandler( state, node, parent );
    },
    figure: ( state: State, node: HastElement ) => {
        const classes = classesOf( node );

        if ( classes.includes( 'image' ) ) {
            return { type: 'paragraph', children: state.all( node ) as any };
        }

        return state.all( node ) as any;
    },
    li: ( state: State, node: HastElement ) => {
        const result = defaultHandlers.li!( state, node ) as any;

        // 既定の判定は入れ子リストの項目が 2 つ以上あると「緩い」と誤判定する。CKEditor は複数ブロックのときだけ p で包む
        // Cách mặc định coi list lồng nhau có từ 2 mục là "loose"; CKEditor chỉ bọc p khi có nhiều block
        result.spread = node.children.some( child => child.type === 'element' && child.tagName === 'p' );

        return result;
    },
    pre: ( state: State, node: HastElement ) => {
        const result = defaultHandlers.pre!( state, node ) as any;

        // 言語未指定のコードブロックは CKEditor 側で plaintext になる
        // Code block không chỉ định ngôn ngữ sẽ thành plaintext ở phía CKEditor
        if ( result?.type === 'code' && result.lang === 'plaintext' ) {
            result.lang = null;
        }

        return result;
    }
};

function isEmptyParagraph( node: HastElement ): boolean {
    if ( node.tagName !== 'p' ) {
        return false;
    }

    return node.children.every( child => child.type === 'text' && /^[\s\u00a0]*$/.test( child.value ) );
}

// CKEditor は HTML で潰れる空白を U+00A0 で出すが Markdown では不要なので通常の空白に戻す
// CKEditor xuất khoảng trắng dễ bị gộp trong HTML thành U+00A0, Markdown không cần nên đổi lại thành khoảng trắng thường
function normalizeCollapsibleSpaces( tree: HastRoot ) {
    visit( tree, 'text', ( node, _index, parent ) => {
        if ( parent && parent.type === 'element' && ( parent.tagName === 'pre' || parent.tagName === 'code' ) ) {
            return;
        }

        node.value = node.value.replace( /^\u00a0|\u00a0$|(?<=[ \u00a0])\u00a0|\u00a0(?=[ \u00a0])/g, ' ' );
    } );
}

// 空の span があると前後の空白が消えるため、原文をテキストとして持たせる
// Span rỗng làm mất khoảng trắng xung quanh nên gán nguồn của nó làm nội dung văn bản
function fillRawInlineText( tree: HastRoot ) {
    visit( tree, 'element', ( node: HastElement ) => {
        if ( node.tagName === 'span' && classesOf( node ).includes( RAW_INLINE_CLASS ) ) {
            node.children = [ { type: 'text', value: attribute( node, 'dataMdSource' ) ?? 'x' } ];
        }
    } );
}

// hast-util-to-mdast は li や p の先頭にあるチェックボックスしか認識しないため構造を平らにする
// hast-util-to-mdast chỉ nhận checkbox ở đầu li hoặc p nên cần làm phẳng cấu trúc
function flattenTodoLabels( tree: HastRoot ) {
    visit( tree, 'element', ( item: HastElement ) => {
        if ( item.tagName !== 'li' ) {
            return;
        }

        item.children = item.children.flatMap( ( child ): ElementContent[] => {
            if ( child.type !== 'element' || child.tagName !== 'label' || !classesOf( child ).includes( 'todo-list__label' ) ) {
                return [ child ];
            }

            return child.children.flatMap( ( part ): ElementContent[] => {
                const isDescription = part.type === 'element' && classesOf( part ).includes( 'todo-list__label__description' );

                return isDescription ? ( part as HastElement ).children : [ part ];
            } );
        } );
    } );
}

// トップレベル要素 1 つを文書の 1 セグメントとして扱い、原文との対応付けを可能にする
// Mỗi phần tử HTML cấp cao nhất là một segment của tài liệu để có thể ghép cặp với nguồn gốc
export function htmlToSegments( html: string ): string[] {
    const hast = fromHtml( html, { fragment: true } ) as HastRoot;
    const segments: string[] = [];

    flattenTodoLabels( hast );
    fillRawInlineText( hast );
    normalizeCollapsibleSpaces( hast );

    for ( const child of hast.children ) {
        if ( child.type !== 'element' || isEmptyParagraph( child ) ) {
            continue;
        }

        if ( needsHtml( child ) ) {
            segments.push( xhtml( child ) );
            continue;
        }

        const mdast = toMdast( { type: 'root', children: [ child ] }, { handlers, document: true } ) as Root;

        if ( !mdast.children.length ) {
            continue;
        }

        const text = stringifier.stringify( mdast as Root ).replace( /\n+$/, '' );

        if ( text !== '' ) {
            segments.push( text );
        }
    }

    return segments;
}

export type { RootContent };
