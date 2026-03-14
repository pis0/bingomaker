import { COLS, ROWS } from './constants';
import type { Grid } from './types';
import type { Pattern } from './Pattern';
import { MissingPatternsHolder } from './MissingPatternsHolder';
import { CardMatches } from './CardMatches';

export class Card {
  readonly index: number;
  readonly numbers: Grid<number> = [];
  readonly matches: Grid<boolean> = [];
  readonly inPattern: Grid<boolean> = [];
  readonly patternPriority: Grid<number> = [];
  readonly expectations: Grid<MissingPatternsHolder | null> = [];

  /** ball number → { row, col } for quick lookup */
  private readonly ballPosition = new Map<number, { row: number; col: number }>();

  /** Patterns completed this round */
  readonly completedPatterns: Set<Pattern> = new Set();

  /** Last matched cell (for CardMatches snapshot) */
  private lastMatch: { row: number; col: number } | null = null;

  /** Payout accumulated this round */
  payout = 0;

  /** Max priority among missing-one patterns */
  maxMissingPriority = 0;

  /** Max priority among completed patterns */
  maxCompletedPriority = 0;

  constructor(index: number) {
    this.index = index;
    for (let row = 0; row < ROWS; row++) {
      this.numbers[row] = new Array(COLS).fill(0);
      this.matches[row] = new Array(COLS).fill(false);
      this.inPattern[row] = new Array(COLS).fill(false);
      this.patternPriority[row] = new Array(COLS).fill(0);
      this.expectations[row] = new Array(COLS).fill(null);
    }
  }

  /**
   * Set 15 numbers in column-major order (matching AS3 behavior):
   * row = i % 3, col = floor(i / 3)
   */
  setNumbers(nums: number[]): void {
    this.ballPosition.clear();
    for (let i = 0; i < nums.length; i++) {
      const row = i % ROWS;
      const col = Math.floor(i / ROWS);
      this.numbers[row][col] = nums[i];
      this.ballPosition.set(nums[i], { row, col });
    }
  }

  /** Reset card state for a new round */
  reset(cardsByBall: Map<number, Card>): void {
    this.payout = 0;
    this.maxMissingPriority = 0;
    this.maxCompletedPriority = 0;
    this.lastMatch = null;
    this.completedPatterns.clear();

    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        this.matches[row][col] = false;
        this.inPattern[row][col] = false;
        this.patternPriority[row][col] = 0;
        this.expectations[row][col] = null;
      }
    }

    // Register this card's balls in the global lookup
    for (const ball of this.ballPosition.keys()) {
      cardsByBall.set(ball, this);
    }
  }

  /** Check if this card contains the given ball */
  hasBall(ball: number): boolean {
    return this.ballPosition.has(ball);
  }

  /** Get position of a ball on this card */
  getPosition(ball: number): { row: number; col: number } | undefined {
    return this.ballPosition.get(ball);
  }

  /** Mark a ball as matched */
  setMatch(ball: number): { row: number; col: number } | null {
    const pos = this.ballPosition.get(ball);
    if (!pos) return null;

    this.matches[pos.row][pos.col] = true;
    this.expectations[pos.row][pos.col] = null; // clear expectation
    this.lastMatch = pos;
    return pos;
  }

  /** Mark cells of a completed pattern */
  setPattern(pattern: Pattern, stake: number): number {
    this.completedPatterns.add(pattern);

    // Mark cells in pattern with priority
    const priority = pattern.group.priority;
    if (priority > this.maxCompletedPriority) {
      this.maxCompletedPriority = priority;
    }
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        if (pattern.getMaskIndex(row, col)) {
          this.inPattern[row][col] = true;
          if (priority > this.patternPriority[row][col]) {
            this.patternPriority[row][col] = priority;
          }
        }
      }
    }

    // Payout: pattern payout minus children already matched
    let payout = pattern.group.getPayout(stake);
    const deducted = pattern.removeChildren(this.completedPatterns, stake);
    payout -= deducted;

    this.payout += payout;
    return payout;
  }

  /** Set a missing-one expectation on the missing cell */
  setMissingOnePattern(pattern: Pattern, missingRow: number, missingCol: number, stake: number): void {
    let holder = this.expectations[missingRow][missingCol];
    if (!holder) {
      holder = new MissingPatternsHolder(stake);
      this.expectations[missingRow][missingCol] = holder;
    }
    holder.addPattern(pattern);

    if (pattern.group.priority > this.maxMissingPriority) {
      this.maxMissingPriority = pattern.group.priority;
    }
  }

  /** Clear all expectations (before re-evaluating patterns) */
  clearExpectations(): void {
    this.maxMissingPriority = 0;
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        this.expectations[row][col] = null;
      }
    }
  }

  /** Produce an immutable snapshot of current state */
  produceCardMatches(): CardMatches {
    return new CardMatches(this.matches, this.inPattern, this.lastMatch, this.expectations);
  }

  /** Clear lastMatch after snapshot is taken */
  clearLastMatch(): void {
    this.lastMatch = null;
  }
}
