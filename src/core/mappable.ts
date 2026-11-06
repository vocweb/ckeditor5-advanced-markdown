/**
 * @license GPL-2.0-or-later
 * Copyright (c) ckeditor5-advanced-markdown contributors.
 * This program is free software; you can redistribute it and/or modify it under the terms of the
 * GNU General Public License as published by the Free Software Foundation; either version 2 of the
 * License, or (at your option) any later version.
 */

import type { RootContent, List } from 'mdast';

const LIST_ITEM_CHILDREN = new Set( [ 'paragraph', 'list' ] );

// CKEditor の構造に落とすと情報が消えるものは生ブロックにして失わないようにする
// Cấu trúc mà CKEditor không giữ được thì chuyển thành khối thô để không mất dữ liệu
export function isMappable( node: RootContent ): boolean {
    if ( node.type === 'list' ) {
        const tasks = node.children.filter( item => typeof item.checked === 'boolean' ).length;

        if ( tasks !== 0 && tasks !== node.children.length ) {
            return false;
        }

        return node.children.every( item => item.children.every( child => LIST_ITEM_CHILDREN.has( child.type ) && isMappable( child ) ) );
    }

    if ( node.type === 'blockquote' || node.type === 'containerDirective' ) {
        return node.children.every( isMappable );
    }

    return true;
}

// CKEditor は隣接する同種リストを 1 つに結合するため、原文側も 1 ブロックとして数える
// CKEditor gộp các list cùng loại đứng liền nhau nên phía nguồn cũng đếm là một block
export function listKind( node: RootContent ): string | null {
    if ( node.type !== 'list' || !isMappable( node ) ) {
        return null;
    }

    const tasks = node.children.length > 0 && node.children.every( item => typeof item.checked === 'boolean' );

    return tasks ? 'todo' : ( node as List ).ordered ? 'ordered' : 'bullet';
}
