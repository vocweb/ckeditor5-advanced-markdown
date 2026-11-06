import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { defineCorpusSuite } from './corpusSuite.js';

const examples: Array<{ markdown: string; example: number }> = JSON.parse(
    readFileSync( join( import.meta.dirname, 'corpus', 'gfm-spec.json' ), 'utf8' )
);

defineCorpusSuite( 'gfm spec examples', examples.map( ( { markdown, example } ) => ( { id: '#' + example, markdown } ) ), 1 );
