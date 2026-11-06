/**
 * @license GPL-2.0-or-later
 * Copyright (c) ckeditor5-advanced-markdown contributors.
 * This program is free software; you can redistribute it and/or modify it under the terms of the
 * GNU General Public License as published by the Free Software Foundation; either version 2 of the
 * License, or (at your option) any later version.
 */

import { Plugin } from 'ckeditor5';
import { AdvancedMarkdownEditing } from './editing.js';
import { AdvancedMarkdownPreset } from './preset.js';
import { AdvancedMarkdownPaste } from './paste.js';
import { AdvancedMarkdownImportExport } from './importexport.js';
import { AdvancedMarkdownDirectiveUI } from './directive.js';
import { AdvancedMarkdownSplitView } from './splitview.js';

// 利用者が 1 つのプラグインだけ登録すれば全機能が揃うようにするための統合プラグイン
// Plugin gộp để người dùng chỉ cần đăng ký một plugin là có đủ mọi tính năng
export class AdvancedMarkdown extends Plugin {
    public static get requires() {
        return [
            AdvancedMarkdownEditing, AdvancedMarkdownPreset, AdvancedMarkdownPaste, AdvancedMarkdownImportExport,
            AdvancedMarkdownDirectiveUI, AdvancedMarkdownSplitView
        ] as const;
    }

    public static get pluginName() {
        return 'AdvancedMarkdown' as const;
    }
}
