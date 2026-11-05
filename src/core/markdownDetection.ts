/**
 * @license GPL-2.0-or-later
 * Copyright (c) ckeditor5-advanced-markdown contributors.
 * This program is free software; you can redistribute it and/or modify it under the terms of the
 * GNU General Public License as published by the Free Software Foundation; either version 2 of the
 * License, or (at your option) any later version.
 */

export interface MarkdownScore {
    score: number;
    features: string[];
}

interface Feature {
    name: string;
    pattern: RegExp;
    weight: number;
}

const FEATURES: Feature[] = [
    { name: 'frontmatter', pattern: /^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/, weight: 3 },
    { name: 'fence', pattern: /^\s{0,3}(?:```|~~~)/m, weight: 3 },
    { name: 'directive', pattern: /^:{2,}[A-Za-z][\w-]*/m, weight: 3 },
    { name: 'table', pattern: /^\s*\|?\s*:?-+:?\s*(?:\|\s*:?-+:?\s*)+\|?\s*$/m, weight: 3 },
    { name: 'taskList', pattern: /^\s*[-*+]\s\[[ xX]\]\s/m, weight: 3 },
    { name: 'heading', pattern: /^\s{0,3}#{1,6}\s+\S/m, weight: 2 },
    { name: 'list', pattern: /^\s*(?:[-*+]|\d+[.)])\s+\S/m, weight: 1 },
    { name: 'blockquote', pattern: /^\s{0,3}>\s?\S/m, weight: 1 },
    { name: 'link', pattern: /\[[^\]\n]+\]\([^)\s]+\)/, weight: 1 },
    { name: 'emphasis', pattern: /\*\*[^*\n]+\*\*|(?<![\w*])\*[^*\s][^*\n]*\*(?![\w*])/, weight: 1 },
    { name: 'inlineCode', pattern: /`[^`\n]+`/, weight: 1 }
];

// 貼り付けた文章を誤って構造化しないよう、構造の手がかりが複数あるときだけ Markdown とみなす
// Chỉ coi là Markdown khi có nhiều dấu hiệu cấu trúc để tránh biến văn bản thường thành cấu trúc
export const MARKDOWN_THRESHOLD = 3;

// 各特徴は 1 回だけ数え、長い文書だけが有利にならないようにする
// Mỗi đặc trưng chỉ tính một lần để tài liệu dài không được lợi thế
export function scoreMarkdown( text: string ): MarkdownScore {
    const features: string[] = [];
    let score = 0;

    for ( const { name, pattern, weight } of FEATURES ) {
        if ( pattern.test( text ) ) {
            features.push( name );
            score += weight;
        }
    }

    return { score, features };
}

// ここに無いタグを含む HTML は実際のリッチ内容なので既定の貼り付けに任せる
// HTML chứa thẻ ngoài danh sách này là nội dung giàu định dạng thật nên để cho đường dán mặc định xử lý
const WRAPPER_TAGS = new Set( [ 'html', 'head', 'meta', 'body', 'span', 'div', 'br', 'pre', 'code' ] );

export function isEditorWrapperHtml( html: string ): boolean {
    if ( !html.trim() ) {
        return true;
    }

    const doc = new DOMParser().parseFromString( html, 'text/html' );

    return Array.from( doc.querySelectorAll( '*' ) ).every( element => WRAPPER_TAGS.has( element.tagName.toLowerCase() ) );
}
