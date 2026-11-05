/**
 * @license GPL-2.0-or-later
 * Copyright (c) ckeditor5-advanced-markdown contributors.
 * This program is free software; you can redistribute it and/or modify it under the terms of the
 * GNU General Public License as published by the Free Software Foundation; either version 2 of the
 * License, or (at your option) any later version.
 */

import { parseDocument, type SourceDocument } from './document.js';
import { markdownToHtml } from './toView.js';
import { htmlToSegments } from './toMarkdown.js';
import { composeDocument } from './compose.js';

// 読み込み時の原文を覚えておかないと、未編集ブロックを元のバイト列で返せないため状態を持つ
// Phải nhớ nguồn lúc nạp thì mới trả lại đúng byte gốc cho block chưa sửa nên codec có trạng thái
export class MarkdownCodec {
    private _original: SourceDocument | null = null;
    private _baseline: string[] | null = null;

    public toHtml( markdown: string ): string {
        this._original = parseDocument( markdown );
        this._baseline = null;

        return markdownToHtml( markdown, this._original.tree );
    }

    // 貼り付けは文書そのものではないので、原文を記憶させないよう別経路にする
    // Dán không phải là chính tài liệu nên đi đường riêng để không ghi nhớ nguồn
    public toHtmlFragment( markdown: string ): string {
        return markdownToHtml( markdown, parseDocument( markdown ).tree );
    }

    public toMarkdown( html: string ): string {
        const segments = htmlToSegments( html );

        if ( !this._original ) {
            return segments.length ? segments.join( '\n\n' ) + '\n' : '';
        }

        this._baseline ??= segments;

        return composeDocument( this._original, this._baseline, segments );
    }

    // 原文を再利用しない直列化で、冪等性の確認と診断に使う
    // Serialize không dùng lại nguồn gốc, dùng để kiểm tra tính lũy đẳng và chẩn đoán
    public static normalize( html: string ): string[] {
        return htmlToSegments( html );
    }
}
