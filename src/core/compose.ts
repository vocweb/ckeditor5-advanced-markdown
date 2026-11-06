/**
 * @license GPL-2.0-or-later
 * Copyright (c) ckeditor5-advanced-markdown contributors.
 * This program is free software; you can redistribute it and/or modify it under the terms of the
 * GNU General Public License as published by the Free Software Foundation; either version 2 of the
 * License, or (at your option) any later version.
 */

import { parseDocument, type SourceDocument } from './document.js';

// 編集で位置がずれても未編集ブロックを対応付けられるよう LCS を使う
// Dùng LCS để vẫn ghép được block chưa sửa dù vị trí bị lệch sau khi chỉnh sửa
export function alignSegments( a: string[], b: string[] ): Array<[ number, number ]> {
    let head = 0;

    while ( head < a.length && head < b.length && a[ head ] === b[ head ] ) {
        head++;
    }

    let tailA = a.length;
    let tailB = b.length;

    while ( tailA > head && tailB > head && a[ tailA - 1 ] === b[ tailB - 1 ] ) {
        tailA--;
        tailB--;
    }

    const pairs: Array<[ number, number ]> = [];

    for ( let i = 0; i < head; i++ ) {
        pairs.push( [ i, i ] );
    }

    const n = tailA - head;
    const m = tailB - head;

    if ( n > 0 && m > 0 ) {
        const table: Uint32Array[] = [];

        for ( let i = 0; i <= n; i++ ) {
            table.push( new Uint32Array( m + 1 ) );
        }

        for ( let i = n - 1; i >= 0; i-- ) {
            for ( let j = m - 1; j >= 0; j-- ) {
                table[ i ]![ j ] = a[ head + i ] === b[ head + j ] ?
                    table[ i + 1 ]![ j + 1 ]! + 1 :
                    Math.max( table[ i + 1 ]![ j ]!, table[ i ]![ j + 1 ]! );
            }
        }

        let i = 0;
        let j = 0;

        while ( i < n && j < m ) {
            if ( a[ head + i ] === b[ head + j ] ) {
                pairs.push( [ head + i, head + j ] );
                i++;
                j++;
            } else if ( table[ i + 1 ]![ j ]! >= table[ i ]![ j + 1 ]! ) {
                i++;
            } else {
                j++;
            }
        }
    }

    for ( let k = 0; k < a.length - tailA; k++ ) {
        pairs.push( [ tailA + k, tailB + k ] );
    }

    return pairs;
}

const hasBlankLine = ( gap: string ) => ( gap.match( /\n/g ) || [] ).length >= 2;

// 基準と同じセグメントだけ原文を再利用し、編集済みのものは新しく直列化して差分を最小にする
// Chỉ dùng lại nguồn gốc cho segment trùng baseline, phần đã sửa serialize mới để diff nhỏ nhất
export function composeDocument( original: SourceDocument, baseline: string[], current: string[] ): string {
    const { blocks, eol } = original;
    const joined = ( items: string[] ) => items.join( '\n' );

    if ( joined( baseline ) === joined( current ) && baseline.length === current.length ) {
        return original.markdown;
    }

    // 基準と原文のブロック数が異なるときは対応付けできない
    // Khi số block baseline khác số block nguồn thì không thể ghép cặp
    const pairable = baseline.length === blocks.length;
    const matchOf = new Map<number, number>();

    if ( pairable ) {
        for ( const [ bi, ci ] of alignSegments( baseline, current ) ) {
            matchOf.set( ci, bi );
        }
    }

    if ( current.length === 0 ) {
        return '';
    }

    const build = ( keepGaps: boolean ) => {
        let out = '';
        let previousOriginal = -2;

        current.forEach( ( segment, ci ) => {
            const bi = matchOf.get( ci );
            const text = bi === undefined ? segment.replace( /\n/g, eol ) : blocks[ bi ]!.source;
            let gap: string;

            if ( ci === 0 ) {
                gap = bi === 0 ? blocks[ 0 ]!.gapBefore : '';
            } else if ( bi !== undefined && ( bi === previousOriginal + 1 || keepGaps || hasBlankLine( blocks[ bi ]!.gapBefore ) ) ) {
                gap = blocks[ bi ]!.gapBefore;
            } else {
                gap = eol + eol;
            }

            out += gap + text;
            previousOriginal = bi ?? -2;
        } );

        const lastMatch = matchOf.get( current.length - 1 );

        return out + ( lastMatch === blocks.length - 1 ? original.tail : eol );
    };

    // 元の区切りを保つと別のブロックに融合する場合があるので、再パースして確認する
    // Giữ nguyên khoảng cách cũ có thể làm các block dính vào nhau nên phải parse lại để kiểm tra
    const preferred = build( true );
    const reparsed = parseDocument( preferred ).blocks;
    const intact = reparsed.length === current.length && current.every( ( _, ci ) => {
        const bi = matchOf.get( ci );

        return bi === undefined || reparsed[ ci ]!.source === blocks[ bi ]!.source;
    } );

    return intact ? preferred : build( false );
}
