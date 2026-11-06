/**
 * @license GPL-2.0-or-later
 * Copyright (c) ckeditor5-advanced-markdown contributors.
 * This program is free software; you can redistribute it and/or modify it under the terms of the
 * GNU General Public License as published by the Free Software Foundation; either version 2 of the
 * License, or (at your option) any later version.
 */

import { HtmlDataProcessor } from 'ckeditor5';
import type { DataProcessor, ViewDocument, ViewDocumentFragment, MatcherPattern } from 'ckeditor5';
import { MarkdownCodec } from './core/codec.js';

// Markdown と CKEditor の view の間を変換しつつ、ブロック単位で原文を保つため
// Chuyển đổi giữa Markdown và view của CKEditor đồng thời giữ nguồn theo từng block
export class AdvancedMarkdownDataProcessor implements DataProcessor {
    public readonly codec = new MarkdownCodec();
    private readonly _html: HtmlDataProcessor;

    constructor( document: ViewDocument ) {
        this._html = new HtmlDataProcessor( document );
    }

    public toView( data: string ): ViewDocumentFragment {
        return this._html.toView( this.codec.toHtml( data ) );
    }

    public toData( viewFragment: ViewDocumentFragment ): string {
        return this.codec.toMarkdown( this._html.toData( viewFragment ) );
    }

    public registerRawContentMatcher( pattern: MatcherPattern ): void {
        this._html.registerRawContentMatcher( pattern );
    }

    public useFillerType( type: 'default' | 'marked' ): void {
        this._html.useFillerType( type );
    }

}
