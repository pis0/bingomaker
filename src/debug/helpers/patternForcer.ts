import { COLS, ROWS } from '../../engine/constants';
import type { Card } from '../../engine/Card';
import type { Pattern } from '../../engine/Pattern';
import type { Round } from '../../engine/Round';
import type { SlotPosition } from '../../engine/SlotBonusSession';

/**
 * Get the ball numbers still needed to complete a pattern on a card.
 * Skips cells already matched.
 */
function getUnmatchedPatternBalls(card: Card, pattern: Pattern): Set<number> {
  const balls = new Set<number>();
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      if (pattern.getMaskIndex(row, col) && !card.matches[row][col]) {
        balls.add(card.numbers[row][col]);
      }
    }
  }
  return balls;
}

/**
 * Reorders a ball sequence so the pattern's unmatched balls come first.
 * The rest stays in its original relative order.
 */
export function prioritizePatternBalls(
  ballSequence: number[],
  card: Card,
  pattern: Pattern,
): number[] {
  const needed = getUnmatchedPatternBalls(card, pattern);

  const front: number[] = [];
  const rest: number[] = [];

  for (const ball of ballSequence) {
    if (needed.has(ball)) {
      front.push(ball);
      needed.delete(ball);
    } else {
      rest.push(ball);
    }
  }

  return [...front, ...rest];
}

/**
 * Reorder the remaining (undrawn) balls of an in-progress round
 * so that the pattern's needed balls come next.
 */
export function forcePatternMidRound(
  round: Round,
  cardIndex: number,
  pattern: Pattern,
): void {
  const card = round.cards[cardIndex];
  if (!card) return;

  const remaining = round.ballSequence.slice(round.currentBallIndex);
  const reordered = prioritizePatternBalls(remaining, card, pattern);
  round.reorderRemaining(reordered);
}

/**
 * Reorder remaining balls so unhit bell positions come next.
 * Returns the number of extra balls needed (to add to targetBallCount).
 */
export function forceBellBalls(round: Round): number {
  const positions: SlotPosition[] = round.slotBonus.positions;
  const unhitBalls = new Set<number>();
  for (const pos of positions) {
    if (!pos.hit) unhitBalls.add(pos.ball);
  }
  if (unhitBalls.size === 0) return 0;

  const remaining = round.ballSequence.slice(round.currentBallIndex);
  const front: number[] = [];
  const rest: number[] = [];

  for (const ball of remaining) {
    if (unhitBalls.has(ball)) {
      front.push(ball);
      unhitBalls.delete(ball);
    } else {
      rest.push(ball);
    }
  }

  round.reorderRemaining([...front, ...rest]);
  return front.length;
}
