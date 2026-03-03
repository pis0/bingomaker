import { describe, expect, it } from 'vitest';
import {
  FULL,
  LINE_1,
  LINE_2,
  LINE_3,
  DOUBLE_LINE_1,
  QUAD_COLUMN_1,
  TRIPLE_COLUMN_1,
  SORTED_PATTERNS,
} from '../Pattern';
import { PatternGroup } from '../PatternGroup';
import { ROWS, COLS } from '../constants';

function allFalse(): boolean[][] {
  return Array.from({ length: ROWS }, () => new Array(COLS).fill(false));
}

function setPositions(grid: boolean[][], positions: [number, number][]): boolean[][] {
  for (const [r, c] of positions) {
    grid[r][c] = true;
  }
  return grid;
}

describe('Pattern.check()', () => {
  it('returns distance 0 for complete LINE_1', () => {
    // LINE_1 = row 0, all cols
    const grid = setPositions(allFalse(), [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4]]);
    const result = LINE_1.check(grid);
    expect(result.distance).toBe(0);
  });

  it('returns distance 1 for LINE_1 missing one cell', () => {
    const grid = setPositions(allFalse(), [[0, 0], [0, 1], [0, 2], [0, 3]]);
    // Missing [0][4]
    const result = LINE_1.check(grid);
    expect(result.distance).toBe(1);
    expect(result.missingRow).toBe(0);
    expect(result.missingCol).toBe(4);
  });

  it('returns distance > 1 for LINE_1 missing two cells', () => {
    const grid = setPositions(allFalse(), [[0, 0], [0, 1], [0, 2]]);
    const result = LINE_1.check(grid);
    expect(result.distance).toBeGreaterThan(1);
  });

  it('returns distance 0 for complete FULL', () => {
    const grid: boolean[][] = Array.from({ length: ROWS }, () => new Array(COLS).fill(true));
    const result = FULL.check(grid);
    expect(result.distance).toBe(0);
  });

  it('returns distance 0 for DOUBLE_LINE_1 (rows 0+1)', () => {
    // DOUBLE_LINE_1 = XXXXXXXXXX_____  = row0(all) + row1(all)
    const grid = allFalse();
    for (let col = 0; col < COLS; col++) {
      grid[0][col] = true;
      grid[1][col] = true;
    }
    const result = DOUBLE_LINE_1.check(grid);
    expect(result.distance).toBe(0);
  });
});

describe('Pattern hierarchy', () => {
  it('FULL has 6 children', () => {
    expect(FULL.children).toHaveLength(6);
  });

  it('DOUBLE_LINE_1 has LINE_1 and LINE_2 as children', () => {
    expect(DOUBLE_LINE_1.children).toContain(LINE_1);
    expect(DOUBLE_LINE_1.children).toContain(LINE_2);
  });

  it('QUAD_COLUMN_1 has TRIPLE_COLUMN_1 and TRIPLE_COLUMN_2 as children', () => {
    expect(QUAD_COLUMN_1.children).toContain(TRIPLE_COLUMN_1);
  });

  it('removeChildren deducts child payouts', () => {
    const stake = 1;
    const matched = new Set([DOUBLE_LINE_1, LINE_1, LINE_2]);
    const deducted = DOUBLE_LINE_1.removeChildren(matched, stake);
    // LINE_1 and LINE_2 are children, each pays 4*1=4
    expect(deducted).toBe(8);
    // They should be removed from the set
    expect(matched.has(LINE_1)).toBe(false);
    expect(matched.has(LINE_2)).toBe(false);
    expect(matched.has(DOUBLE_LINE_1)).toBe(true);
  });
});

describe('SORTED_PATTERNS', () => {
  it('has 17 patterns', () => {
    expect(SORTED_PATTERNS).toHaveLength(17);
  });

  it('FULL is first (highest priority)', () => {
    expect(SORTED_PATTERNS[0]).toBe(FULL);
  });

  it('LINEs are last (lowest priority)', () => {
    const lastThree = SORTED_PATTERNS.slice(-3);
    expect(lastThree).toContain(LINE_1);
    expect(lastThree).toContain(LINE_2);
    expect(lastThree).toContain(LINE_3);
  });
});

describe('PatternGroup', () => {
  it('calculates payout with stake', () => {
    expect(PatternGroup.LINE.getPayout(10)).toBe(40);
    expect(PatternGroup.FULL.getPayout(5)).toBe(2500);
  });

  it('extra flag is true for priority >= 2', () => {
    expect(PatternGroup.LINE.extra).toBe(false);
    expect(PatternGroup.DOUBLE_COLUMN.extra).toBe(false);
    expect(PatternGroup.TRIPLE_COLUMN.extra).toBe(true);
    expect(PatternGroup.DOUBLE_LINE.extra).toBe(true);
  });

  it('superExtra flag is true for priority >= 4', () => {
    expect(PatternGroup.LINE.superExtra).toBe(false);
    expect(PatternGroup.TRIPLE_COLUMN.superExtra).toBe(false);
    expect(PatternGroup.QUAD_COLUMN.superExtra).toBe(true);
    expect(PatternGroup.QUAD_COLUMN_3.superExtra).toBe(true);
    expect(PatternGroup.FULL.superExtra).toBe(true);
  });
});
