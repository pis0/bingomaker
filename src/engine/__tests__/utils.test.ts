import { describe, expect, it } from 'vitest';
import { range, shuffle } from '../utils';

describe('range', () => {
  it('generates inclusive range', () => {
    expect(range(1, 5)).toEqual([1, 2, 3, 4, 5]);
  });

  it('generates single element range', () => {
    expect(range(3, 3)).toEqual([3]);
  });

  it('generates empty for start > end', () => {
    expect(range(5, 3)).toEqual([]);
  });
});

describe('shuffle', () => {
  it('preserves all elements', () => {
    const input = [1, 2, 3, 4, 5];
    const result = shuffle(input);
    expect(result.sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5]);
  });

  it('does not mutate original array', () => {
    const input = [1, 2, 3, 4, 5];
    shuffle(input);
    expect(input).toEqual([1, 2, 3, 4, 5]);
  });

  it('produces deterministic output with seeded random', () => {
    let seed = 42;
    const seededRandom = () => {
      seed = (seed * 16807 + 0) % 2147483647;
      return seed / 2147483647;
    };

    const result = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], seededRandom);

    // Reset seed and shuffle again — should produce same result
    seed = 42;
    const result2 = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], seededRandom);

    expect(result).toEqual(result2);
  });

  it('preserves length', () => {
    const input = range(1, 90);
    expect(shuffle(input)).toHaveLength(90);
  });
});
