/**
 * @license GPL-2.0-or-later
 * Copyright (c) ckeditor5-advanced-markdown contributors.
 * This program is free software; you can redistribute it and/or modify it under the terms of the
 * GNU General Public License as published by the Free Software Foundation; either version 2 of the
 * License, or (at your option) any later version.
 */

import { Plugin, Widget, toWidget, toWidgetEditable } from 'ckeditor5';
import type { ModelElement, ViewElement, ViewDowncastWriter } from 'ckeditor5';
import { AdvancedMarkdownDataProcessor } from './dataprocessor.js';
import { DIRECTIVE_CLASS, DIRECTIVE_LEAF_CLASS, RAW_BLOCK_CLASS, RAW_INLINE_CLASS } from './core/toView.js';
import { formatDirectiveAttributes, parseAttributesJson } from './core/directiveAttributes.js';

const asAttributes = ( element: ModelElement ) => {
    const json = element.getAttribute( 'attrs' ) as string | undefined;

    return parseAttributesJson( json );
};

export function directiveSyntax( element: ModelElement, leaf: boolean ): string {
    const label = element.getAttribute( 'label' ) as string | undefined;
    const attributes = formatDirectiveAttributes( asAttributes( element ) );

    return ( leaf ? '::' : ':::' ) + element.getAttribute( 'name' ) + ( label ? `[${ label }]` : '' ) + ( attributes ? `{${ attributes }}` : '' );
}

// Markdown を data format にし、構造化できないものは生ブロックで失わずに保持する
// Dùng Markdown làm data format và giữ nguyên các phần không cấu trúc hóa được dưới dạng khối thô để không mất dữ liệu
export class AdvancedMarkdownEditing extends Plugin {
    public static get requires() {
        return [ Widget ] as const;
    }

    public static get pluginName() {
        return 'AdvancedMarkdownEditing' as const;
    }

    public init(): void {
        const editor = this.editor;

        const processor = new AdvancedMarkdownDataProcessor( editor.data.viewDocument );

        editor.data.processor = processor;

        // 読み込み直後のモデルを基準として記録するため、init / set の直後に一度シリアライズする
        // Serialize một lần ngay sau init / set để ghi lại baseline của model vừa nạp
        const captureBaseline = () => {
            editor.data.get();
        };

        // 内容が空に見える文書でも元の文字列をそのまま返すため trim を無効にする
        // Tắt trim để tài liệu trông như rỗng vẫn trả về đúng chuỗi gốc
        editor.data.on( 'get', ( _event, args ) => {
            args[ 0 ] = { ...( args[ 0 ] as object ), trim: ( args[ 0 ] as { trim?: string } | undefined )?.trim ?? 'none' };
        }, { priority: 'high' } );

        editor.data.on( 'init', captureBaseline, { priority: 'low' } );
        editor.data.on( 'set', captureBaseline, { priority: 'low' } );

        this._defineSchema();
        this._defineRawBlock();
        this._defineRawInline();
        this._defineDirectives();
    }

    private _defineSchema(): void {
        const schema = this.editor.model.schema;

        schema.register( 'mdRawBlock', {
            inheritAllFrom: '$blockObject',
            allowAttributes: [ 'kind', 'source' ]
        } );

        schema.register( 'mdRawInline', {
            inheritAllFrom: '$inlineObject',
            allowAttributes: [ 'kind', 'source' ]
        } );

        schema.register( 'mdDirective', {
            inheritAllFrom: '$blockObject',
            allowContentOf: '$root',
            isLimit: true,
            allowAttributes: [ 'name', 'label', 'attrs' ]
        } );

        schema.register( 'mdDirectiveLeaf', {
            inheritAllFrom: '$blockObject',
            allowAttributes: [ 'name', 'label', 'attrs' ]
        } );
    }

    private _defineRawBlock(): void {
        const editor = this.editor;
        const conversion = editor.conversion;

        conversion.for( 'upcast' ).elementToElement( {
            view: { name: 'div', classes: RAW_BLOCK_CLASS },
            model: ( viewElement, { writer } ) => writer.createElement( 'mdRawBlock', {
                kind: viewElement.getAttribute( 'data-md-kind' ),
                source: viewElement.getAttribute( 'data-md-source' )
            } ),
            converterPriority: 'high'
        } );

        conversion.for( 'dataDowncast' ).elementToElement( {
            model: 'mdRawBlock',
            view: ( modelElement, { writer } ) => writer.createContainerElement( 'div', {
                class: RAW_BLOCK_CLASS,
                'data-md-kind': modelElement.getAttribute( 'kind' ) as string,
                'data-md-source': modelElement.getAttribute( 'source' ) as string
            } )
        } );

        conversion.for( 'editingDowncast' ).elementToElement( {
            model: 'mdRawBlock',
            view: ( modelElement, { writer } ) => {
                const kind = modelElement.getAttribute( 'kind' ) as string;
                const container = writer.createContainerElement( 'div', { class: RAW_BLOCK_CLASS } );
                const body = writer.createRawElement( 'div', { class: 'md-raw-block__body', 'data-cke-ignore-events': 'true' }, domElement => {
                    const label = document.createElement( 'div' );
                    const textarea = document.createElement( 'textarea' );

                    label.className = 'md-raw-block__label';
                    label.textContent = kind;
                    textarea.value = modelElement.getAttribute( 'source' ) as string;
                    textarea.spellcheck = false;
                    textarea.rows = Math.max( 1, textarea.value.split( '\n' ).length );

                    // 入力中にモデルを更新すると要素が再生成されて焦点を失うため、変更確定時にだけ反映する
                    // Cập nhật model khi đang gõ sẽ tạo lại phần tử làm mất focus, nên chỉ ghi khi xác nhận thay đổi
                    textarea.addEventListener( 'change', () => {
                        editor.model.change( modelWriter => {
                            modelWriter.setAttribute( 'source', textarea.value, modelElement );
                        } );
                    } );

                    domElement.append( label, textarea );
                } );

                writer.insert( writer.createPositionAt( container, 0 ), body );

                return toWidget( container, writer, { label: `${ kind } block` } );
            }
        } );
    }

    private _defineRawInline(): void {
        const conversion = this.editor.conversion;

        conversion.for( 'upcast' ).elementToElement( {
            view: { name: 'span', classes: RAW_INLINE_CLASS },
            model: ( viewElement, { writer } ) => writer.createElement( 'mdRawInline', {
                kind: viewElement.getAttribute( 'data-md-kind' ),
                source: viewElement.getAttribute( 'data-md-source' )
            } ),
            converterPriority: 'high'
        } );

        const attributesOf = ( modelElement: ModelElement ) => ( {
            class: RAW_INLINE_CLASS,
            'data-md-kind': modelElement.getAttribute( 'kind' ) as string,
            'data-md-source': modelElement.getAttribute( 'source' ) as string
        } );

        conversion.for( 'dataDowncast' ).elementToElement( {
            model: 'mdRawInline',
            view: ( modelElement, { writer } ) => writer.createContainerElement( 'span', attributesOf( modelElement ) )
        } );

        conversion.for( 'editingDowncast' ).elementToElement( {
            model: 'mdRawInline',
            view: ( modelElement, { writer } ) => {
                const span = writer.createContainerElement( 'span', attributesOf( modelElement ) );
                const text = writer.createRawElement( 'span', {}, domElement => {
                    domElement.textContent = modelElement.getAttribute( 'source' ) as string;
                } );

                writer.insert( writer.createPositionAt( span, 0 ), text );

                return toWidget( span, writer, { label: `${ modelElement.getAttribute( 'kind' ) } inline` } );
            }
        } );
    }

    private _defineDirectives(): void {
        const conversion = this.editor.conversion;

        const dataAttributes = ( modelElement: ModelElement ) => {
            const attributes: Record<string, string> = { 'data-md-name': modelElement.getAttribute( 'name' ) as string };

            for ( const [ key, data ] of [ [ 'label', 'data-md-label' ], [ 'attrs', 'data-md-attrs' ] ] as const ) {
                const value = modelElement.getAttribute( key ) as string | undefined;

                if ( value ) {
                    attributes[ data ] = value;
                }
            }

            return attributes;
        };

        // 値が undefined の属性を渡すと「属性が存在する」扱いになり、後で setAttribute が失敗する
        // Truyền thuộc tính có giá trị undefined sẽ bị coi là đã tồn tại và setAttribute sau đó sẽ lỗi
        const upcastAttributes = ( viewElement: ViewElement ) => {
            const attributes: Record<string, string> = { name: viewElement.getAttribute( 'data-md-name' )! };

            for ( const [ key, data ] of [ [ 'label', 'data-md-label' ], [ 'attrs', 'data-md-attrs' ] ] as const ) {
                const value = viewElement.getAttribute( data );

                if ( value !== undefined ) {
                    attributes[ key ] = value;
                }
            }

            return attributes;
        };

        conversion.for( 'upcast' ).elementToElement( {
            view: { name: 'div', classes: DIRECTIVE_CLASS },
            model: ( viewElement, { writer } ) => writer.createElement( 'mdDirective', upcastAttributes( viewElement ) ),
            converterPriority: 'high'
        } );

        conversion.for( 'upcast' ).elementToElement( {
            view: { name: 'div', classes: DIRECTIVE_LEAF_CLASS },
            model: ( viewElement, { writer } ) => writer.createElement( 'mdDirectiveLeaf', upcastAttributes( viewElement ) ),
            converterPriority: 'high'
        } );

        conversion.for( 'dataDowncast' ).elementToStructure( {
            model: 'mdDirective',
            view: ( modelElement, { writer } ) => writer.createContainerElement(
                'div',
                { class: DIRECTIVE_CLASS, ...dataAttributes( modelElement ) },
                [ writer.createSlot() ]
            )
        } );

        conversion.for( 'dataDowncast' ).elementToElement( {
            model: 'mdDirectiveLeaf',
            view: ( modelElement, { writer } ) => writer.createContainerElement(
                'div',
                { class: DIRECTIVE_LEAF_CLASS, ...dataAttributes( modelElement ) }
            )
        } );

        conversion.for( 'editingDowncast' ).elementToStructure( {
            model: 'mdDirective',
            view: ( modelElement, { writer }: { writer: ViewDowncastWriter } ) => {
                const body = writer.createEditableElement( 'div', { class: 'md-directive__body' } );
                const section = writer.createContainerElement( 'section', {
                    class: DIRECTIVE_CLASS,
                    'data-md-title': directiveSyntax( modelElement, false )
                }, [ body ] );

                writer.insert( writer.createPositionAt( body, 0 ), writer.createSlot() );
                toWidgetEditable( body, writer );

                return toWidget( section, writer, { label: `${ modelElement.getAttribute( 'name' ) } directive`, hasSelectionHandle: true } );
            }
        } );

        conversion.for( 'editingDowncast' ).elementToElement( {
            model: 'mdDirectiveLeaf',
            view: ( modelElement, { writer } ) => {
                const container = writer.createContainerElement( 'div', { class: DIRECTIVE_LEAF_CLASS } );
                const text = writer.createRawElement( 'span', {}, domElement => {
                    domElement.textContent = directiveSyntax( modelElement, true );
                } );

                writer.insert( writer.createPositionAt( container, 0 ), text );

                return toWidget( container, writer, { label: `${ modelElement.getAttribute( 'name' ) } directive` } );
            }
        } );
    }
}
