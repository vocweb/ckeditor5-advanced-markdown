/**
 * @license GPL-2.0-or-later
 * Copyright (c) ckeditor5-advanced-markdown contributors.
 * This program is free software; you can redistribute it and/or modify it under the terms of the
 * GNU General Public License as published by the Free Software Foundation; either version 2 of the
 * License, or (at your option) any later version.
 */

import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkDirective from 'remark-directive';
import remarkFrontmatter from 'remark-frontmatter';
import remarkStringify from 'remark-stringify';
import type { Root, RootContent } from 'mdast';
import { listKind } from './mappable.js';

// remark-directive の型拡張を有効にする
// Kích hoạt khai báo kiểu mở rộng của remark-directive
import 'mdast-util-directive';

// オフセットを使う全処理が同じ方言で解析した木を参照するよう、パーサを 1 つに集約する
// Gom về một parser để mọi xử lý dùng offset đều tham chiếu cùng một cây theo cùng phương ngữ
export const parser = unified()
    .use(remarkParse)
    .use(remarkFrontmatter, ['yaml'])
    .use(remarkGfm)
    .use(remarkDirective);

// 出力スタイルを固定すると再シリアライズが冪等になる
// Cố định style đầu ra để việc serialize lại có tính lũy đẳng
export const stringifier = unified()
    .use(remarkParse)
    .use(remarkFrontmatter, ['yaml'])
    .use(remarkGfm)
    .use(remarkDirective)
    .use(remarkStringify, {
        bullet: '-',
        bulletOther: '*',
        emphasis: '*',
        strong: '*',
        rule: '-',
        fence: '`',
        fences: true,
        listItemIndent: 'one',
        incrementListMarker: true,
        resourceLink: true
    });

// 未編集ブロックを元のバイト列で返すため、ノードごとに原文と直前の空白を保持する
// Giữ nguồn và khoảng trắng đứng trước của từng node để trả lại đúng byte gốc cho block chưa sửa
export interface SourceBlock {
    node: RootContent;
    source: string;
    gapBefore: string;
}

export interface SourceDocument {
    markdown: string;
    tree: Root;
    blocks: SourceBlock[];
    tail: string;
    // 書き換えたブロックにも原文と同じ改行コードを使うため
    // Để block được viết lại cũng dùng cùng kiểu xuống dòng với nguồn gốc
    eol: '\n' | '\r\n';
}

export function parseDocument( markdown: string ): SourceDocument {
    const tree = parser.parse( markdown ) as Root;
    const blocks: SourceBlock[] = [];
    let cursor = 0;

    for ( const node of tree.children ) {
        const start = node.position!.start.offset!;
        const end = node.position!.end.offset!;
        const previous = blocks.at( -1 );
        const kind = listKind( node );

        // CKEditor は隣り合う同種のリストを 1 つに結合するので、原文側も 1 ブロックとして扱う
        // CKEditor gộp các list cùng loại đứng liền nhau thành một, nên phía nguồn cũng coi là một block
        if ( previous && kind !== null && kind === listKind( previous.node ) ) {
            previous.source = markdown.slice( cursor - previous.source.length, end );
            cursor = end;
            continue;
        }

        blocks.push( {
            node,
            source: markdown.slice( start, end ),
            gapBefore: markdown.slice( cursor, start )
        } );
        cursor = end;
    }

    return {
        markdown,
        tree,
        blocks,
        tail: markdown.slice( cursor ),
        eol: markdown.includes( '\r\n' ) ? '\r\n' : '\n'
    };
}

export function sliceOf( markdown: string, node: { position?: Root[ 'position' ] } ): string {
    return markdown.slice( node.position!.start.offset!, node.position!.end.offset! );
}
