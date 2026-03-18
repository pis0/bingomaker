import { SORTED_PATTERNS, type Pattern } from './Pattern';
import type { Card } from './Card';

export interface PatternCheckResult {
  additionalPayout: number;
  newPatterns: Pattern[];
}

/**
 * Check all patterns against a card's current match state.
 * Marks complete patterns and missing-one expectations.
 * Returns additional payout and list of newly completed patterns.
 */
export function checkForPatterns(card: Card, stake: number): PatternCheckResult {
  let additionalPayout = 0;
  const newPatterns: Pattern[] = [];

  // Reset marking flags
  for (const pattern of SORTED_PATTERNS) {
    pattern.marked = false;
  }

  // Clear expectations before re-evaluating
  card.clearExpectations();

  // Iterate patterns from highest priority to lowest
  for (const pattern of SORTED_PATTERNS) {
    if (pattern.marked) continue;
    if (card.completedPatterns.has(pattern)) {
      pattern.marked = true;
      continue;
    }

    const result = pattern.check(card.matches);

    if (result.distance === 0) {
      // Pattern complete!
      const payout = card.setPattern(pattern, stake);
      additionalPayout += payout;
      newPatterns.push(pattern);
      pattern.marked = true;
      // Mark all children as processed
      markChildren(pattern);
    } else if (result.distance === 1) {
      // Missing one ball
      card.setMissingOnePattern(pattern, result.missingRow, result.missingCol, stake);
    }
  }

  return { additionalPayout, newPatterns };
}

function markChildren(pattern: { children: { marked: boolean; children: typeof pattern.children }[] }): void {
  for (const child of pattern.children) {
    child.marked = true;
    markChildren(child);
  }
}
