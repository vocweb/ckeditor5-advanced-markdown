import { ClassicEditor, HtmlDataProcessor } from 'ckeditor5';
import type { ModelElement } from 'ckeditor5';
import { AdvancedMarkdown } from '../src/index.js';
import { MarkdownCodec } from '../src/core/codec.js';
import { parseDocument } from '../src/core/document.js';

export async function createEditor( extraPlugins: any[] = [], { render = true } = {} ) {
    const element = document.createElement( 'div' );

    document.body.append( element );

    const editor = await ClassicEditor.create( element, { plugins: [ AdvancedMarkdown, ...extraPlugins ], licenseKey: 'GPL' } );

    if ( !render ) {
        // 大きな文書を何度も setData するコーパス試験では jsdom への DOM 描画が支配的なので、描画を切り離す
        // Trong test corpus setData tài liệu lớn nhiều lần thì chi phí render DOM của jsdom chiếm phần lớn nên tách phần render ra
        editor.editing.view.detachDomRoot( 'main' );
    }

    return editor;
}

export type TestEditor = Awaited<ReturnType<typeof createEditor>>;

// 原文を再利用しない純粋なシリアライズ結果を比較するため
// So sánh kết quả serialize thuần túy không dùng lại nguồn gốc
export function freshSegments( editor: TestEditor ): string[] {
    const html = new HtmlDataProcessor( editor.data.viewDocument ).toData( editor.data.toView( editor.model.document.getRoot()! ) );

    return MarkdownCodec.normalize( html );
}

// リスト項目を除くと、これらは Markdown のちょうど 1 ブロックに対応する
// Nếu loại trừ mục list thì mỗi phần tử này ứng với đúng một block Markdown
export function editableTargets( editor: TestEditor ): ModelElement[] {
    const targets: ModelElement[] = [];

    for ( const child of editor.model.document.getRoot()!.getChildren() ) {
        if ( child.is( 'element' ) && /^(paragraph|heading[1-6])$/.test( child.name ) && !child.hasAttribute( 'listItemId' ) ) {
            targets.push( child );
        }
    }

    return targets;
}

export const MARKER = 'ZZQ9';

export function appendMarker( editor: TestEditor, target: ModelElement ) {
    editor.model.change( writer => {
        writer.insertText( ' ' + MARKER, writer.createPositionAt( target, 'end' ) );
    } );
}

// 編集していないブロックのバイト列が変わっていないことを機械的に確かめるため
// Kiểm tra máy móc rằng byte của các block không sửa không bị thay đổi
export function checkSingleBlockEdit( original: string, edited: string ): string | null {
    const before = parseDocument( original ).blocks;
    const after = parseDocument( edited ).blocks;

    if ( before.length !== after.length ) {
        return `block count ${ before.length } -> ${ after.length }`;
    }

    const changed: number[] = [];

    for ( let i = 0; i < before.length; i++ ) {
        if ( before[ i ]!.source !== after[ i ]!.source || before[ i ]!.gapBefore !== after[ i ]!.gapBefore ) {
            changed.push( i );
        }
    }

    if ( changed.length !== 1 ) {
        return `changed blocks: [${ changed.join( ',' ) }]`;
    }

    return after[ changed[ 0 ]! ]!.source.includes( MARKER ) ? null : 'changed block has no marker';
}
