import type { Pattern } from './Pattern';

/**
 * Tracks patterns that are "missing one" for a specific cell.
 * Calculates expected value (sum of payouts minus children deductions).
 */
export class MissingPatternsHolder {
  private readonly patterns: Pattern[] = [];
  private _expectation = 0;
  private _maxPriority = 0;
  private _dirty = true;
  private readonly stake: number;

  constructor(stake: number) {
    this.stake = stake;
  }

  addPattern(pattern: Pattern): void {
    this.patterns.push(pattern);
    this._dirty = true;
  }

  get expectation(): number {
    if (this._dirty) this.recalculate();
    return this._expectation;
  }

  get maxPriority(): number {
    if (this._dirty) this.recalculate();
    return this._maxPriority;
  }

  get patternCount(): number {
    return this.patterns.length;
  }

  getPatterns(): readonly Pattern[] {
    return this.patterns;
  }

  private recalculate(): void {
    this._expectation = 0;
    this._maxPriority = 0;

    // Build set of all patterns for child deduction
    const patternSet = new Set(this.patterns);

    for (const pattern of this.patterns) {
      if (!patternSet.has(pattern)) continue; // already removed as a child
      this._expectation += pattern.group.getPayout(this.stake);
      if (pattern.group.priority > this._maxPriority) {
        this._maxPriority = pattern.group.priority;
      }
      // Remove children from the set so we don't double-count
      for (const child of pattern.children) {
        if (patternSet.has(child)) {
          patternSet.delete(child);
        }
      }
    }

    // Recalculate with only non-deducted patterns
    this._expectation = 0;
    for (const pattern of patternSet) {
      this._expectation += pattern.group.getPayout(this.stake);
    }

    this._dirty = false;
  }
}
