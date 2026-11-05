/**
 * @license GPL-2.0-or-later
 * Copyright (c) ckeditor5-advanced-markdown contributors.
 * This program is free software; you can redistribute it and/or modify it under the terms of the
 * GNU General Public License as published by the Free Software Foundation; either version 2 of the
 * License, or (at your option) any later version.
 */

export interface AdvancedMarkdownConfig {
    export?: {
        // 既定の書き出しファイル名。既定値は document.md
        // Tên file mặc định khi export, mặc định là document.md
        fileName?: string;
    };
    import?: {
        // 未保存の編集を import が上書きする前の確認。既定は window.confirm
        // Hỏi xác nhận trước khi import ghi đè thay đổi chưa lưu, mặc định là window.confirm
        confirm?: ( message: string ) => boolean | Promise<boolean>;
    };
    splitView?: {
        // 最後の入力から他方のペインへ同期するまでの待ち時間(ms)。既定は 300
        // Thời gian chờ (ms) từ lần gõ cuối đến khi đồng bộ sang pane kia, mặc định 300
        debounce?: number;
        // 分割表示中の両ペインの高さ(CSS)。既定は 70vh
        // Chiều cao CSS của cả hai pane khi mở split view, mặc định 70vh
        height?: string;
    };
}

declare module 'ckeditor5' {
    interface EditorConfig {
        advancedMarkdown?: AdvancedMarkdownConfig;
    }
}
