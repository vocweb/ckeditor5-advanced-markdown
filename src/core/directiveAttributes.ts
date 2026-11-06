/**
 * @license GPL-2.0-or-later
 * Copyright (c) ckeditor5-advanced-markdown contributors.
 * This program is free software; you can redistribute it and/or modify it under the terms of the
 * GNU General Public License as published by the Free Software Foundation; either version 2 of the
 * License, or (at your option) any later version.
 */

export type DirectiveAttributes = Record<string, string>;

const SAFE_VALUE = /^[^\s"'=<>`{}]+$/;

// 利用者が directive の構文で属性を編集できるようにするため
// Để người dùng sửa thuộc tính bằng chính cú pháp của directive
export function formatDirectiveAttributes( attributes: DirectiveAttributes ): string {
    const parts: string[] = [];

    for ( const [ key, value ] of Object.entries( attributes ) ) {
        if ( key === 'class' ) {
            parts.push( ...value.split( /\s+/ ).filter( Boolean ).map( name => '.' + name ) );
        } else if ( key === 'id' && SAFE_VALUE.test( value ) ) {
            parts.push( '#' + value );
        } else if ( value === '' ) {
            parts.push( key );
        } else {
            parts.push( SAFE_VALUE.test( value ) ? `${ key }=${ value }` : `${ key }="${ value.replace( /"/g, '&quot;' ) }"` );
        }
    }

    return parts.join( ' ' );
}

const TOKEN = /\.([^\s.#="]+)|#([^\s.#="]+)|([^\s.#="]+)(?:=(?:"([^"]*)"|'([^']*)'|([^\s"']+)))?/g;

// フォームの入力を属性オブジェクトへ戻すため。解析できない入力は空にして壊れた属性を出さない
// Đưa dữ liệu form về lại đối tượng thuộc tính; đầu vào không parse được thì rỗng để không sinh thuộc tính hỏng
export function parseDirectiveAttributes( text: string ): DirectiveAttributes {
    const attributes: DirectiveAttributes = {};
    const input = text.trim().replace( /^\{|\}$/g, '' );

    for ( const match of input.matchAll( TOKEN ) ) {
        const [ , className, id, key, quoted, singleQuoted, bare ] = match;

        if ( className ) {
            attributes.class = attributes.class ? `${ attributes.class } ${ className }` : className;
        } else if ( id ) {
            attributes.id = id;
        } else if ( key ) {
            attributes[ key ] = ( quoted ?? singleQuoted ?? bare ?? '' ).replace( /&quot;/g, '"' );
        }
    }

    return attributes;
}

// 貼り付け由来の JSON は信頼できないので、壊れていれば空にし、構文を壊す key と文字列以外の値は捨てる
// JSON từ nội dung dán không đáng tin nên nếu hỏng thì trả rỗng, bỏ key làm vỡ cú pháp và giá trị không phải chuỗi
const SAFE_KEY = /^[^\s"'=<>`{}.#/]+$/;

export function parseAttributesJson( json: string | undefined ): DirectiveAttributes {
    const attributes: DirectiveAttributes = {};

    if ( !json ) {
        return attributes;
    }

    let parsed: unknown;

    try {
        parsed = JSON.parse( json );
    } catch {
        return attributes;
    }

    if ( typeof parsed !== 'object' || parsed === null || Array.isArray( parsed ) ) {
        return attributes;
    }

    for ( const [ key, value ] of Object.entries( parsed ) ) {
        if ( typeof value === 'string' && ( key === 'class' || key === 'id' || SAFE_KEY.test( key ) ) ) {
            attributes[ key ] = value;
        }
    }

    return attributes;
}
