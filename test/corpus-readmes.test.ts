import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { defineCorpusSuite } from './corpusSuite.js';

const dir = join( import.meta.dirname, 'corpus', 'readmes' );
const names = readdirSync( dir ).filter( name => name.endsWith( '.md' ) && name !== 'SOURCES.md' ).sort();

defineCorpusSuite( 'real READMEs', names.map( name => ( { id: name, markdown: readFileSync( join( dir, name ), 'utf8' ) } ) ), 12 );
