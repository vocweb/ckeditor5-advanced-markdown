import { afterAll, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest';
import { ViewDataTransfer } from 'ckeditor5';
import type { ModelElement } from 'ckeditor5';
import { AdvancedMarkdownImportExport } from '../src/importexport.js';
import { AdvancedMarkdownPaste } from '../src/paste.js';
import { AdvancedMarkdownDirectiveUI } from '../src/directive.js';
import { createEditor, type TestEditor } from './helpers.js';

let editor: TestEditor;

beforeAll( async () => {
    editor = await createEditor( [ AdvancedMarkdownPaste, AdvancedMarkdownImportExport, AdvancedMarkdownDirectiveUI ] );
} );

afterAll( async () => {
    await editor.destroy();
} );

const root = () => editor.model.document.getRoot()!;
const children = () => Array.from( root().getChildren() ) as ModelElement[];

function appendText( element: ModelElement, text: string ) {
    editor.model.change( writer => {
        writer.insertText( text, writer.createPositionAt( element, 'end' ) );
    } );
}

describe( 'source preservation', () => {
    const original = [
        '---', 'title: Hello', '---', '', '*  odd   list',
        '*  second', '', 'Hard wrapped paragraph', 'on two lines.', '', '| a | b |', '|:--|--:|', '| 1 | 2 |', '', '<details>',
        '<summary>raw</summary>', '</details>', ''
    ].join( '\n' );

    beforeEach( () => {
        editor.setData( original );
    } );

    test( 'unedited document is returned verbatim', () => {
        expect( editor.getData() ).toBe( original );
    } );

    test( 'editing one paragraph keeps every other block byte for byte', () => {
        const paragraph = children().find( child => child.name === 'paragraph' && !child.hasAttribute( 'listItemId' ) )!;

        appendText( paragraph, ' more' );

        expect( editor.getData() ).toBe( original.replace( 'Hard wrapped paragraph\non two lines.', 'Hard wrapped paragraph on two lines. more' ) );
    } );

    test( 'deleting a block keeps the rest verbatim', () => {
        const paragraph = children().find( child => child.name === 'paragraph' && !child.hasAttribute( 'listItemId' ) )!;

        editor.model.change( writer => writer.remove( paragraph ) );

        expect( editor.getData() ).toBe( original.replace( 'Hard wrapped paragraph\non two lines.\n\n', '' ) );
    } );

    test( 'a new block is serialized in the fixed style between untouched blocks', () => {
        const paragraph = children().find( child => child.name === 'paragraph' && !child.hasAttribute( 'listItemId' ) )!;

        editor.model.change( writer => {
            const heading = writer.createElement( 'heading2' );

            writer.insertText( 'New', heading );
            writer.insert( heading, paragraph, 'after' );
        } );

        expect( editor.getData() ).toBe( original.replace( 'on two lines.\n\n', 'on two lines.\n\n## New\n\n' ) );
    } );

    test( 'editing a raw block changes exactly that block', () => {
        const raw = children().filter( child => child.name === 'mdRawBlock' ).at( -1 )!;

        editor.model.change( writer => writer.setAttribute( 'source', '<details>\n<summary>changed</summary>\n</details>', raw ) );

        expect( editor.getData() ).toBe( original.replace( 'raw</summary>', 'changed</summary>' ) );
    } );

    test( 'editing the same block back to its original text restores the original bytes', () => {
        const paragraph = children().find( child => child.name === 'paragraph' && !child.hasAttribute( 'listItemId' ) )!;

        appendText( paragraph, 'X' );
        editor.model.change( writer => {
            writer.remove( writer.createRange( writer.createPositionAt( paragraph, 'end' ).getShiftedBy( -1 ), writer.createPositionAt( paragraph, 'end' ) ) );
        } );

        expect( editor.getData() ).toBe( original );
    } );

    test( 'CRLF documents get CRLF in rewritten blocks and keep CRLF elsewhere', () => {
        editor.setData( 'First\r\n\r\nSecond\r\n' );
        appendText( children()[ 0 ]!, ' edited' );
        editor.model.change( writer => {
            const code = writer.createElement( 'codeBlock', { language: 'plaintext' } );

            writer.insertText( 'a\nb', code );
            writer.insert( code, children().at( -1 )!, 'after' );
        } );

        expect( editor.getData() ).toBe( 'First edited\r\n\r\nSecond\r\n\r\n```\r\na\r\nb\r\n```\r\n' );
    } );

    test( 'editing a block does not merge it into its neighbour when the original gap was a single newline', () => {
        editor.setData( '# Title\nbody text\n' );
        editor.model.change( writer => {
            const [ heading ] = children();

            writer.rename( heading!, 'paragraph' );
        } );

        expect( editor.getData() ).toBe( 'Title\n\nbody text\n' );
    } );
} );

describe( 'dialect', () => {
    const roundTrip = ( markdown: string ) => {
        editor.setData( markdown );

        return editor.getData();
    };

    test( 'directive, raw block and raw inline survive an edit of another block', () => {
        const markdown = [
            ':::note[A *label*]{.warn #x key="a b"}', 'inside **bold**', ':::', '', '::video{src=a.mp4}', '', 'Text :badge[new]{.green} <b>x</b>', ''
        ].join( '\n' );

        editor.setData( markdown );
        appendText( children().find( child => child.name === 'paragraph' )!, ' tail' );

        expect( editor.getData() ).toBe( markdown.replace( '<b>x</b>', '<b>x</b> tail' ) );
    } );

    test( 'a directive container with its content serializes after its attributes were changed', () => {
        editor.setData( ':::tip\nbody\n:::\n\nafter\n' );

        const directive = children()[ 0 ]!;

        editor.model.change( writer => writer.setAttribute( 'attrs', JSON.stringify( { class: 'big', id: 'k' } ), directive ) );

        expect( editor.getData() ).toBe( ':::tip{#k .big}\nbody\n:::\n\nafter\n' );
    } );

    test( 'nested directive containers and list inside a container', () => {
        const markdown = '::::outer\n:::inner\ntext\n:::\n\n- a\n- b\n::::\n';

        editor.setData( markdown );
        const outer = children()[ 0 ]!;

        expect( outer.name ).toBe( 'mdDirective' );
        expect( ( outer.getChild( 0 ) as ModelElement ).name ).toBe( 'mdDirective' );
        expect( editor.getData() ).toBe( markdown );
    } );

    test( 'MDX import/export and JSX blocks stay raw', () => {
        const markdown = "import Foo from './foo'\n\n<Foo bar={1} />\n\n{1 + 1}\n";

        editor.setData( markdown );

        expect( children().map( child => child.name ) ).toEqual( [ 'mdRawBlock', 'mdRawBlock', 'mdRawBlock' ] );
        expect( editor.getData() ).toBe( markdown );
    } );

    test( 'task lists and tables map to editable CKEditor structures', () => {
        editor.setData( '- [x] done\n- [ ] todo\n\n| a | b |\n| - | - |\n| 1 | 2 |\n' );

        expect( children().map( child => child.name ) ).toEqual( [ 'paragraph', 'paragraph', 'table' ] );
        expect( children()[ 0 ]!.getAttribute( 'listType' ) ).toBe( 'todo' );
        expect( children()[ 0 ]!.getAttribute( 'todoListChecked' ) ).toBe( true );
    } );

    test( 'a table edit rewrites only the table, in GFM style', () => {
        editor.setData( 'before\n\n| a | b |\n|---|---|\n| 1 | 2 |\n\nafter\n' );

        const cell = Array.from( root().getChild( 1 )!.is( 'element' ) ? ( root().getChild( 1 ) as ModelElement ).getChildren() : [] )[ 1 ] as ModelElement;
        const paragraph = ( cell.getChild( 0 ) as ModelElement ).getChild( 0 ) as ModelElement;

        appendText( paragraph, '!' );

        expect( editor.getData() ).toBe( 'before\n\n| a  | b |\n| -- | - |\n| 1! | 2 |\n\nafter\n' );
    } );

    test( 'empty-looking documents are returned as written', () => {
        expect( roundTrip( '[](./target.md)\n' ) ).toBe( '[](./target.md)\n' );
        expect( roundTrip( '' ) ).toBe( '' );
    } );

    test( 'special characters are escaped when a block is rewritten', () => {
        editor.setData( 'plain\n' );
        const paragraph = children()[ 0 ]!;

        editor.model.change( writer => {
            writer.remove( writer.createRangeIn( paragraph ) );
            writer.insertText( '1. not a list * not em _x_ <tag> [x](y)', paragraph );
        } );

        const data = editor.getData();

        editor.setData( data );
        expect( children().map( child => child.name ) ).toEqual( [ 'paragraph' ] );
        expect( ( children()[ 0 ]!.getChild( 0 ) as any ).data ).toBe( '1. not a list * not em _x_ <tag> [x](y)' );
    } );
} );

describe( 'paste', () => {
    function paste( data: Record<string, string>, shift = false ) {
        const view = editor.editing.view;
        const transfer = new ViewDataTransfer( {
            types: Object.keys( data ),
            files: [],
            getData: ( type: string ) => data[ type ] ?? '',
            setData() {}
        } as unknown as DataTransfer );

        if ( shift ) {
            view.document.fire( 'keydown', { keyCode: 86, shiftKey: true, ctrlKey: true, domEvent: { preventDefault() {} }, preventDefault() {}, stopPropagation() {} } );
        }

        // 実際のブラウザと同じく DOM の paste を起点にして ClipboardObserver 経由で clipboardInput を発火させる
        // Xuất phát từ paste của DOM như trình duyệt thật để ClipboardObserver phát clipboardInput
        view.document.fire( 'paste', { dataTransfer: transfer, target: view.document.getRoot(), domEvent: {}, preventDefault() {}, stopPropagation() {} } );
    }

    beforeEach( () => {
        editor.setData( '<p>x</p>'.replace( /<\/?p>/g, '' ) );
        editor.model.change( writer => writer.setSelection( root().getChild( 0 )!, 'in' ) );
    } );

    test( 'plain Markdown text is pasted as structure', () => {
        paste( { 'text/plain': '## Title\n\n- a\n- b\n\n```js\nx\n```' } );

        expect( children().map( child => child.name ) ).toContain( 'heading2' );
        expect( children().map( child => child.name ) ).toContain( 'codeBlock' );
    } );

    test( 'a Markdown heading pasted after existing text stays a heading instead of merging into the paragraph', () => {
        editor.setData( 'Start\n' );
        editor.model.change( writer => writer.setSelection( root().getChild( 0 )!, 'end' ) );
        paste( { 'text/plain': '## Pasted\n\n- a\n- b' } );

        expect( editor.getData() ).toBe( 'Start\n\n## Pasted\n\n- a\n- b\n' );
    } );

    test( 'pasting a heading in the middle of a paragraph splits it', () => {
        editor.setData( 'StartEnd\n' );
        editor.model.change( writer => writer.setSelection( writer.createPositionAt( root().getChild( 0 )!, 5 ) ) );
        paste( { 'text/plain': '## Pasted\n\n- a\n- b' } );

        expect( editor.getData() ).toBe( 'Start\n\n## Pasted\n\n- a\n- b\n\nEnd\n' );
    } );

    test( 'Markdown wrapped in a code editor span/div HTML is still treated as Markdown', () => {
        paste( { 'text/plain': '## Title\n\n- a\n- b', 'text/html': '<div style="font-family:mono"><span>## Title</span><br><span>- a</span></div>' } );

        expect( children().map( child => child.name ) ).toContain( 'heading2' );
    } );

    test( 'rich HTML keeps the default CKEditor path even when its text looks like Markdown', () => {
        paste( { 'text/plain': '## Title\n\n- a\n- b', 'text/html': '<p><strong>real</strong> html</p>' } );

        expect( children().map( child => child.name ) ).not.toContain( 'heading2' );
        expect( editor.getData() ).toContain( '**real** html' );
    } );

    test( 'ordinary prose and a single # line are not converted', () => {
        paste( { 'text/plain': '# just a shell comment' } );

        expect( children().map( child => child.name ) ).not.toContain( 'heading1' );
    } );

    test( 'Ctrl+Shift+V pastes as plain text', () => {
        paste( { 'text/plain': '## Title\n\n- a\n- b\n\n```js\nx\n```' }, true );

        expect( children().map( child => child.name ) ).not.toContain( 'heading2' );
    } );
} );

describe( 'import and export', () => {
    test( 'export downloads getData() as UTF-8 under the configured file name', async () => {
        editor.setData( 'xin chào\n' );

        const blobs: Blob[] = [];
        const clicked: string[] = [];

        URL.createObjectURL = ( blob: Blob | MediaSource ) => {
            blobs.push( blob as Blob );

            return 'blob:test';
        };
        URL.revokeObjectURL = () => {};

        const click = vi.spyOn( HTMLAnchorElement.prototype, 'click' ).mockImplementation( function ( this: HTMLAnchorElement ) {
            clicked.push( this.download );
        } );

        editor.plugins.get( AdvancedMarkdownImportExport ).exportMarkdown();
        click.mockRestore();

        expect( clicked ).toEqual( [ 'document.md' ] );
        expect( blobs[ 0 ]!.type ).toBe( 'text/markdown;charset=utf-8' );
        const text = await new Promise<string>( resolve => {
            const reader = new FileReader();

            reader.onload = () => resolve( reader.result as string );
            reader.readAsText( blobs[ 0 ]! );
        } );

        expect( text ).toBe( 'xin chào\n' );
    } );

    test( 'import replaces the data; unsaved edits need confirmation', async () => {
        const plugin = editor.plugins.get( AdvancedMarkdownImportExport );

        editor.setData( 'one\n' );
        expect( await plugin.importMarkdown( '# two\n' ) ).toBe( true );
        expect( editor.getData() ).toBe( '# two\n' );

        appendText( children()[ 0 ]!, ' edited' );

        const confirm = vi.spyOn( window, 'confirm' ).mockReturnValue( false );

        expect( await plugin.importMarkdown( 'three\n' ) ).toBe( false );
        expect( editor.getData() ).toBe( '# two edited\n' );

        confirm.mockReturnValue( true );
        expect( await plugin.importMarkdown( 'three\n' ) ).toBe( true );
        expect( editor.getData() ).toBe( 'three\n' );
        confirm.mockRestore();
    } );

    test( 'image sources are neither rewritten nor fetched', () => {
        editor.setData( '![alt](../img/a b.png "t")\n' );

        expect( editor.getData() ).toBe( '![alt](../img/a b.png "t")\n' );
    } );
} );

describe( 'insert directive command', () => {
    test( 'inserts a container with an empty paragraph and leaves the caret inside it', () => {
        editor.setData( 'before\n' );
        editor.model.change( writer => writer.setSelection( root().getChild( 0 )!, 'end' ) );
        editor.execute( 'insertDirective', { name: 'note', label: 'Hi', attributes: '.a key="x y"' } );
        editor.model.change( writer => {
            writer.insertText( 'typed', editor.model.document.selection.getFirstPosition()! );
        } );

        expect( editor.getData() ).toBe( 'before\n\n:::note[Hi]{.a key="x y"}\ntyped\n:::\n' );
    } );

    test( 'inserts a leaf directive and rejects invalid names', () => {
        editor.setData( 'before\n' );
        editor.model.change( writer => writer.setSelection( root().getChild( 0 )!, 'end' ) );
        editor.execute( 'insertDirective', { name: '1bad name' } );
        editor.execute( 'insertDirective', { name: 'video', leaf: true, attributes: 'src=a.mp4' } );

        expect( editor.getData() ).toBe( 'before\n\n::video{src="a.mp4"}\n' );
    } );

    test( 'updateDirective edits the selected directive and raw inline source', () => {
        editor.setData( '::video{src=a.mp4}\n\nText :badge[new] end\n' );

        editor.model.change( writer => writer.setSelection( children()[ 0 ]!, 'on' ) );
        editor.execute( 'updateDirective', { name: 'audio', attributes: 'src=b.mp3' } );

        const inline = Array.from( children()[ 1 ]!.getChildren() ).find( node => node.is( 'element', 'mdRawInline' ) ) as ModelElement;

        editor.model.change( writer => writer.setSelection( inline, 'on' ) );
        editor.execute( 'updateDirective', { source: ':badge[old]' } );

        expect( editor.getData() ).toBe( '::audio{src="b.mp3"}\n\nText :badge[old] end\n' );
    } );
} );
