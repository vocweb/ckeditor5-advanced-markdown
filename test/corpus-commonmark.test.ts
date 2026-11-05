import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { defineCorpusSuite } from './corpusSuite.js';

const examples: Array<{ markdown: string; example: number }> = JSON.parse(
    readFileSync( join( import.meta.dirname, 'corpus', 'commonmark-spec.json' ), 'utf8' )
);

defineCorpusSuite( 'commonmark spec examples', examples.map( ( { markdown, example } ) => ( { id: '#' + example, markdown } ) ), 1 );
