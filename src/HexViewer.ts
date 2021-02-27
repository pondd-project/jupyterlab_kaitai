// This is a "linted" version of HexViewer.ts from
// kaitai-io/kaitai_struct_webide that removes the hard dependency on jQuery. It
// is included in accordance with that license, the GPLv3.

import { IInterval, IIntervalLookup } from './IntervalHelper';

interface IHexViewerCell extends HTMLSpanElement {
  cell: IHexViewerCell;
  levels: IHexViewerCell[];
  dataOffset: number;
}

interface IHexViewerPart {
  childNodes: IHexViewerCell[];
}

interface IHexViewerRow extends HTMLDivElement {
  addrPart: HTMLSpanElement;
  hexPart: IHexViewerPart;
  asciiPart: IHexViewerPart;
}

class HexViewUtils {
  static zeroFill(str: string, padLen: number) {
    while (str.length < padLen) {
      str = '0' + str;
    }
    return str;
  }

  static addrHex(address: number) {
    //var addrHexLen = Math.ceil(Math.log(this.buffer.length) / Math.log(16));
    const addrHexLen = 8;
    return this.zeroFill(address.toString(16), addrHexLen);
  }

  static byteAscii(bt: number) {
    return bt === 32
      ? '\u00a0'
      : bt < 32 || (0x7f <= bt && bt <= 0xa0) || bt === 0xad
      ? '.'
      : String.fromCharCode(bt);
  }

  static byteHex(bt: number) {
    return this.zeroFill(bt.toString(16), 2);
  }

  static generateRow(bytesPerLine: number, level: number): IHexViewerRow {
    level = level || 3;
    function cr(tag: string, className: string): any {
      const elem = document.createElement(tag);
      elem.className = className;
      return elem;
    }

    const hexRow = cr('div', 'hexRow');
    hexRow.addrPart = cr('span', 'addrPart');
    hexRow.hexPart = cr('span', 'hexPart');
    hexRow.asciiPart = cr('span', 'asciiPart');
    hexRow.appendChild(hexRow.addrPart);
    hexRow.appendChild(hexRow.hexPart);
    hexRow.appendChild(hexRow.asciiPart);

    for (let iChar = 0; iChar < bytesPerLine; iChar++) {
      hexRow.asciiPart.appendChild(cr('span', `asciicell cell${iChar}`));

      const cell = cr('span', `hexcell cell${iChar}`);

      const levels = [];
      let prevLevel = cell;
      for (let i = 0; i < level; i++) {
        const levelSpan = cr('span', `l${i}`);
        levelSpan.appendChild(prevLevel);
        levels[level - 1 - i] = prevLevel = levelSpan;
      }

      prevLevel.cell = cell;
      prevLevel.levels = levels;
      hexRow.hexPart.appendChild(prevLevel);
    }

    return hexRow;
  }
}

export interface IDataProvider {
  length: number;
  get(offset: number, length: number): Uint8Array;
}

export class HexViewer {
  private rowHeight = 21;
  public bytesPerLine = 16;

  private intervals: IIntervalLookup<IInterval>;
  private rows: IHexViewerRow[] = [];
  private topRow = 0;
  private maxLevel = 3;
  private rowCount: number;
  private maxScrollHeight: number;
  private maxRow: number;
  private totalHeight: number;
  private scrollbox: HTMLElement;
  private heightbox: HTMLDivElement;
  private content: HTMLDivElement;
  private contentOuter: HTMLDivElement;

  public mouseDownOffset: number;
  private canDeselect: boolean;

  public selectionStart = -1;
  public selectionEnd = -1;
  public onSelectionChanged: () => void;

  private isRecursive: boolean;

  private cellMouseAction(e: MouseEvent) {
    if (e.button !== 1) {
      return;
    } // only handle left mouse button actions

    if (e.type === 'mouseup') {
      this.content.removeEventListener('mousemove', this.cellMouseAction);
    }

    let cell: HTMLElement = e.currentTarget as HTMLElement;
    if (!('dataOffset' in cell)) {
      const cells = cell.getElementsByClassName('.hexcell, .asciicell');
      if (cells.length === 1) {
        cell = cells.item(0) as HTMLElement;
      }
    }

    if ('offset' in cell.dataset) {
      if (e.type === 'mousedown') {
        this.canDeselect =
          this.selectionStart === parseInt(cell.dataset.offset) &&
          this.selectionEnd === parseInt(cell.dataset.offset);
        this.mouseDownOffset = parseInt(cell.dataset.offset);
        this.content.addEventListener('mousemove', this.cellMouseAction);
        this.setSelection(
          parseInt(cell.dataset.offset),
          parseInt(cell.dataset.offset)
        );
      } else if (e.type === 'mousemove') {
        this.setSelection(this.mouseDownOffset, parseInt(cell.dataset.offset));
        this.canDeselect = false;
      } else if (
        e.type === 'mouseup' &&
        this.canDeselect &&
        this.mouseDownOffset === parseInt(cell.dataset.offset)
      ) {
        this.deselect();
      }

      this.contentOuter.focus();
      e.preventDefault();
    }
  }

  constructor(container: HTMLElement, public dataProvider?: IDataProvider) {
    this.dataProvider = dataProvider;

    this.scrollbox = container;
    this.scrollbox.classList.add('scrollbox');
    this.heightbox = document.createElement('div');
    this.heightbox.classList.add('heightbox');
    this.scrollbox.appendChild(this.heightbox);
    this.contentOuter = document.createElement('div');
    this.contentOuter.classList.add('contentOuter');
    this.contentOuter.setAttribute('tabindex', '1');
    this.scrollbox.appendChild(this.contentOuter);

    const charSpans = '0123456789ABCDEF'
      .split('')
      .map((x, i) => `<span class="c${i}">${x}</span>`)
      .join('');
    const header = document.createElement('div');
    header.classList.add('header');
    const hexSpan = document.createElement('span');
    hexSpan.classList.add('hex');
    hexSpan.innerHTML = charSpans;
    const asciiSpan = document.createElement('span');
    asciiSpan.classList.add('ascii');
    asciiSpan.innerHTML = charSpans;
    header.appendChild(hexSpan);
    header.appendChild(asciiSpan);
    this.contentOuter.appendChild(header);
    this.content = document.createElement('div');
    this.content.classList.add('content');
    this.contentOuter.appendChild(this.content);
    this.content.addEventListener('mousedown', this.cellMouseAction);
    document.addEventListener('mouseup', this.cellMouseAction);

    this.intervals = null;

    this.scrollbox.addEventListener('scroll', e => {
      const scrollTop = this.scrollbox.scrollTop;
      this.contentOuter.style.top = scrollTop + 'px';
      const percent = scrollTop / this.maxScrollHeight;
      const newTopRow = Math.round(this.maxRow * percent);
      if (this.topRow !== newTopRow) {
        this.topRow = newTopRow;
        this.refresh();
      }
    });

    window.addEventListener('resize', () => this.resize);
    this.resize();

    this.contentOuter.addEventListener('keydown', e => {
      const bytesPerPage = this.bytesPerLine * (this.rowCount - 2);
      const selDiff =
        e.key === 'ArrowDown'
          ? this.bytesPerLine
          : e.key === 'ArrowUp'
          ? -this.bytesPerLine
          : e.key === 'PageDown'
          ? bytesPerPage
          : e.key === 'PageUp'
          ? -bytesPerPage
          : e.key === 'ArrowRight'
          ? 1
          : e.key === 'ArrowLeft'
          ? -1
          : null;

      if (selDiff === null) {
        return;
      }

      let newSel = this.selectionStart + selDiff;
      if (newSel < 0) {
        newSel = 0;
      } else if (newSel >= this.dataProvider.length) {
        newSel = this.dataProvider.length - 1;
      }

      this.setSelection(newSel);
      return false;
    });
  }

  public resize(): boolean {
    if (!this.dataProvider) {
      return false;
    }

    const totalRowCount = Math.ceil(
      this.dataProvider.length / this.bytesPerLine
    );
    this.totalHeight = totalRowCount * this.rowHeight;
    if (totalRowCount > 1 * 1024 * 1024) {
      this.totalHeight = totalRowCount;
    }
    this.heightbox.style.height = this.totalHeight + 16 + 'px';
    //console.log("totalRowCount", totalRowCount, "heightbox.height", this.heightbox.height(), "totalHeight", this.totalHeight);

    console.log(
      'computedstyle',
      window.getComputedStyle(this.contentOuter, null)
    );
    const boxHeight = parseInt(
      window
        .getComputedStyle(this.contentOuter, null)
        .getPropertyValue('height')
    );
    this.content.innerHTML = '';
    this.maxScrollHeight = this.totalHeight - boxHeight;
    console.log('setting rowcount', boxHeight, this.rowHeight);
    this.rowCount = Math.ceil(boxHeight / this.rowHeight);
    //console.log("boxHeight", boxHeight, "rowCount", this.rowCount);
    this.maxRow = Math.ceil(
      this.dataProvider.length / this.bytesPerLine - this.rowCount + 1
    );

    this.rows = [];
    for (let i = 0; i < this.rowCount; i++) {
      const row = HexViewUtils.generateRow(this.bytesPerLine, this.maxLevel);
      this.rows[i] = row;
      this.content.append(row);
    }

    return this.refresh();
  }

  get visibleOffsetStart(): number {
    return this.topRow * this.bytesPerLine;
  }
  get visibleOffsetEnd(): number {
    return (this.topRow + this.rowCount - 2) * this.bytesPerLine - 1;
  }

  public refresh(): boolean {
    if (!this.dataProvider) {
      return false;
    }

    const searchResult = this.intervals
      ? this.intervals.searchRange(
          this.visibleOffsetStart,
          this.visibleOffsetEnd + this.bytesPerLine * 2
        )
      : null;
    const intervals = searchResult ? searchResult.items : [];
    const intBaseIdx = searchResult ? searchResult.idx : 0;
    let intIdx = 0;
    console.log('intervals', intervals);
    console.log(
      'rowCount',
      this.rowCount,
      this.bytesPerLine,
      this.dataProvider.length,
      this.visibleOffsetStart
    );

    const viewData = this.dataProvider.get(
      this.visibleOffsetStart,
      Math.min(
        this.rowCount * this.bytesPerLine,
        this.dataProvider.length - this.visibleOffsetStart
      )
    );

    for (let iRow = 0; iRow < this.rowCount; iRow++) {
      const rowOffset = iRow * this.bytesPerLine;
      const row = this.rows[iRow];
      row.addrPart.innerText =
        rowOffset < viewData.length
          ? HexViewUtils.addrHex(this.visibleOffsetStart + rowOffset)
          : '';

      for (let iCell = 0; iCell < this.bytesPerLine; iCell++) {
        const viewDataOffset = rowOffset + iCell;
        const dataOffset = this.visibleOffsetStart + viewDataOffset;
        let hexCh, ch;
        if (viewDataOffset < viewData.length) {
          const b = viewData[rowOffset + iCell];
          hexCh = HexViewUtils.byteHex(b);
          ch = HexViewUtils.byteAscii(b);
        } else {
          hexCh = '\u00a0\u00a0';
          ch = '\u00a0';
        }

        const hexCell = row.hexPart.childNodes[iCell];
        const asciiCell = row.asciiPart.childNodes[iCell];

        hexCell.cell.innerText = hexCh;
        asciiCell.innerText = ch;

        hexCell.cell.dataset.offset = '' + dataOffset;
        asciiCell.dataset.offset = '' + dataOffset;

        const isSelected =
          this.selectionStart <= dataOffset && dataOffset <= this.selectionEnd;
        if (isSelected) {
          hexCell.cell.classList.add('selected');
          asciiCell.classList.add('selected');
        } else {
          hexCell.cell.classList.remove('selected');
          asciiCell.classList.remove('selected');
        }

        let skipInt = 0;
        for (let level = 0; level < this.maxLevel; level++) {
          const int = intervals[intIdx + level];
          const intIn = int && int.start <= dataOffset && dataOffset <= int.end;
          const intStart = intIn && int.start === dataOffset;
          const intEnd = intIn && int.end === dataOffset;
          hexCell.levels[level].className =
            `l${this.maxLevel - 1 - level} ${
              (intBaseIdx + intIdx) % 2 === 0 ? 'even' : 'odd'
            }` +
            (intIn ? ` m${level}` : '') +
            (intStart ? ' start' : '') +
            (intEnd ? ' end' : '') +
            (isSelected ? ' selected' : '');

          if (intEnd) {
            skipInt++;
          }
        }

        intIdx += skipInt;
      }
    }
  }

  public setIntervals(intervals: IIntervalLookup<IInterval>): boolean {
    this.intervals = intervals;
    return this.refresh();
  }

  public setDataProvider(dataProvider: IDataProvider): boolean {
    this.dataProvider = dataProvider;
    this.intervals = null;
    this.topRow = 0;
    this.deselect();
    return this.resize();
  }

  public deselect(): void {
    this.setSelection(-1, -1);
  }

  public setSelection(start: number, end?: number): void {
    if (this.isRecursive) {
      return;
    }
    end = end || start;

    const oldStart = this.selectionStart,
      oldEnd = this.selectionEnd;
    this.selectionStart = start < end ? start : end;
    this.selectionEnd = Math.min(
      start < end ? end : start,
      this.dataProvider.length - 1
    );
    if (this.selectionStart !== oldStart || this.selectionEnd !== oldEnd) {
      this.isRecursive = true;
      try {
        if (this.onSelectionChanged) {
          this.onSelectionChanged();
        }
      } finally {
        this.isRecursive = false;

        if (this.selectionStart !== -1) {
          if (this.selectionEnd > this.visibleOffsetEnd) {
            this.topRow = Math.max(
              Math.floor(this.selectionEnd / this.bytesPerLine) -
                this.rowCount +
                3,
              0
            );
          }
          if (this.selectionStart < this.visibleOffsetStart) {
            this.topRow = Math.floor(this.selectionStart / this.bytesPerLine);
          }

          this.scrollbox.scrollTop = Math.round(
            (this.topRow / this.maxRow) * this.maxScrollHeight
          );
        }

        this.refresh();
      }
    }
  }
}
