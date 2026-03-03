import { describe, expect, it } from 'vitest';
import { GameSession } from '../GameSession';
import { DEFAULT_BALLS } from '../constants';

function makeSeededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return s / 2147483647;
  };
}

describe('GameSession', () => {
  it('creates a round with 30 draws', () => {
    const session = new GameSession(makeSeededRandom(42));
    const result = session.createRound({ stake: 1 });

    expect(result.draws).toHaveLength(DEFAULT_BALLS);
    expect(result.round).toBeDefined();
    expect(typeof result.totalPayout).toBe('number');
    expect(typeof result.extraAvailable).toBe('boolean');
    expect(typeof result.superExtraAvailable).toBe('boolean');
  });

  it('payout is non-negative', () => {
    const session = new GameSession(makeSeededRandom(42));
    const result = session.createRound({ stake: 10 });
    expect(result.totalPayout).toBeGreaterThanOrEqual(0);
  });

  it('can draw extras after round', () => {
    const session = new GameSession(makeSeededRandom(42));
    const result = session.createRound({ stake: 1 });

    const extra = session.drawExtra(result.round, 1);
    if (extra) {
      expect(extra.ball).toBeGreaterThanOrEqual(1);
    }
  });

  it('is deterministic', () => {
    const r1 = new GameSession(makeSeededRandom(777));
    const r2 = new GameSession(makeSeededRandom(777));

    const res1 = r1.createRound({ stake: 5 });
    const res2 = r2.createRound({ stake: 5 });

    expect(res1.totalPayout).toBe(res2.totalPayout);
    expect(res1.draws.map((d) => d.ball)).toEqual(res2.draws.map((d) => d.ball));
  });
});
