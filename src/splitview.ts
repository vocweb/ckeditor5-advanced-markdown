/**
 * @license GPL-2.0-or-later
 * Copyright (c) ckeditor5-advanced-markdown contributors.
 * This program is free software; you can redistribute it and/or modify it under the terms of the
 * GNU General Public License as published by the Free Software Foundation; either version 2 of the
 * License, or (at your option) any later version.
 */

import { Plugin, ButtonView, IconSource } from 'ckeditor5';
import { Annotation, EditorState } from '@codemirror/state';
import { EditorView, keymap, lineNumbers } from '@codemirror/view';
import { markdown } from '@codemirror/lang-markdown';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import './config.js';

const fromSync = Annotation.define<boolean>();

// コードペインのカーソルとスクロール位置を保つため、全置換ではなく最小の差分だけ適用する
// Chỉ áp dụng thay đổi nhỏ nhất thay vì thay toàn bộ để giữ caret và vị trí cuộn của pane code
export function minimalChange( before: string, after: string ): { from: number; to: number; insert: string } | null {
    if ( before === after ) {
        return null;
    }

    let start = 0;

    while ( start < before.length && start < after.length && before[ start ] === after[ start ] ) {
        start++;
    }

    let endBefore = before.length;
    let endAfter = after.length;

    while ( endBefore > start && endAfter > start && before[ endBefore - 1 ] === after[ endAfter - 1 ] ) {
        endBefore--;
        endAfter--;
    }

    return { from: start, to: endBefore, insert: after.slice( start, endAfter ) };
}

// 入力中のペインを他方が上書きしないよう、フォーカス側を優先してデバウンス後に反映する
// Pane đang gõ không bị pane kia ghi đè nên bên có focus thắng và chỉ đồng bộ sau debounce
export class AdvancedMarkdownSplitView extends Plugin {
    declare public isActive: boolean;

    public static get pluginName() {
        return 'AdvancedMarkdownSplitView' as const;
    }

    private _code: EditorView | null = null;
    private _pane: HTMLElement | null = null;
    private _host: HTMLElement | null = null;
    private _toCodeTimer: ReturnType<typeof setTimeout> | undefined;
    private _toEditorTimer: ReturnType<typeof setTimeout> | undefined;
    private _applyingToEditor = false;
    private _scrollLock: 'editor' | 'code' | null = null;
    private _scrollTimer: ReturnType<typeof setTimeout> | undefined;

    public init(): void {
        const editor = this.editor;

        this.set( 'isActive', false );
        editor.config.define( 'advancedMarkdown.splitView.debounce', 300 );
        editor.config.define( 'advancedMarkdown.splitView.height', '70vh' );

        editor.ui.componentFactory.add( 'splitView', locale => {
            const button = new ButtonView( locale );

            button.set( { label: 'Markdown source (split view)', icon: IconSource, tooltip: true, isToggleable: true } );
            button.bind( 'isOn' ).to( this, 'isActive' );
            button.on( 'execute', () => this.toggle() );

            return button;
        } );

        editor.model.document.on( 'change:data', () => {
            if ( this.isActive && !this._applyingToEditor ) {
                this._schedule( 'toCode' );
            }
        } );
    }

    public override destroy(): void {
        clearTimeout( this._toCodeTimer );
        clearTimeout( this._toEditorTimer );
        clearTimeout( this._scrollTimer );
        this._code?.destroy();
        this._pane?.remove();
        super.destroy();
    }

    public get sourceText(): string | null {
        return this._code ? this._code.state.doc.toString() : null;
    }

    public toggle(): void {
        this.isActive ? this.hide() : this.show();
    }

    public show(): void {
        const editor = this.editor;

        if ( !this._code ) {
            this._create();
        }

        this._host!.classList.add( 'ck-md-split-view_active' );
        this._host!.style.setProperty( '--ck-md-split-height', editor.config.get( 'advancedMarkdown.splitView.height' ) as string );
        this._pane!.hidden = false;
        this._pushToCode();
        this.isActive = true;
    }

    public hide(): void {
        this._host?.classList.remove( 'ck-md-split-view_active' );

        if ( this._pane ) {
            this._pane.hidden = true;
        }

        clearTimeout( this._toCodeTimer );
        clearTimeout( this._toEditorTimer );
        this._toCodeTimer = undefined;
        this._toEditorTimer = undefined;
        this.isActive = false;
    }

    private get _delay(): number {
        return this.editor.config.get( 'advancedMarkdown.splitView.debounce' ) as number;
    }

    private _create(): void {
        const editor = this.editor;
        const editable = editor.ui.getEditableElement()!;

        this._host = editable.parentElement!;
        this._pane = document.createElement( 'div' );
        this._pane.className = 'ck-md-split-view__code';
        this._host.append( this._pane );

        this._code = new EditorView( {
            parent: this._pane,
            state: EditorState.create( {
                doc: '',
                extensions: [
                    lineNumbers(), history(), markdown(), EditorView.lineWrapping,
                    keymap.of( [ ...defaultKeymap, ...historyKeymap ] ),
                    EditorView.updateListener.of( update => {
                        if ( update.docChanged && !update.transactions.some( transaction => transaction.annotation( fromSync ) ) ) {
                            this._schedule( 'toEditor' );
                        }
                    } )
                ]
            } )
        } );

        this._syncScroll( editable );
    }

    private _schedule( direction: 'toCode' | 'toEditor' ): void {
        if ( direction === 'toCode' ) {
            // 入力中のコード側を上書きしないため、コード側に未反映の変更があれば何もしない
            // Không ghi đè phía code đang gõ: nếu phía code còn thay đổi chưa đồng bộ thì bỏ qua
            if ( this._toEditorTimer !== undefined ) {
                return;
            }

            clearTimeout( this._toCodeTimer );
            this._toCodeTimer = setTimeout( () => this._pushToCode(), this._delay );
        } else {
            clearTimeout( this._toEditorTimer );
            this._toEditorTimer = setTimeout( () => this._pushToEditor(), this._delay );
        }
    }

    private _pushToCode(): void {
        this._toCodeTimer = undefined;

        const code = this._code;

        if ( !code ) {
            return;
        }

        const change = minimalChange( code.state.doc.toString(), this.editor.getData() );

        if ( change ) {
            code.dispatch( { changes: change, annotations: fromSync.of( true ) } );
        }
    }

    private _pushToEditor(): void {
        this._toEditorTimer = undefined;

        const text = this._code!.state.doc.toString();

        if ( text === this.editor.getData() ) {
            return;
        }

        this._applyingToEditor = true;

        try {
            // 取り消し履歴を残したまま内容を置き換える
            // Thay nội dung nhưng vẫn giữ lịch sử undo
            this.editor.data.set( text, { batchType: { isUndoable: true } } );
        } finally {
            this._applyingToEditor = false;
        }
    }

    // 両ペインを同じ固定高さにしているので、比率で同期すれば位置が合う。操作中のペインを主とする
    // Hai pane cùng chiều cao cố định nên đồng bộ theo tỉ lệ là khớp; pane đang được cuộn là bên dẫn
    private _syncScroll( editable: HTMLElement ): void {
        const code = this._code!.scrollDOM;
        const follow = ( leader: 'editor' | 'code', from: HTMLElement, to: HTMLElement ) => {
            from.addEventListener( 'scroll', () => {
                if ( this._scrollLock && this._scrollLock !== leader ) {
                    return;
                }

                this._scrollLock = leader;
                clearTimeout( this._scrollTimer );
                this._scrollTimer = setTimeout( () => ( this._scrollLock = null ), 80 );

                const range = from.scrollHeight - from.clientHeight;
                const ratio = range > 0 ? from.scrollTop / range : 0;

                to.scrollTop = ratio * ( to.scrollHeight - to.clientHeight );
            } );
        };

        follow( 'editor', editable, code );
        follow( 'code', code, editable );
    }
}
