/**
 * @license GPL-2.0-or-later
 * Copyright (c) ckeditor5-advanced-markdown contributors.
 * This program is free software; you can redistribute it and/or modify it under the terms of the
 * GNU General Public License as published by the Free Software Foundation; either version 2 of the
 * License, or (at your option) any later version.
 */

import {
    Plugin, Essentials, Paragraph, Heading, Bold, Italic, Strikethrough, Code, Link, AutoLink, List, TodoList,
    BlockQuote, CodeBlock, HorizontalLine, Image, Table, Autoformat
} from 'ckeditor5';

// 未知の言語は CKEditor が plaintext にしてしまい、フェンスの言語名が失われるため一覧を渡す
// CKEditor biến ngôn ngữ lạ thành plaintext làm mất tên ngôn ngữ của fence nên cần truyền danh sách
export const CODE_LANGUAGES = [
    'plaintext', 'bash', 'c', 'cpp', 'csharp', 'css', 'diff', 'dockerfile', 'go', 'graphql', 'html', 'ini', 'java', 'javascript', 'js',
    'json', 'jsx', 'kotlin', 'less', 'lua', 'markdown', 'md', 'mdx', 'php', 'powershell', 'python', 'py', 'ruby', 'rust', 'scss', 'sh',
    'shell', 'sql', 'swift', 'toml', 'ts', 'tsx', 'typescript', 'vue', 'xml', 'yaml', 'yml', 'text'
];

// Heading と CodeBlock はコンストラクタで config.define() し最初の定義が優先されるので、先に構築される必要がある
// Heading và CodeBlock gọi config.define() trong constructor và định nghĩa đầu tiên thắng nên plugin này phải được dựng trước
export class AdvancedMarkdownPresetConfig extends Plugin {
    public static get pluginName() {
        return 'AdvancedMarkdownPresetConfig' as const;
    }

    constructor( editor: ConstructorParameters<typeof Plugin>[ 0 ] ) {
        super( editor );

        // Markdown の # は h1 に対応させる(CKEditor 既定は heading1 が h2)
        // # của Markdown ứng với h1 (mặc định của CKEditor heading1 là h2)
        editor.config.define( 'heading', {
            options: [
                { model: 'paragraph', title: 'Paragraph', class: 'ck-heading_paragraph' },
                ...[ 1, 2, 3, 4, 5, 6 ].map( level => ( {
                    model: `heading${ level }` as const,
                    view: `h${ level }` as const,
                    title: `Heading ${ level }`,
                    class: `ck-heading_heading${ level }`
                } ) )
            ]
        } );

        editor.config.define( 'codeBlock', {
            languages: CODE_LANGUAGES.map( language => ( { language, label: language } ) )
        } );
    }
}

// GFM で忠実に表現できる機能だけを既定にして、Markdown に落とすと情報が消える機能を除く
// Chỉ bật mặc định các tính năng GFM biểu diễn trung thực, bỏ các tính năng sẽ mất thông tin khi xuống Markdown
export class AdvancedMarkdownPreset extends Plugin {
    public static get requires() {
        return [
            AdvancedMarkdownPresetConfig, Essentials, Paragraph, Heading, Bold, Italic, Strikethrough, Code, Link, AutoLink, List, TodoList,
            BlockQuote, CodeBlock, HorizontalLine, Image, Table, Autoformat
        ] as const;
    }

    public static get pluginName() {
        return 'AdvancedMarkdownPreset' as const;
    }
}
