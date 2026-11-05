import { describe, expect, test } from 'vitest';
import { alignSegments, composeDocument } from '../src/core/compose.js';
import { parseDocument } from '../src/core/document.js';
import { formatDirectiveAttributes, parseDirectiveAttributes } from '../src/core/directiveAttributes.js';
import { MarkdownCodec } from '../src/core/codec.js';
import { isEditorWrapperHtml, scoreMarkdown, MARKDOWN_THRESHOLD } from '../src/core/markdownDetection.js';

describe( 'parseDocument', () => {
    test( 'blocks, gaps and tail reassemble the exact input', () => {
        const markdown = '\n\n# a\n   \npara\n\n\n\n- x\n- y\n\n\n';
        const document = parseDocument( markdown );

        expect( document.blocks.map( block => block.gapBefore + block.source ).join( '' ) + document.tail ).toBe( markdown );
    } );

    test( 'adjacent lists that CKEditor merges are one block, different kinds are not', () => {
        expect( parseDocument( '* a\n\n- b\n' ).blocks ).toHaveLength( 1 );
        expect( parseDocument( '- a\n\n1. b\n' ).blocks ).toHaveLength( 2 );
        expect( parseDocument( '* a\n\n- [ ] b\n' ).blocks ).toHaveLength( 2 );
    } );
} );

describe( 'alignSegments', () => {
    test( 'pairs equal items in order, including repeated ones', () => {
        expect( alignSegments( [ 'a', 'b', 'a', 'c' ], [ 'a', 'x', 'a', 'c' ] ) ).toEqual( [ [ 0, 0 ], [ 2, 2 ], [ 3, 3 ] ] );
        expect( alignSegments( [ 'a', 'a' ], [ 'a' ] ) ).toEqual( [ [ 0, 0 ] ] );
        expect( alignSegments( [ 'x', 'a', 'b' ], [ 'a', 'b', 'y' ] ) ).toEqual( [ [ 1, 0 ], [ 2, 1 ] ] );
    } );
} );

describe( 'composeDocument', () => {
    test( 'keeps the original tail only when the last block survives', () => {
        const original = parseDocument( 'a\n\nb\n\n\n' );

        expect( composeDocument( original, [ 'a', 'b' ], [ 'a', 'b' ] ) ).toBe( 'a\n\nb\n\n\n' );
        expect( composeDocument( original, [ 'a', 'b' ], [ 'a' ] ) ).toBe( 'a\n' );
        expect( composeDocument( original, [ 'a', 'b' ], [ 'a', 'c' ] ) ).toBe( 'a\n\nc\n' );
    } );

    test( 'without a one-to-one block pairing only an untouched document is preserved', () => {
        const original = parseDocument( 'a\n\nb\n' );

        expect( composeDocument( original, [ 'ab' ], [ 'ab' ] ) ).toBe( 'a\n\nb\n' );
        expect( composeDocument( original, [ 'ab' ], [ 'abc' ] ) ).toBe( 'abc\n' );
    } );

    test( 'an emptied document is empty', () => {
        expect( composeDocument( parseDocument( 'a\n' ), [ 'a' ], [] ) ).toBe( '' );
    } );
} );

describe( 'directive attributes', () => {
    test( 'format and parse are inverse for classes, ids, flags and quoted values', () => {
        const attributes = { class: 'a b', id: 'x', open: '', title: 'say "hi" now', src: 'a.mp4' };

        expect( parseDirectiveAttributes( formatDirectiveAttributes( attributes ) ) ).toEqual( attributes );
        expect( formatDirectiveAttributes( attributes ) ).toBe( '.a .b #x open title="say &quot;hi&quot; now" src=a.mp4' );
    } );

    test( 'braces around the text are accepted and garbage yields no attributes', () => {
        expect( parseDirectiveAttributes( '{.a k=v}' ) ).toEqual( { class: 'a', k: 'v' } );
        expect( parseDirectiveAttributes( '   ' ) ).toEqual( {} );
    } );
} );

describe( 'markdown detection', () => {
    test.each( [
        [ '# Title\n\n- a\n- b', true ],
        [ '```js\nx\n```', true ],
        [ '| a | b |\n| - | - |\n| 1 | 2 |', true ],
        [ ':::note\nx\n:::', true ],
        [ '---\ntitle: x\n---\n\nbody', true ],
        [ '# only a comment', false ],
        [ 'Just a sentence, with: punctuation. And more!', false ],
        [ '- one dash line', false ],
        [ 'a * b * c', false ]
    ] )( 'score of %j', ( text, expected ) => {
        expect( scoreMarkdown( text ).score >= MARKDOWN_THRESHOLD ).toBe( expected );
    } );

    test( 'editor wrapper HTML versus rich HTML', () => {
        expect( isEditorWrapperHtml( '<meta charset=utf-8><div><span>x</span><br></div>' ) ).toBe( true );
        expect( isEditorWrapperHtml( '' ) ).toBe( true );
        expect( isEditorWrapperHtml( '<div><a href="x">y</a></div>' ) ).toBe( false );
        expect( isEditorWrapperHtml( '<table><tr><td>x</td></tr></table>' ) ).toBe( false );
        expect( isEditorWrapperHtml( '<p>para</p>' ) ).toBe( false );
    } );
} );

describe( 'CK-only features', () => {
    test( 'presentation GFM cannot express is written as XHTML-valid HTML instead of being stripped', () => {
        const html = '<p style="text-align:center;">Hi <span style="color:red">red</span> <u>under</u></p><p>plain <span>x</span></p>' +
            '<figure class="image image_resized" style="width:50%"><img src="a.png" alt="a"></figure>';

        expect( MarkdownCodec.normalize( html ) ).toEqual( [
            '<p style="text-align:center;">Hi <span style="color:red">red</span> <u>under</u></p>',
            'plain x',
            '<figure class="image image_resized" style="width:50%"><img src="a.png" alt="a" /></figure>'
        ] );
    } );

    test( 'inline-only presentation keeps the surrounding Markdown', () => {
        expect( MarkdownCodec.normalize( '<p>a <strong>b</strong> <span style="color:red">c</span> <u>d</u></p>' ) )
            .toEqual( [ 'a **b** <span style="color:red">c</span> <u>d</u>' ] );
    } );
} );

describe( 'task lists', () => {
    test( 'CKEditor todo markup serializes with its checkbox state', () => {
        const html = '<ul class="todo-list"><li><label class="todo-list__label"><input type="checkbox" checked="checked" disabled="disabled"><span class="todo-list__label__description">done</span></label></li>' +
            '<li><label class="todo-list__label"><input type="checkbox" disabled="disabled"><span class="todo-list__label__description">todo</span></label></li></ul>';

        expect( MarkdownCodec.normalize( html ) ).toEqual( [ '- [x] done\n- [ ] todo' ] );
    } );
} );
