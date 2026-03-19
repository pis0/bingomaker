import { useCallback, useRef, useState } from 'react';
import { Card } from '../engine/Card';
import { distributeCards } from '../engine/CardDistributor';
import { DEFAULT_BALLS, NUM_CARDS, STAKE_LEVELS } from '../engine/constants';
import type { Draw } from '../engine/Draw';
import type { Pattern } from '../engine/Pattern';
import { Round } from '../engine/Round';
import type { SlotSymbol } from '../engine/SlotBonusSession';
import { logDraw, logNewRound } from './helpers/formatters';
import { prioritizePatternBalls, forcePatternMidRound, forceBellBalls } from './helpers/patternForcer';

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
  /** How many balls BallPanel should launch (visual target) */
  targetBallCount: number;
  /** True while balls are in flight (launched but not yet arrived/processed) */
  isSettling: boolean;
  /** Current game phase label for the unified advance button */
  advanceLabel: string;
  /** Whether the advance button should be enabled */
  canAdvance: boolean;
  /** Whether the End button should be shown (extras/super available but skippable) */
  canEnd: boolean;
  /** True during end-of-round payout collect animation */
  isCollecting: boolean;
  /** Previous round's payout — shown in idle state */
  lastPayout: number;
  /** True when bonus animations are playing (bell ring, slot spin, prize anims) */
  bonusActive: boolean;
  /** Called by Menton to report bonus animation state */
  setBonusActive: (active: boolean) => void;
  /** Skip remaining extras — triggers payout collect then auto new round */
  endRound: () => void;
  patternPreview: { pattern: Pattern; cardIndex: number } | null;
  setSeed: (seed: number) => void;
  setStakeIndex: (index: number) => void;
  newRound: (force?: ForceConfig) => void;
  shuffle: () => void;
  forceNow: (config: ForceConfig) => void;
  /** Unified advance: starts discharge, resumes after halt, draws extra/super */
  advance: () => void;
  drawNext: () => void;
  drawAll: () => void;
  drawExtra: () => void;
  drawSuperExtra: () => void;
  /** Process one ball draw (called by Menton when ball arrives in tube) */
  processNextBall: () => Draw | null;
  setPreview: (pattern: Pattern | null, cardIndex: number) => void;
  forceSlotPrize: SlotSymbol | null;
  setForceSlotPrize: (prize: SlotSymbol | null) => void;
  triggerSlot: () => void;
  /** True when BallPanel peel animation is waiting for user input */
  isPeeling: boolean;
  /** Tick counter — increments advance peel one step in BallPanel */
  peelAdvanceTick: number;
  /** BallPanel calls this to report peel start/end */
  handlePeelChange: (peeling: boolean) => void;
}

export function useDebugEngine(): DebugEngine {
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 100000));
  const [stakeIndex, setStakeIndex] = useState(0);
  const stake = STAKE_LEVELS[stakeIndex];
  const [, setTick] = useState(0);
  const [patternPreview, setPatternPreview] = useState<{ pattern: Pattern; cardIndex: number } | null>(null);
  const [isCollecting, setIsCollecting] = useState(false);
  const [lastPayout, setLastPayout] = useState(0);
  const [bonusActive, setBonusActive] = useState(false);
  const [forceSlotPrize, setForceSlotPrize] = useState<SlotSymbol | null>(null);
  const [isPeeling, setIsPeeling] = useState(false);
  const isPeelingRef = useRef(false);
  const peelAdvanceTickRef = useRef(0);

  const handlePeelChange = useCallback((peeling: boolean) => {
    isPeelingRef.current = peeling;
    setIsPeeling(peeling);
    if (!peeling) peelAdvanceTickRef.current = 0;
  }, []);
  const initialRound = useState(() => {
    const random = makeSeededRandom(seed);
    const dist = distributeCards(random);
    const cards: Card[] = [];
    for (let i = 0; i < NUM_CARDS; i++) {
      const card = new Card(i);
      card.setNumbers(dist.cardNumbers[i]);
      cards.push(card);
    }
    return new Round(cards, dist.ballSequence, random);
  })[0];
  const roundRef = useRef<Round | null>(initialRound);
  const targetBallCountRef = useRef(0);
  const lastForceRef = useRef<ForceConfig | undefined>(undefined);
  const forceSlotRef = useRef<SlotSymbol | null>(null);

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

    const round = new Round(cards, ballSequence, random);
    round.slotBonus.forcedPrize = forceSlotRef.current;
    return round;
  }, [seed]);

  const newRound = useCallback((force?: ForceConfig) => {
    // Cancel any pending auto-end timer
    if (autoEndTimerRef.current) { clearTimeout(autoEndTimerRef.current); autoEndTimerRef.current = null; }
    setIsCollecting(false);
    const round = buildRound(force);
    roundRef.current = round;
    targetBallCountRef.current = 0;
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
    round.slotBonus.forcedPrize = forceSlotRef.current;
    roundRef.current = round;
    targetBallCountRef.current = 0;
    setPatternPreview(null);
    logNewRound(round, nextSeed);
    rerender();
  }, [seed, setSeed, rerender]);

  const drawNext = useCallback(() => {
    const round = roundRef.current;
    if (!round) return;
    targetBallCountRef.current = Math.min(
      targetBallCountRef.current + 1,
      round.ballSequence.length,
    );
    rerender();
  }, [rerender]);

  const drawAll = useCallback(() => {
    const round = roundRef.current;
    if (!round) return;
    targetBallCountRef.current = DEFAULT_BALLS;
    rerender();
  }, [rerender]);

  /** Called by Menton when a ball arrives in the tube — process the actual draw */
  const processNextBall = useCallback((): Draw | null => {
    const round = roundRef.current;
    if (!round) return null;
    // Skip if engine already caught up (undo replay scenario)
    if (round.currentBallIndex >= targetBallCountRef.current) return null;
    const draw = round.drawNext(stake);
    if (draw) logDraw(draw, round);
    // AS3: halt for user — cap target when high-priority pattern detected
    if (round.shouldHalt) {
      targetBallCountRef.current = round.currentBallIndex;
    }
    rerender();
    return draw;
  }, [stake, rerender]);

  // Extras now go through BallPanel animation pipeline — just increase targetBallCount
  const drawExtra = useCallback(() => {
    const round = roundRef.current;
    if (!round) return;
    targetBallCountRef.current = round.currentBallIndex + 1;
    rerender();
  }, [rerender]);

  const drawSuperExtra = useCallback(() => {
    const round = roundRef.current;
    if (!round) return;
    targetBallCountRef.current = round.currentBallIndex + 1;
    rerender();
  }, [rerender]);

  const forceNow = useCallback((config: ForceConfig) => {
    const round = roundRef.current;
    if (!round) return;
    forcePatternMidRound(round, config.cardIndex, config.pattern);
    rerender();
  }, [rerender]);

  const setPreview = useCallback((pattern: Pattern | null, cardIndex: number) => {
    setPatternPreview(pattern ? { pattern, cardIndex } : null);
  }, []);

  const handleSetForceSlotPrize = useCallback((prize: SlotSymbol | null) => {
    forceSlotRef.current = prize;
    setForceSlotPrize(prize);
    const round = roundRef.current;
    if (round) {
      round.slotBonus.forcedPrize = prize;
    }
  }, []);

  const triggerSlot = useCallback(() => {
    const round = roundRef.current;
    if (!round || round.slotBonus.triggered) return;
    // Reorder remaining balls so unhit bell balls come next → natural trigger
    const extraBalls = forceBellBalls(round);
    if (extraBalls > 0) {
      // If idle (0 drawn), start full discharge with bells prioritized at the front
      if (round.currentBallIndex === 0) {
        targetBallCountRef.current = DEFAULT_BALLS;
      } else {
        // Mid-round: just extend to cover the bell balls
        targetBallCountRef.current = Math.max(
          targetBallCountRef.current,
          round.currentBallIndex + extraBalls,
        );
      }
    }
    rerender();
  }, [rerender]);

  // ── Unified advance button state machine ──────────────────────
  const round = roundRef.current;
  const drawn = round?.currentBallIndex ?? 0;
  const isSettling = round ? drawn < targetBallCountRef.current : false;
  const halted = round?.shouldHalt ?? false;

  let advanceLabel = 'Play';
  let canAdvance = false;

  if (!round) {
    advanceLabel = 'Play';
    canAdvance = false;
  } else if (isPeeling) {
    // Peel in progress — user clicks to advance each step
    advanceLabel = 'Peel';
    canAdvance = true;
  } else if (isSettling || bonusActive) {
    // Balls in flight or bonus animation active — always disabled
    advanceLabel = drawn < DEFAULT_BALLS ? 'Play' : 'Extra';
    canAdvance = false;
  } else if (drawn === 0) {
    // Round ready, not started
    advanceLabel = 'Play';
    canAdvance = true;
  } else if (drawn < DEFAULT_BALLS && halted) {
    // Halted during initial 30 — user presses to resume
    advanceLabel = 'Next';
    canAdvance = true;
  } else if (drawn < DEFAULT_BALLS) {
    // Mid-discharge but not settling and not halted (shouldn't happen normally)
    advanceLabel = 'Play';
    canAdvance = true;
  } else if (round.extraAvailable) {
    advanceLabel = 'Extra';
    canAdvance = true;
  } else if (round.superExtraAvailable) {
    advanceLabel = 'Super Extra';
    canAdvance = true;
  } else {
    advanceLabel = 'Done';
    canAdvance = false;
  }

  // End button — available whenever extras/super are offered, or when round is done
  // Not blocked by bonusActive — End is a force-end action that overrides animations
  const canEnd = !!round && !isSettling && !isCollecting && drawn >= DEFAULT_BALLS &&
    (round.extraAvailable || round.superExtraAvailable || advanceLabel === 'Done');

  // Auto-end ref to track/cancel pending auto-new-round timer
  const autoEndTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** Start new round (shared helper) */
  const autoNewRound = useCallback(() => {
    // Save last payout for idle display
    const prevPayout = roundRef.current?.totalPayout ?? 0;
    if (prevPayout > 0) setLastPayout(prevPayout);
    setIsCollecting(false);
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
    const r = new Round(cards, dist.ballSequence, random);
    r.slotBonus.forcedPrize = forceSlotRef.current;
    roundRef.current = r;
    targetBallCountRef.current = 0;
    lastForceRef.current = undefined;
    setPatternPreview(null);
    logNewRound(r, nextSeed);
    rerender();
  }, [seed, rerender]);

  /** Manual End — skip extras, collect if payout, then new round */
  const endRound = useCallback(() => {
    const r = roundRef.current;
    if (!r) return;
    targetBallCountRef.current = r.currentBallIndex;
    if (autoEndTimerRef.current) clearTimeout(autoEndTimerRef.current);
    if (r.totalPayout > 0) {
      setIsCollecting(true);
      rerender();
      // Collect animation then new round
      autoEndTimerRef.current = setTimeout(autoNewRound, 1500);
    } else {
      // No payout — new round after brief transition
      autoEndTimerRef.current = setTimeout(autoNewRound, 300);
    }
  }, [autoNewRound, rerender]);

  // Auto-end: when "Done" (no extras), wait 10s for review then new round
  const autoEndFiredRef = useRef(false);
  if (!round || drawn === 0) {
    autoEndFiredRef.current = false;
  }
  if (advanceLabel === 'Done' && !isCollecting && !autoEndFiredRef.current && !isSettling) {
    autoEndFiredRef.current = true;
    const r = roundRef.current!;
    if (r.totalPayout > 0) {
      setIsCollecting(true);
    }
    // AS3: 0.5s delay + collect animation → new round (~2-4s total)
    if (autoEndTimerRef.current) clearTimeout(autoEndTimerRef.current);
    autoEndTimerRef.current = setTimeout(autoNewRound, 3000);
  }

  const advance = useCallback(() => {
    const r = roundRef.current;
    if (!r) return;
    const idx = r.currentBallIndex;

    // If peeling, advance peel step instead of launching new ball
    if (isPeelingRef.current) {
      peelAdvanceTickRef.current++;
      rerender();
      return;
    }

    if (idx === 0 || (idx < DEFAULT_BALLS && !r.shouldHalt)) {
      // Start or resume auto-discharge → target = 30
      targetBallCountRef.current = DEFAULT_BALLS;
    } else if (idx < DEFAULT_BALLS && r.shouldHalt) {
      // Halted → resume discharge (will halt again if needed)
      targetBallCountRef.current = DEFAULT_BALLS;
    } else if (r.extraAvailable) {
      // Extra — animate through BallPanel (starts peel)
      targetBallCountRef.current = r.currentBallIndex + 1;
    } else if (r.superExtraAvailable) {
      // Super extra — animate through BallPanel (starts peel)
      targetBallCountRef.current = r.currentBallIndex + 1;
    }
    rerender();
  }, [stake, rerender]);

  return {
    round,
    seed,
    stake,
    stakeIndex,
    targetBallCount: targetBallCountRef.current,
    isSettling,
    advanceLabel,
    canAdvance,
    canEnd,
    isCollecting,
    lastPayout,
    bonusActive,
    setBonusActive,
    endRound,
    patternPreview,
    setSeed,
    setStakeIndex: (i: number) => setStakeIndex(Math.max(0, Math.min(i, STAKE_LEVELS.length - 1))),
    newRound,
    shuffle,
    forceNow,
    advance,
    drawNext,
    drawAll,
    drawExtra,
    drawSuperExtra,
    processNextBall,
    setPreview,
    forceSlotPrize,
    setForceSlotPrize: handleSetForceSlotPrize,
    triggerSlot,
    isPeeling,
    peelAdvanceTick: peelAdvanceTickRef.current,
    handlePeelChange,
  };
}
