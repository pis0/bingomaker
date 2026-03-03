import { describe, expect, it } from 'vitest';
import { Card } from '../Card';
import { Round } from '../Round';
import { DEFAULT_BALLS } from '../constants';
import { distributeCards } from '../CardDistributor';

function makeSeededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return s / 2147483647;
  };
}

describe('Round', () => {
  const STAKE = 1;

  function createRound(seed: number) {
    const random = makeSeededRandom(seed);
    const { cardNumbers, ballSequence } = distributeCards(random);
    const cards = cardNumbers.map((nums, i) => {
      const card = new Card(i);
      card.setNumbers(nums);
      return card;
    });
    return new Round(cards, ballSequence);
  }

  it('processes 30 default balls', () => {
    const round = createRound(42);
    round.process(STAKE);
    expect(round.draws).toHaveLength(DEFAULT_BALLS);
  });

  it('each draw has a valid ball', () => {
    const round = createRound(42);
    round.process(STAKE);
    for (const draw of round.draws) {
      expect(draw.ball).toBeGreaterThanOrEqual(1);
      expect(draw.ball).toBeLessThanOrEqual(90);
    }
  });

  it('draws that hit cards have affectedCard >= 0', () => {
    const round = createRound(42);
    round.process(STAKE);
    // With proper distribution, all balls should hit a card
    for (const draw of round.draws) {
      expect(draw.affectedCard).toBeGreaterThanOrEqual(0);
    }
  });

  it('draws have correct card index', () => {
    const round = createRound(42);
    round.process(STAKE);
    for (const draw of round.draws) {
      if (draw.affectedCard >= 0) {
        expect(draw.affectedCard).toBeLessThan(4);
      }
    }
  });

  it('totalPayout accumulates correctly', () => {
    const round = createRound(42);
    round.process(STAKE);

    let expectedPayout = 0;
    for (const draw of round.draws) {
      expectedPayout += draw.additionalPayout;
    }
    expect(round.totalPayout).toBe(expectedPayout);
  });

  it('can draw extra balls after process', () => {
    const round = createRound(42);
    round.process(STAKE);

    const extraDraw = round.drawExtra(STAKE);
    if (extraDraw) {
      expect(round.draws).toHaveLength(DEFAULT_BALLS + 1);
    }
  });

  it('is deterministic with same seed', () => {
    const r1 = createRound(999);
    const r2 = createRound(999);
    r1.process(STAKE);
    r2.process(STAKE);

    expect(r1.draws.map((d) => d.ball)).toEqual(r2.draws.map((d) => d.ball));
    expect(r1.totalPayout).toBe(r2.totalPayout);
  });
});
