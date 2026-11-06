/**
 * @license GPL-2.0-or-later
 * Copyright (c) ckeditor5-advanced-markdown contributors.
 * This program is free software; you can redistribute it and/or modify it under the terms of the
 * GNU General Public License as published by the Free Software Foundation; either version 2 of the
 * License, or (at your option) any later version.
 */

import { Plugin, ButtonView, IconBrowseFiles } from 'ckeditor5';
import './config.js';

const EXPORT_ICON = '<svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M10 13.5 5.5 9h3V3h3v6h3L10 13.5ZM4 15h12v2H4v-2Z"/></svg>';

// エクスポートは getData() をそのまま UTF-8 で書き出し、インポートは確認後に setData() する
// Export ghi nguyên getData() dạng UTF-8, import gọi setData() sau khi xác nhận
export class AdvancedMarkdownImportExport extends Plugin {
    public static get pluginName() {
        return 'AdvancedMarkdownImportExport' as const;
    }

    // 現在値と異なれば未保存の編集があると判断するための基準
    // Mốc để biết có thay đổi chưa lưu khi giá trị hiện tại khác nó
    private _syncedData = '';

    public init(): void {
        const editor = this.editor;

        editor.config.define( 'advancedMarkdown.export.fileName', 'document.md' );

        const markSynced = () => {
            this._syncedData = editor.getData();
        };

        editor.data.on( 'init', markSynced, { priority: 'lowest' } );
        editor.data.on( 'set', markSynced, { priority: 'lowest' } );

        editor.ui.componentFactory.add( 'exportMarkdown', locale => {
            const button = new ButtonView( locale );

            button.set( { label: 'Export Markdown', icon: EXPORT_ICON, tooltip: true } );
            button.on( 'execute', () => this.exportMarkdown() );

            return button;
        } );

        editor.ui.componentFactory.add( 'importMarkdown', locale => {
            const button = new ButtonView( locale );

            button.set( { label: 'Import Markdown', icon: IconBrowseFiles, tooltip: true } );
            button.on( 'execute', () => this.pickAndImport() );

            return button;
        } );
    }

    public get hasUnsavedChanges(): boolean {
        return this.editor.getData() !== this._syncedData;
    }

    public exportMarkdown(): void {
        const data = this.editor.getData();
        const fileName = this.editor.config.get( 'advancedMarkdown.export.fileName' ) as string;
        const url = URL.createObjectURL( new Blob( [ data ], { type: 'text/markdown;charset=utf-8' } ) );
        const link = document.createElement( 'a' );

        link.href = url;
        link.download = fileName;
        document.body.append( link );
        link.click();
        link.remove();
        URL.revokeObjectURL( url );

        this._syncedData = data;
    }

    // 未保存の編集を黙って失わないよう、置き換え前に確認する
    // Hỏi xác nhận trước khi thay thế để không âm thầm mất thay đổi chưa lưu
    public async importMarkdown( text: string ): Promise<boolean> {
        if ( this.hasUnsavedChanges ) {
            const confirm = this.editor.config.get( 'advancedMarkdown.import.confirm' ) ??
                ( ( message: string ) => window.confirm( message ) );

            if ( !await confirm( 'The document has unsaved changes. Replace it with the imported file?' ) ) {
                return false;
            }
        }

        this.editor.setData( text );

        return true;
    }

    public pickAndImport(): void {
        const input = document.createElement( 'input' );

        input.type = 'file';
        input.accept = '.md,.markdown,.mdx,text/markdown,text/plain';
        input.addEventListener( 'change', async () => {
            const file = input.files?.[ 0 ];

            if ( file ) {
                await this.importMarkdown( await file.text() );
            }
        } );
        input.click();
    }
}
