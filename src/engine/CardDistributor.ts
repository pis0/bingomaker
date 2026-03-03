import { CELLS, NUM_CARDS, TOTAL_NUMBERS } from './constants';
import type { RandomFn } from './types';
import { range, shuffle } from './utils';

export interface Distribution {
  /** 4 arrays of 15 sorted numbers each */
  cardNumbers: number[][];
  /** All 60 card numbers shuffled as the ball sequence */
  ballSequence: number[];
}

/**
 * Shuffle 1..90, distribute 15 per card (sorted), and create ball sequence.
 */
export function distributeCards(random: RandomFn = Math.random): Distribution {
  const allNumbers = shuffle(range(1, TOTAL_NUMBERS), random);

  const cardNumbers: number[][] = [];
  for (let i = 0; i < NUM_CARDS; i++) {
    const start = i * CELLS;
    const nums = allNumbers.slice(start, start + CELLS).sort((a, b) => a - b);
    cardNumbers.push(nums);
  }

  // Ball sequence = all 60 card numbers shuffled
  const allCardNumbers = cardNumbers.flat();
  const ballSequence = shuffle(allCardNumbers, random);

  return { cardNumbers, ballSequence };
}
