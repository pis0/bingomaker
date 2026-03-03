import { CELLS, COLS, ROWS } from './constants';
import { PatternGroup } from './PatternGroup';

export class Pattern {
  readonly name: string;
  readonly group: PatternGroup;
  readonly mask: boolean[];
  readonly requiredCount: number;
  children: Pattern[] = [];

  /** Mutable marking flag — reset each resolver pass */
  marked = false;

  constructor(name: string, group: PatternGroup, maskStr: string) {
    this.name = name;
    this.group = group;
    this.mask = Array.from(maskStr, (ch) => ch === 'X');
    this.requiredCount = this.mask.filter(Boolean).length;
  }

  /**
   * Check distance of a card's match grid against this pattern.
   * Returns 0 = complete match, 1 = missing one, >1 = far.
   * Early-exits when missing > 1 for performance.
   */
  check(matches: boolean[][]): { distance: number; missingRow: number; missingCol: number } {
    let missing = 0;
    let missingRow = -1;
    let missingCol = -1;

    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        if (this.mask[row * COLS + col] && !matches[row][col]) {
          missing++;
          if (missing > 1) return { distance: missing, missingRow: -1, missingCol: -1 };
          missingRow = row;
          missingCol = col;
        }
      }
    }

    return { distance: missing, missingRow, missingCol };
  }

  /**
   * Remove children from the matched patterns list and return the sum
   * of their payouts (for hierarchical deduction).
   */
  removeChildren(matchedPatterns: Set<Pattern>, stake: number): number {
    let deducted = 0;
    for (const child of this.children) {
      if (matchedPatterns.has(child)) {
        matchedPatterns.delete(child);
        deducted += child.group.getPayout(stake);
      }
      // Recurse into grandchildren
      deducted += child.removeChildren(matchedPatterns, stake);
    }
    return deducted;
  }

  getMaskIndex(row: number, col: number): boolean {
    return this.mask[row * COLS + col];
  }
}

// --- 17 Pattern instances ---

export const LINE_1 = new Pattern('LINE_1', PatternGroup.LINE, 'XXXXX__________');
export const LINE_2 = new Pattern('LINE_2', PatternGroup.LINE, '_____XXXXX_____');
export const LINE_3 = new Pattern('LINE_3', PatternGroup.LINE, '__________XXXXX');

export const DOUBLE_COLUMN_1 = new Pattern('DOUBLE_COLUMN_1', PatternGroup.DOUBLE_COLUMN, 'XX___XX___XX___');
export const DOUBLE_COLUMN_2 = new Pattern('DOUBLE_COLUMN_2', PatternGroup.DOUBLE_COLUMN, '_XX___XX___XX__');
export const DOUBLE_COLUMN_3 = new Pattern('DOUBLE_COLUMN_3', PatternGroup.DOUBLE_COLUMN, '__XX___XX___XX_');
export const DOUBLE_COLUMN_4 = new Pattern('DOUBLE_COLUMN_4', PatternGroup.DOUBLE_COLUMN, '___XX___XX___XX');

export const TRIPLE_COLUMN_1 = new Pattern('TRIPLE_COLUMN_1', PatternGroup.TRIPLE_COLUMN, 'XXX__XXX__XXX__');
export const TRIPLE_COLUMN_2 = new Pattern('TRIPLE_COLUMN_2', PatternGroup.TRIPLE_COLUMN, '_XXX__XXX__XXX_');
export const TRIPLE_COLUMN_3 = new Pattern('TRIPLE_COLUMN_3', PatternGroup.TRIPLE_COLUMN, '__XXX__XXX__XXX');

export const DOUBLE_LINE_1 = new Pattern('DOUBLE_LINE_1', PatternGroup.DOUBLE_LINE, 'XXXXXXXXXX_____');
export const DOUBLE_LINE_2 = new Pattern('DOUBLE_LINE_2', PatternGroup.DOUBLE_LINE, 'XXXXX_____XXXXX');
export const DOUBLE_LINE_3 = new Pattern('DOUBLE_LINE_3', PatternGroup.DOUBLE_LINE, '_____XXXXXXXXXX');

export const QUAD_COLUMN_1 = new Pattern('QUAD_COLUMN_1', PatternGroup.QUAD_COLUMN, 'XXXX_XXXX_XXXX_');
export const QUAD_COLUMN_2 = new Pattern('QUAD_COLUMN_2', PatternGroup.QUAD_COLUMN, '_XXXX_XXXX_XXXX');
export const QUAD_COLUMN_3 = new Pattern('QUAD_COLUMN_3', PatternGroup.QUAD_COLUMN_3, 'XX_XXXX_XXXX_XX');

export const FULL = new Pattern('FULL', PatternGroup.FULL, 'XXXXXXXXXXXXXXX');

// --- Hierarchy (parent → children) ---

FULL.children = [QUAD_COLUMN_1, QUAD_COLUMN_2, QUAD_COLUMN_3, DOUBLE_LINE_1, DOUBLE_LINE_2, DOUBLE_LINE_3];
QUAD_COLUMN_1.children = [TRIPLE_COLUMN_1, TRIPLE_COLUMN_2];
QUAD_COLUMN_2.children = [TRIPLE_COLUMN_2, TRIPLE_COLUMN_3];
QUAD_COLUMN_3.children = [DOUBLE_COLUMN_1, DOUBLE_COLUMN_4];
TRIPLE_COLUMN_1.children = [DOUBLE_COLUMN_1, DOUBLE_COLUMN_2];
TRIPLE_COLUMN_2.children = [DOUBLE_COLUMN_2, DOUBLE_COLUMN_3];
TRIPLE_COLUMN_3.children = [DOUBLE_COLUMN_3, DOUBLE_COLUMN_4];
DOUBLE_LINE_1.children = [LINE_1, LINE_2];
DOUBLE_LINE_2.children = [LINE_1, LINE_3];
DOUBLE_LINE_3.children = [LINE_2, LINE_3];

/** All patterns sorted by priority descending (FULL first, LINE last) */
export const SORTED_PATTERNS: Pattern[] = [
  FULL,
  QUAD_COLUMN_3, QUAD_COLUMN_1, QUAD_COLUMN_2,
  DOUBLE_LINE_1, DOUBLE_LINE_2, DOUBLE_LINE_3,
  TRIPLE_COLUMN_1, TRIPLE_COLUMN_2, TRIPLE_COLUMN_3,
  DOUBLE_COLUMN_1, DOUBLE_COLUMN_2, DOUBLE_COLUMN_3, DOUBLE_COLUMN_4,
  LINE_1, LINE_2, LINE_3,
];

/** Total number of pattern cells (for validation) */
export { CELLS };
