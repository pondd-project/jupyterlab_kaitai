// This is a "linted" and somewhat stripped down version of ConverterPanel.ts
// from kaitai-io/kaitai_struct_webide that swaps out how the tpye constructions
// are done and removes the display aspects. It is included in accordance with
// that license, the GPLv3.

import * as bigInt from 'big-integer';
import * as dateFormat from 'dateformat';
import { IDataProvider } from './HexViewer';

export class Converter {
  static numConv(
    data: Uint8Array,
    len: number,
    signed: boolean,
    bigEndian: boolean
  ): string {
    if (len > data.length) {
      return '';
    }

    let arr = data.slice(0, len);

    if (!bigEndian) {
      arr = arr.reverse();
    }

    let num = bigInt.default(0);
    for (let i = 0; i < arr.length; i++) {
      num = num.multiply(256).add(arr[i]);
    }

    if (signed) {
      const maxVal = bigInt.default(256).pow(len);
      if (num.greaterOrEquals(maxVal.divide(2))) {
        num = maxVal.minus(num).negate();
      }
    }

    //console.log("numConv", arr, len, signed ? "signed" : "unsigned", bigEndian ? "big-endian" : "little-endian", num, typeof num);
    return num.toString();
  }

  static strDecode(data: Uint8Array, enc: string): string {
    const str = new TextDecoder(enc).decode(data);
    for (let i = 0; i < str.length; i++) {
      if (str[i] === '\0') {
        return str.substring(0, i);
      }
    }
    return str + '...';
  }
}

export const TYPES = [
  'i8',
  'i16le',
  'i32le',
  'i64le',
  'i16be',
  'i32be',
  'i64be',
  'u8',
  'u16le',
  'u32le',
  'u64le',
  'u16be',
  'u32be',
  'u64be',
  'float',
  'double',
  'unixts',
  'ascii',
  'utf8',
  'utf16le',
  'utf16be'
];

export class ConverterPanelModel {
  type_conversion_results: Map<string, string>;

  constructor() {
    this.type_conversion_results = new Map<string, string>();
    TYPES.forEach(t => this.type_conversion_results.set(t, ''));
  }

  update(dataProvider: IDataProvider, offset: number): void {
    if (!dataProvider || offset === -1) {
      TYPES.forEach(t => this.type_conversion_results.set(t, ''));
      return;
    }

    const data = dataProvider
      .get(offset, Math.min(dataProvider.length - offset, 64))
      .slice(0);

    for (const len of [1, 2, 4, 8]) {
      for (const signed of [false, true]) {
        for (const bigEndian of [false, true]) {
          const convRes = Converter.numConv(data, len, signed, bigEndian);
          const propName = `${signed ? 'i' : 'u'}${len * 8}${
            len === 1 ? '' : bigEndian ? 'be' : 'le'
          }`;
          this.type_conversion_results.set(propName, convRes);
        }
      }
    }

    this.type_conversion_results.set(
      'float',
      data.length >= 4 ? '' + new Float32Array(data.buffer.slice(0, 4))[0] : ''
    );
    this.type_conversion_results.set(
      'double',
      data.length >= 8 ? '' + new Float64Array(data.buffer.slice(0, 8))[0] : ''
    );

    const u32le = Converter.numConv(data, 4, false, false);
    this.type_conversion_results.set(
      'unixts',
      u32le
        ? dateFormat.default(
            new Date(parseInt(u32le) * 1000),
            'yyyy-mm-dd HH:MM:ss'
          )
        : ''
    );

    try {
      this.type_conversion_results.set(
        'ascii',
        Converter.strDecode(data, 'ascii')
      );
      this.type_conversion_results.set(
        'utf8',
        Converter.strDecode(data, 'utf-8')
      );
      this.type_conversion_results.set(
        'utf16le',
        Converter.strDecode(data, 'utf-16le')
      );
      this.type_conversion_results.set(
        'utf16be',
        Converter.strDecode(data, 'utf-16be')
      );
    } catch (e) {
      console.log('refreshConverterPanel str', e);
    }
  }
}
