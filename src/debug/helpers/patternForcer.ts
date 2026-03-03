import { COLS, ROWS } from '../../engine/constants';
import type { Card } from '../../engine/Card';
import type { Pattern } from '../../engine/Pattern';
import { checkForPatterns } from '../../engine/PatternResolver';
import { logForceResult } from './formatters';

export interface ForceResult {
  forcedCells: Array<{ row: number; col: number; ball: number }>;
  payout: number;
  completedPatterns: string[];
}

/**
 * Force-matches cells required by a pattern on a card, then runs the resolver.
 * WARNING: mutates the card in-place.
 */
export function forcePatternOnCard(card: Card, pattern: Pattern, stake: number): ForceResult {
  const forcedCells: Array<{ row: number; col: number; ball: number }> = [];

  // Force each required cell that isn't already matched
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      if (pattern.getMaskIndex(row, col) && !card.matches[row][col]) {
        card.matches[row][col] = true;
        forcedCells.push({ row, col, ball: card.numbers[row][col] });
      }
    }
  }

  // Run pattern resolver
  const payout = checkForPatterns(card, stake);
  const completedPatterns = [...card.completedPatterns].map((p) => p.name);

  logForceResult(card, pattern, forcedCells, payout);

  return { forcedCells, payout, completedPatterns };
}
