/**
 * @license GPL-2.0-or-later
 * Copyright (c) ckeditor5-advanced-markdown contributors.
 * This program is free software; you can redistribute it and/or modify it under the terms of the
 * GNU General Public License as published by the Free Software Foundation; either version 2 of the
 * License, or (at your option) any later version.
 */

import { Plugin, ClipboardPipeline } from 'ckeditor5';
import { isEditorWrapperHtml, MARKDOWN_THRESHOLD, scoreMarkdown } from './core/markdownDetection.js';
import { MarkdownCodec } from './core/codec.js';

// 貼り付け元の HTML が編集アプリの飾りだけのときに限り text/plain を Markdown として扱い、リッチ HTML は壊さない
// Chỉ coi text/plain là Markdown khi HTML dán vào chỉ là lớp bọc của trình soạn thảo, HTML giàu định dạng thì không đụng tới
export class AdvancedMarkdownPaste extends Plugin {
    public static get requires() {
        return [ ClipboardPipeline ] as const;
    }

    public static get pluginName() {
        return 'AdvancedMarkdownPaste' as const;
    }

    private _shiftPaste = false;

    public init(): void {
        const editor = this.editor;
        const viewDocument = editor.editing.view.document;

        // Ctrl/Cmd+Shift+V の貼り付けイベントには修飾キーの情報が無いので keydown で覚えておく
        // Sự kiện paste của Ctrl/Cmd+Shift+V không mang thông tin phím bổ trợ nên ghi nhớ từ keydown
        viewDocument.on( 'keydown', ( _event, data ) => {
            this._shiftPaste = data.shiftKey && ( data.ctrlKey || data.metaKey ) && data.keyCode === 86;
        }, { priority: 'highest' } );

        viewDocument.on( 'clipboardInput', ( _event, data ) => {
            const shift = this._shiftPaste;

            this._shiftPaste = false;

            if ( shift || data.method !== 'paste' ) {
                return;
            }

            const html = data.dataTransfer.getData( 'text/html' );
            const text = data.dataTransfer.getData( 'text/plain' );

            if ( !text || !isEditorWrapperHtml( html ) || scoreMarkdown( text ).score < MARKDOWN_THRESHOLD ) {
                return;
            }

            // 貼り付け用に別のコーデックを使い、読み込み済み文書の原文情報を壊さない
            // Dùng codec riêng cho paste để không làm hỏng thông tin nguồn của tài liệu đã nạp
            const content = editor.data.htmlProcessor.toView( new MarkdownCodec().toHtmlFragment( text ) );
            const first = content.getChild( 0 );
            const selection = editor.model.document.selection;
            const block = selection.getFirstPosition()!.parent;

            // 見出しなどの先頭ブロックが既存の文字に結合されて消えないよう、先に段落を分割する
            // Tách đoạn trước để block đầu như heading không bị gộp vào chữ có sẵn rồi mất
            if ( selection.isCollapsed && first?.is( 'element' ) && first.name !== 'p' && block.is( 'element' ) && block.name === 'paragraph' && block.maxOffset > 0 ) {
                const atEnd = selection.getFirstPosition()!.isAtEnd;

                editor.execute( 'enter' );

                // 途中で分割したときは空段落を挟み、末尾ブロックが後半の文字に結合されないようにする
                // Khi tách giữa chừng thì chèn đoạn rỗng để block cuối không bị gộp vào phần chữ phía sau
                if ( !atEnd ) {
                    editor.execute( 'enter' );
                    editor.model.change( writer => writer.setSelection( selection.getFirstPosition()!.parent.previousSibling!, 'in' ) );
                }
            }

            data.content = content;
        }, { priority: 'high' } );
    }
}
