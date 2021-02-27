// This is a "linted" version of IntervalHelper.ts from
// kaitai-io/kaitai_struct_webide. It is included in accordance with that
// license, the GPLv3.

export interface IInterval {
  start: number;
  end: number;
}

export interface IIntervalLookup<T> {
  searchRange(start: number, end?: number): { idx: number; items: T[] };
}

export class IntervalHandler<T extends IInterval>
  implements IIntervalLookup<T> {
  constructor(public sortedItems: T[] = []) {}

  public indexOf(intervalStart: number): number {
    const arr = this.sortedItems;
    let low = 0;
    let high = arr.length - 1;

    while (low <= high) {
      const testIdx = (high + low) >> 1;
      const testValue = arr[testIdx].end;

      if (intervalStart > testValue) {
        low = testIdx + 1;
      } else if (intervalStart < testValue) {
        high = testIdx - 1;
      } else {
        return testIdx;
      }
    }

    return -low - 1;
  }

  public searchRange(start: number, end?: number): { idx: number; items: T[] } {
    const arr = this.sortedItems;
    end = end || start;

    let startIdx = this.indexOf(start);
    if (startIdx < 0) {
      startIdx = ~startIdx;
    }

    const result = [];

    for (let index = startIdx; index < arr.length; index++) {
      const item = arr[index];
      if (start <= item.end && item.start <= end) {
        result.push(item);
      } else {
        break;
      }
    }

    return { idx: startIdx, items: result };
  }

  addSorted(items: T[]): void {
    if (items.length === 0) {
      return;
    }
    let insertIdx = this.indexOf(items[0].start);
    if (insertIdx < 0) {
      insertIdx = ~insertIdx;
    }
    this.sortedItems = this.sortedItems
      .slice(0, insertIdx)
      .concat(items, this.sortedItems.slice(insertIdx));
  }
}
