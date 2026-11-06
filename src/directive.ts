/**
 * @license GPL-2.0-or-later
 * Copyright (c) ckeditor5-advanced-markdown contributors.
 * This program is free software; you can redistribute it and/or modify it under the terms of the
 * GNU General Public License as published by the Free Software Foundation; either version 2 of the
 * License, or (at your option) any later version.
 */

import {
    Plugin, Command, ButtonView, ContextualBalloon, View, LabeledFieldView, SwitchButtonView, createLabeledInputText, submitHandler,
    KeystrokeHandler, FocusTracker, IconCheck, IconCancel, IconPlus, IconPencil, clickOutsideHandler
} from 'ckeditor5';
import type { Editor, Locale, ModelElement, InputTextView } from 'ckeditor5';
import { formatDirectiveAttributes, parseAttributesJson, parseDirectiveAttributes } from './core/directiveAttributes.js';

const DIRECTIVE_NAME = /^[A-Za-z][\w-]*$/;

export interface DirectiveValues {
    name: string;
    label?: string;
    attributes?: string;
    leaf?: boolean;
}

type TextField = LabeledFieldView<InputTextView>;
const valueOf = ( field: TextField ) => ( field.fieldView.element as HTMLInputElement ).value;

export class InsertDirectiveCommand extends Command {
    public override refresh(): void {
        const position = this.editor.model.document.selection.getFirstPosition()!;

        this.isEnabled = this.editor.model.schema.findAllowedParent( position, 'mdDirective' ) !== null;
    }

    public override execute( values: DirectiveValues ): void {
        const { model } = this.editor;

        if ( !DIRECTIVE_NAME.test( values.name ) ) {
            return;
        }

        model.change( writer => {
            const element = writer.createElement( values.leaf ? 'mdDirectiveLeaf' : 'mdDirective', directiveAttributes( values ) );

            if ( !values.leaf ) {
                writer.appendElement( 'paragraph', element );
            }

            model.insertObject( element, null, null, { setSelection: 'on' } );

            if ( !values.leaf ) {
                writer.setSelection( writer.createPositionAt( element.getChild( 0 ) as ModelElement, 0 ) );
            }
        } );
    }
}

function directiveAttributes( values: DirectiveValues ) {
    const attributes = parseDirectiveAttributes( values.attributes ?? '' );
    const result: Record<string, string> = { name: values.name };

    if ( values.label ) {
        result.label = values.label;
    }

    if ( Object.keys( attributes ).length ) {
        result.attrs = JSON.stringify( attributes );
    }

    return result;
}

// 選択がウィジェット自体でも、その内側でも同じ編集操作を使えるようにする
// Cho phép dùng cùng thao tác sửa dù vùng chọn là chính widget hay nằm bên trong nó
export function findEditableTarget( editor: Editor ): ModelElement | null {
    const selection = editor.model.document.selection;
    const selected = selection.getSelectedElement();

    if ( selected && [ 'mdDirective', 'mdDirectiveLeaf', 'mdRawInline', 'mdRawBlock' ].includes( selected.name ) ) {
        return selected;
    }

    return selection.getFirstPosition()!.findAncestor( 'mdDirective' );
}

export class UpdateDirectiveCommand extends Command {
    public override refresh(): void {
        this.isEnabled = findEditableTarget( this.editor ) !== null;
    }

    public override execute( values: DirectiveValues & { source?: string } ): void {
        const target = findEditableTarget( this.editor );

        if ( !target ) {
            return;
        }

        this.editor.model.change( writer => {
            if ( target.name === 'mdRawInline' || target.name === 'mdRawBlock' ) {
                writer.setAttribute( 'source', values.source ?? '', target );

                return;
            }

            if ( !DIRECTIVE_NAME.test( values.name ) ) {
                return;
            }

            const next = directiveAttributes( values );

            for ( const key of [ 'name', 'label', 'attrs' ] ) {
                if ( next[ key ] !== undefined ) {
                    writer.setAttribute( key, next[ key ], target );
                } else {
                    writer.removeAttribute( key, target );
                }
            }
        } );
    }
}

class DirectiveFormView extends View {
    public readonly nameInput: TextField;
    public readonly labelInput: TextField;
    public readonly attributesInput: TextField;
    public readonly sourceInput: TextField;
    public readonly leafSwitch: SwitchButtonView;
    public readonly saveButton: ButtonView;
    public readonly cancelButton: ButtonView;
    public readonly keystrokes = new KeystrokeHandler();
    public readonly focusTracker = new FocusTracker();

    constructor( locale: Locale ) {
        super( locale );

        const field = ( label: string ) => {
            const view = new LabeledFieldView( locale, createLabeledInputText ) as TextField;

            view.label = label;

            return view;
        };

        this.nameInput = field( 'Name' );
        this.labelInput = field( 'Label' );
        this.attributesInput = field( 'Attributes (.class #id key="value")' );
        this.sourceInput = field( 'Source' );

        this.leafSwitch = new SwitchButtonView( locale );
        this.leafSwitch.set( { label: 'Single line (leaf)', withText: true } );

        this.saveButton = new ButtonView( locale );
        this.saveButton.set( { label: 'Save', icon: IconCheck, tooltip: true, withText: true, type: 'submit' } );

        this.cancelButton = new ButtonView( locale );
        this.cancelButton.set( { label: 'Cancel', icon: IconCancel, tooltip: true, withText: true } );
        this.cancelButton.delegate( 'execute' ).to( this, 'cancel' );

        this.setTemplate( {
            tag: 'form',
            attributes: { class: [ 'ck', 'ck-md-directive-form' ], tabindex: '-1' },
            children: [
                this.nameInput, this.labelInput, this.attributesInput, this.sourceInput, this.leafSwitch,
                { tag: 'div', attributes: { class: [ 'ck-md-directive-form__actions' ] }, children: [ this.saveButton, this.cancelButton ] }
            ]
        } );
    }

    public override render(): void {
        super.render();

        submitHandler( { view: this } );
        this.keystrokes.listenTo( this.element! );
        this.keystrokes.set( 'Esc', ( _data, cancel ) => {
            this.fire( 'cancel' );
            cancel();
        } );

        for ( const view of [ this.nameInput, this.labelInput, this.attributesInput, this.sourceInput ] ) {
            this.focusTracker.add( view.element! );
        }
    }

    // 編集対象によって必要な入力欄が違うので、モードごとに表示を切り替える
    // Mỗi đối tượng sửa cần ô nhập khác nhau nên đổi hiển thị theo chế độ
    public configure( mode: 'insert' | 'directive' | 'raw', values: Partial<DirectiveValues> & { source?: string } ): void {
        const raw = mode === 'raw';

        this.nameInput.isEnabled = !raw;
        this.nameInput.element!.style.display = raw ? 'none' : '';
        this.labelInput.element!.style.display = raw ? 'none' : '';
        this.attributesInput.element!.style.display = raw ? 'none' : '';
        this.sourceInput.element!.style.display = raw ? '' : 'none';
        this.leafSwitch.element!.style.display = mode === 'insert' ? '' : 'none';

        this.nameInput.fieldView.value = values.name ?? '';
        this.labelInput.fieldView.value = values.label ?? '';
        this.attributesInput.fieldView.value = values.attributes ?? '';
        this.sourceInput.fieldView.value = values.source ?? '';
        this.leafSwitch.isOn = Boolean( values.leaf );
    }

    public focusFirst(): void {
        const raw = this.sourceInput.element!.style.display !== 'none';

        ( raw ? this.sourceInput : this.nameInput ).focus();
    }
}

// directive と生インラインの挿入・編集を 1 つのバルーンフォームにまとめるため
// Gom việc chèn và sửa directive cùng raw inline vào một form balloon
export class AdvancedMarkdownDirectiveUI extends Plugin {
    public static get requires() {
        return [ ContextualBalloon ] as const;
    }

    public static get pluginName() {
        return 'AdvancedMarkdownDirectiveUI' as const;
    }

    public form!: DirectiveFormView;
    private _balloon!: ContextualBalloon;
    private _mode: 'insert' | 'directive' | 'raw' = 'insert';

    public init(): void {
        const editor = this.editor;

        editor.commands.add( 'insertDirective', new InsertDirectiveCommand( editor ) );
        editor.commands.add( 'updateDirective', new UpdateDirectiveCommand( editor ) );

        this._balloon = editor.plugins.get( ContextualBalloon );
        this.form = new DirectiveFormView( editor.locale );
        this.form.render();

        this.form.on( 'submit', () => {
            const { form } = this;
            const values = {
                name: valueOf( form.nameInput ).trim(),
                label: valueOf( form.labelInput ).trim(),
                attributes: valueOf( form.attributesInput ),
                leaf: form.leafSwitch.isOn,
                source: valueOf( form.sourceInput )
            };

            editor.execute( this._mode === 'insert' ? 'insertDirective' : 'updateDirective', values );
            this.hide();
            editor.editing.view.focus();
        } );

        this.form.on( 'cancel', () => {
            this.hide();
            editor.editing.view.focus();
        } );

        clickOutsideHandler( {
            emitter: this.form,
            activator: () => this._balloon.visibleView === this.form,
            contextElements: () => [ this._balloon.view.element! ],
            callback: () => this.hide()
        } );

        editor.ui.componentFactory.add( 'insertDirective', locale => {
            const button = new ButtonView( locale );
            const command = editor.commands.get( 'insertDirective' )!;

            button.set( { label: 'Insert directive', icon: IconPlus, tooltip: true } );
            button.bind( 'isEnabled' ).to( command );
            button.on( 'execute', () => this.showInsert() );

            return button;
        } );

        editor.ui.componentFactory.add( 'editDirective', locale => {
            const button = new ButtonView( locale );
            const command = editor.commands.get( 'updateDirective' )!;

            button.set( { label: 'Edit directive or raw block', icon: IconPencil, tooltip: true } );
            button.bind( 'isEnabled' ).to( command );
            button.on( 'execute', () => this.showEdit() );

            return button;
        } );
    }

    public showInsert(): void {
        this._mode = 'insert';
        this.form.configure( 'insert', { name: '', leaf: false } );
        this._show();
    }

    public showEdit(): void {
        const target = findEditableTarget( this.editor );

        if ( !target ) {
            return;
        }

        if ( target.name === 'mdRawInline' || target.name === 'mdRawBlock' ) {
            this._mode = 'raw';
            this.form.configure( 'raw', { source: target.getAttribute( 'source' ) as string } );
        } else {
            const json = target.getAttribute( 'attrs' ) as string | undefined;

            this._mode = 'directive';
            this.form.configure( 'directive', {
                name: target.getAttribute( 'name' ) as string,
                label: ( target.getAttribute( 'label' ) as string | undefined ) ?? '',
                attributes: formatDirectiveAttributes( parseAttributesJson( json ) )
            } );
        }

        this._show();
    }

    public hide(): void {
        if ( this._balloon.hasView( this.form ) ) {
            this._balloon.remove( this.form );
        }
    }

    private _show(): void {
        const view = this.editor.editing.view;

        if ( !this._balloon.hasView( this.form ) ) {
            this._balloon.add( {
                view: this.form,
                position: { target: () => view.domConverter.viewRangeToDom( view.document.selection.getFirstRange()! ) }
            } );
        }

        this.form.focusFirst();
    }
}
