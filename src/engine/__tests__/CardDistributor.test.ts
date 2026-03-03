import { describe, expect, it } from 'vitest';
import { distributeCards } from '../CardDistributor';
import { CELLS, NUM_CARDS, TOTAL_NUMBERS } from '../constants';

function makeSeededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return s / 2147483647;
  };
}

describe('CardDistributor', () => {
  const random = makeSeededRandom(42);
  const dist = distributeCards(random);

  it('creates 4 cards', () => {
    expect(dist.cardNumbers).toHaveLength(NUM_CARDS);
  });

  it('each card has 15 numbers', () => {
    for (const nums of dist.cardNumbers) {
      expect(nums).toHaveLength(CELLS);
    }
  });

  it('each card is sorted', () => {
    for (const nums of dist.cardNumbers) {
      for (let i = 1; i < nums.length; i++) {
        expect(nums[i]).toBeGreaterThan(nums[i - 1]);
      }
    }
  });

  it('all numbers are in range 1-90', () => {
    const all = dist.cardNumbers.flat();
    for (const n of all) {
      expect(n).toBeGreaterThanOrEqual(1);
      expect(n).toBeLessThanOrEqual(TOTAL_NUMBERS);
    }
  });

  it('no duplicate numbers across cards', () => {
    const all = dist.cardNumbers.flat();
    expect(new Set(all).size).toBe(NUM_CARDS * CELLS);
  });

  it('ball sequence has 60 numbers', () => {
    expect(dist.ballSequence).toHaveLength(NUM_CARDS * CELLS);
  });

  it('ball sequence contains all card numbers', () => {
    const allCardNums = new Set(dist.cardNumbers.flat());
    const seqNums = new Set(dist.ballSequence);
    expect(seqNums).toEqual(allCardNums);
  });

  it('is deterministic with same seed', () => {
    const r1 = makeSeededRandom(123);
    const r2 = makeSeededRandom(123);
    const d1 = distributeCards(r1);
    const d2 = distributeCards(r2);
    expect(d1.cardNumbers).toEqual(d2.cardNumbers);
    expect(d1.ballSequence).toEqual(d2.ballSequence);
  });
});
