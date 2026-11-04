/**
 * @license GPL-2.0-or-later
 * Copyright (c) ckeditor5-advanced-markdown contributors.
 * This program is free software; you can redistribute it and/or modify it under the terms of the
 * GNU General Public License as published by the Free Software Foundation; either version 2 of the
 * License, or (at your option) any later version.
 */

import { toHast } from 'mdast-util-to-hast';
import type { State } from 'mdast-util-to-hast';
import { toHtml } from 'hast-util-to-html';
import { visit } from 'unist-util-visit';
import type { Root as HastRoot, Element as HastElement, ElementContent, Text } from 'hast';
import type { Nodes, Parents, Root, RootContent } from 'mdast';
import { sliceOf } from './document.js';
import { isMappable } from './mappable.js';

export const RAW_BLOCK_CLASS = 'md-raw-block';
export const RAW_INLINE_CLASS = 'md-raw-inline';
export const DIRECTIVE_CLASS = 'md-directive';
export const DIRECTIVE_LEAF_CLASS = 'md-directive-leaf';

const MDX_PARAGRAPH = /^(?:import|export)\s|^\{[\s\S]*\}$/;
const FLOW_PARENTS = new Set( [ 'root', 'blockquote', 'listItem', 'containerDirective', 'footnoteDefinition' ] );

// CKEditor は属性値の改行コードを正規化するので先に揃える
// CKEditor chuẩn hóa ký tự xuống dòng trong giá trị thuộc tính nên chuẩn hóa trước
const lf = ( text: string ) => text.replace( /\r\n?/g, '\n' );

function rawBlock( kind: string, source: string ): HastElement {
    return {
        type: 'element',
        tagName: 'div',
        properties: { className: [ RAW_BLOCK_CLASS ], dataMdKind: kind, dataMdSource: lf( source ) },
        children: []
    };
}

function rawInline( kind: string, source: string ): HastElement {
    return {
        type: 'element',
        tagName: 'span',
        properties: { className: [ RAW_INLINE_CLASS ], dataMdKind: kind, dataMdSource: lf( source ) },
        children: [ { type: 'text', value: lf( source ) } ]
    };
}


function directiveAttributes( attributes: Record<string, string | null | undefined> | null | undefined ) {
    const entries = Object.entries( attributes ?? {} ).filter( ( [ , value ] ) => value !== undefined );

    return entries.length ? JSON.stringify( Object.fromEntries( entries ) ) : undefined;
}

export function markdownToHtml( markdown: string, tree: Root ): string {
    // 元の木を壊さないよう浅いコピーで置き換える
    // Thay bằng bản sao nông để không làm hỏng cây gốc
    const children = tree.children.map( node => {
        if ( node.type === 'paragraph' && MDX_PARAGRAPH.test( sliceOf( markdown, node ) ) ) {
            return { type: 'mdxRaw', kind: 'mdx', value: sliceOf( markdown, node ) } as unknown as RootContent;
        }

        if ( !isMappable( node ) ) {
            return { type: 'mdxRaw', kind: 'unsupported', value: sliceOf( markdown, node ) } as unknown as RootContent;
        }

        return node;
    } );

    const hast = toHast( { ...tree, children }, {
        handlers: {
            mdxRaw: ( _state: State, node: any ) => rawBlock( node.kind, node.value ),
            html: ( _state: State, node: any, parent: Parents | undefined ) => {
                const isFlow = !parent || FLOW_PARENTS.has( parent.type );

                return isFlow ? rawBlock( 'html', node.value ) : rawInline( 'html', node.value );
            },
            definition: ( _state: State, node: any ) => rawBlock( 'definition', sliceOf( markdown, node ) ),
            footnoteDefinition: ( _state: State, node: any ) => rawBlock( 'footnote', sliceOf( markdown, node ) ),
            footnoteReference: ( _state: State, node: any ) => rawInline( 'footnote', sliceOf( markdown, node ) ),
            yaml: ( _state: State, node: any ) => rawBlock( 'frontmatter', sliceOf( markdown, node ) ),
            textDirective: ( _state: State, node: any ) => rawInline( 'directive', sliceOf( markdown, node ) ),
            leafDirective: ( _state: State, node: any ): HastElement => {
                const label = node.children.length ?
                    markdown.slice( node.children[ 0 ].position.start.offset, node.children.at( -1 ).position.end.offset ) :
                    undefined;

                return {
                    type: 'element',
                    tagName: 'div',
                    properties: {
                        className: [ DIRECTIVE_LEAF_CLASS ],
                        dataMdName: node.name,
                        dataMdLabel: label,
                        dataMdAttrs: directiveAttributes( node.attributes )
                    },
                    children: []
                };
            },
            containerDirective: ( state: State, node: any ): HastElement => {
                const [ first, ...rest ] = node.children;
                const hasLabel = first?.type === 'paragraph' && first.data?.directiveLabel;
                const body: Nodes[] = hasLabel ? rest : node.children;

                return {
                    type: 'element',
                    tagName: 'div',
                    properties: {
                        className: [ DIRECTIVE_CLASS ],
                        dataMdName: node.name,
                        dataMdLabel: hasLabel ? sliceOf( markdown, first ).replace( /^\[|\]$/g, '' ) : undefined,
                        dataMdAttrs: directiveAttributes( node.attributes )
                    },
                    children: state.all( { type: 'root', children: body } as any ) as ElementContent[]
                };
            }
        }
    } as any ) as HastRoot;

    toCkeditorTaskLists( hast );

    return toHtml( hast );
}

// CKEditor の todo リストは独自の label と checkbox 構造を前提に upcast するため
// Upcast todo list của CKEditor dựa trên cấu trúc label và checkbox riêng
function toCkeditorTaskLists( tree: HastRoot ) {
    visit( tree, 'element', ( list: HastElement ) => {
        const classes = ( list.properties.className ?? [] ) as string[];

        if ( list.tagName !== 'ul' || !classes.includes( 'contains-task-list' ) ) {
            return;
        }

        list.properties.className = [ 'todo-list' ];

        for ( const item of list.children ) {
            if ( item.type !== 'element' || item.tagName !== 'li' ) {
                continue;
            }

            // 緩いリストでは最初の段落の中にチェックボックスがある
            // Với list 'loose' checkbox nằm trong đoạn văn đầu tiên
            const flat: ElementContent[] = [];

            for ( const child of item.children ) {
                if ( child.type === 'element' && child.tagName === 'p' ) {
                    flat.push( ...child.children );
                } else {
                    flat.push( child );
                }
            }

            const checkbox = flat.find( ( child ): child is HastElement => child.type === 'element' && child.tagName === 'input' );
            const description: ElementContent[] = [];
            const nested: ElementContent[] = [];

            for ( const child of flat ) {
                if ( child === checkbox ) {
                    continue;
                }

                if ( child.type === 'element' && ( child.tagName === 'ul' || child.tagName === 'ol' ) ) {
                    nested.push( child );
                } else {
                    description.push( child );
                }
            }

            // チェックボックス直後の空白と改行は構文であって内容ではない
            // Khoảng trắng và xuống dòng quanh checkbox là cú pháp chứ không phải nội dung
            while ( description[ 0 ]?.type === 'text' && !( description[ 0 ] as Text ).value.trim() ) {
                description.shift();
            }

            while ( description.at( -1 )?.type === 'text' && !( description.at( -1 ) as Text ).value.trim() ) {
                description.pop();
            }

            const first = description[ 0 ];
            const last = description.at( -1 );

            if ( first?.type === 'text' ) {
                first.value = first.value.trimStart();
            }

            if ( last?.type === 'text' ) {
                last.value = last.value.trimEnd();
            }

            item.properties = {};
            item.children = [
                {
                    type: 'element',
                    tagName: 'label',
                    properties: { className: [ 'todo-list__label' ] },
                    children: [
                        {
                            type: 'element',
                            tagName: 'input',
                            properties: { type: 'checkbox', disabled: true, checked: Boolean( checkbox?.properties.checked ) },
                            children: []
                        },
                        {
                            type: 'element',
                            tagName: 'span',
                            properties: { className: [ 'todo-list__label__description' ] },
                            children: description
                        }
                    ]
                },
                ...nested
            ];
        }
    } );
}
