import { useCallback, useRef, useState } from 'react';
import { Card } from '../engine/Card';
import { distributeCards } from '../engine/CardDistributor';
import { DEFAULT_BALLS, NUM_CARDS, STAKE_LEVELS } from '../engine/constants';
import type { Pattern } from '../engine/Pattern';
import { Round } from '../engine/Round';
import { logDraw, logNewRound } from './helpers/formatters';
import { prioritizePatternBalls, forcePatternMidRound } from './helpers/patternForcer';

function makeSeededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return s / 2147483647;
  };
}

export interface ForceConfig {
  pattern: Pattern;
  cardIndex: number;
}

export interface DebugEngine {
  round: Round | null;
  seed: number;
  stake: number;
  stakeIndex: number;
  patternPreview: { pattern: Pattern; cardIndex: number } | null;
  setSeed: (seed: number) => void;
  setStakeIndex: (index: number) => void;
  newRound: (force?: ForceConfig) => void;
  shuffle: () => void;
  forceNow: (config: ForceConfig) => void;
  drawNext: () => void;
  drawAll: () => void;
  drawExtra: () => void;
  drawSuperExtra: () => void;
  undoDraw: () => void;
  setPreview: (pattern: Pattern | null, cardIndex: number) => void;
}

export function useDebugEngine(): DebugEngine {
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 100000));
  const [stakeIndex, setStakeIndex] = useState(0);
  const stake = STAKE_LEVELS[stakeIndex];
  const [, setTick] = useState(0);
  const [patternPreview, setPatternPreview] = useState<{ pattern: Pattern; cardIndex: number } | null>(null);
  const roundRef = useRef<Round | null>(null);
  const lastForceRef = useRef<ForceConfig | undefined>(undefined);

  const rerender = useCallback(() => setTick((t) => t + 1), []);

  const buildRound = useCallback((force?: ForceConfig): Round => {
    const random = makeSeededRandom(seed);
    const dist = distributeCards(random);
    const cards: Card[] = [];
    for (let i = 0; i < NUM_CARDS; i++) {
      const card = new Card(i);
      card.setNumbers(dist.cardNumbers[i]);
      cards.push(card);
    }

    let ballSequence = dist.ballSequence;
    if (force) {
      const card = cards[force.cardIndex];
      if (card) {
        ballSequence = prioritizePatternBalls(ballSequence, card, force.pattern);
      }
    }

    return new Round(cards, ballSequence, random);
  }, [seed]);

  const newRound = useCallback((force?: ForceConfig) => {
    const round = buildRound(force);
    roundRef.current = round;
    lastForceRef.current = force;
    setPatternPreview(null);
    logNewRound(round, seed);
    rerender();
  }, [seed, buildRound, rerender]);

  const shuffle = useCallback(() => {
    if (!roundRef.current) return;
    const nextSeed = seed + 1;
    setSeed(nextSeed);
    const random = makeSeededRandom(nextSeed);
    const dist = distributeCards(random);
    const cards: Card[] = [];
    for (let i = 0; i < NUM_CARDS; i++) {
      const card = new Card(i);
      card.setNumbers(dist.cardNumbers[i]);
      cards.push(card);
    }
    let ballSequence = dist.ballSequence;
    const force = lastForceRef.current;
    if (force) {
      const card = cards[force.cardIndex];
      if (card) ballSequence = prioritizePatternBalls(ballSequence, card, force.pattern);
    }
    const round = new Round(cards, ballSequence, random);
    roundRef.current = round;
    setPatternPreview(null);
    logNewRound(round, nextSeed);
    rerender();
  }, [seed, setSeed, rerender]);

  const drawNext = useCallback(() => {
    const round = roundRef.current;
    if (!round) return;
    const draw = round.drawNext(stake);
    if (draw) logDraw(draw, round);
    rerender();
  }, [stake, rerender]);

  const drawAll = useCallback(() => {
    const round = roundRef.current;
    if (!round) return;
    const remaining = DEFAULT_BALLS - round.currentBallIndex;
    for (let i = 0; i < remaining; i++) {
      const draw = round.drawNext(stake);
      if (draw) logDraw(draw, round);
    }
    rerender();
  }, [stake, rerender]);

  const undoDraw = useCallback(() => {
    const round = roundRef.current;
    if (!round || round.currentBallIndex === 0) return;
    const replayCount = round.currentBallIndex - 1;
    const fresh = buildRound(lastForceRef.current);
    for (let i = 0; i < replayCount; i++) {
      fresh.drawNext(stake);
    }
    roundRef.current = fresh;
    rerender();
  }, [stake, buildRound, rerender]);

  const drawExtra = useCallback(() => {
    const round = roundRef.current;
    if (!round) return;
    const draw = round.drawExtra(stake);
    if (draw) logDraw(draw, round);
    rerender();
  }, [stake, rerender]);

  const drawSuperExtra = useCallback(() => {
    const round = roundRef.current;
    if (!round) return;
    const draw = round.drawSuperExtra(stake);
    if (draw) logDraw(draw, round);
    rerender();
  }, [stake, rerender]);

  const forceNow = useCallback((config: ForceConfig) => {
    const round = roundRef.current;
    if (!round) return;
    forcePatternMidRound(round, config.cardIndex, config.pattern);
    rerender();
  }, [rerender]);

  const setPreview = useCallback((pattern: Pattern | null, cardIndex: number) => {
    setPatternPreview(pattern ? { pattern, cardIndex } : null);
  }, []);

  return {
    round: roundRef.current,
    seed,
    stake,
    stakeIndex,
    patternPreview,
    setSeed,
    setStakeIndex: (i: number) => setStakeIndex(Math.max(0, Math.min(i, STAKE_LEVELS.length - 1))),
    newRound,
    shuffle,
    forceNow,
    drawNext,
    drawAll,
    drawExtra,
    drawSuperExtra,
    undoDraw,
    setPreview,
  };
}
