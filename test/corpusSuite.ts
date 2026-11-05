import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { appendMarker, checkSingleBlockEdit, createEditor, editableTargets, freshSegments, MARKER, type TestEditor } from './helpers.js';

export interface CorpusDocument {
    id: string;
    markdown: string;
}

// MVP の 3 つの往復条件を全コーパスに同じ形で適用して回帰を検出するため
// Áp dụng đúng ba tiêu chí round-trip của MVP lên mọi corpus theo cùng một cách để phát hiện hồi quy
export function defineCorpusSuite( label: string, documents: CorpusDocument[], targetsPerDocument: number ) {
    // 同期処理が長いと vitest の RPC がタイムアウトするので、大きい文書は 1 件ずつテストに分ける
    // Xử lý đồng bộ quá lâu làm RPC của vitest hết hạn nên tài liệu lớn được tách thành từng test
    const perDocument = targetsPerDocument > 1;

    describe( label, () => {
        let editor: TestEditor;

        beforeAll( async () => {
            editor = await createEditor( [], { render: false } );
        } );

        afterAll( async () => {
            await editor.destroy();
        } );

        test( 'corpus never contains the edit marker', () => {
            expect( documents.some( ( { markdown } ) => markdown.includes( MARKER ) ) ).toBe( false );
        } );

        const unchanged = ( { markdown }: CorpusDocument ) => {
            editor.setData( markdown );

            return editor.getData() === markdown;
        };

        let editedTotal = 0;

        // index 番目の編集対象にマーカーを足し、その 1 ブロックだけが変わることを確かめる
        // Thêm marker vào đối tượng sửa thứ index rồi kiểm tra chỉ đúng một block thay đổi
        const editProblem = ( { markdown }: CorpusDocument, index: number ): string | null => {
            editor.setData( markdown );

            const target = editableTargets( editor )[ index ];

            if ( !target ) {
                return null;
            }

            appendMarker( editor, target );
            editedTotal++;

            return checkSingleBlockEdit( markdown, editor.getData() );
        };

        const notIdempotent = ( { markdown }: CorpusDocument ) => {
            editor.setData( markdown );

            const once = freshSegments( editor ).join( '\n\n' );

            editor.setData( once );

            return once !== freshSegments( editor ).join( '\n\n' );
        };

        if ( perDocument ) {
            for ( const document of documents ) {
                test( `${ document.id }: byte-identical without edits`, () => {
                    expect( unchanged( document ) ).toBe( true );
                } );

                for ( let index = 0; index < targetsPerDocument; index++ ) {
                    test( `${ document.id }: editing paragraph/heading #${ index } changes only that block`, () => {
                        expect( editProblem( document, index ) ).toBeNull();
                    } );
                }

                test( `${ document.id }: reserializing is idempotent`, () => {
                    expect( notIdempotent( document ) ).toBe( false );
                } );
            }

            test( 'enough documents were edited for the check to mean something', () => {
                expect( editedTotal ).toBeGreaterThan( 20 );
            } );

            return;
        }

        test( `byte-identical without edits (${ documents.length } documents)`, () => {
            expect( documents.filter( document => !unchanged( document ) ).map( ( { id } ) => id ) ).toEqual( [] );
        } );

        test( 'editing one block changes only that block', () => {
            const problems = documents.flatMap( document => {
                const problem = editProblem( document, 0 );

                return problem ? [ `${ document.id }: ${ problem }` ] : [];
            } );

            expect( problems ).toEqual( [] );
            expect( editedTotal ).toBeGreaterThan( 20 );
        } );

        test( 'reserializing is idempotent', () => {
            expect( documents.filter( notIdempotent ).map( ( { id } ) => id ) ).toEqual( [] );
        } );
    } );
}
