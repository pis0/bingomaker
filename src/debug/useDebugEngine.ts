import { useCallback, useReducer } from 'react';
import { Card } from '../engine/Card';
import { distributeCards } from '../engine/CardDistributor';
import { DEFAULT_BALLS, NUM_CARDS } from '../engine/constants';
import type { Pattern } from '../engine/Pattern';
import { Round } from '../engine/Round';
import { logDraw, logNewRound } from './helpers/formatters';
import { forcePatternOnCard, type ForceResult } from './helpers/patternForcer';

function makeSeededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return s / 2147483647;
  };
}

interface DebugState {
  round: Round | null;
  seed: number;
  stake: number;
  tick: number;
  patternPreview: { pattern: Pattern; cardIndex: number } | null;
}

type DebugAction =
  | { type: 'SET_SEED'; seed: number }
  | { type: 'SET_STAKE'; stake: number }
  | { type: 'NEW_ROUND' }
  | { type: 'DRAW_NEXT' }
  | { type: 'DRAW_ALL' }
  | { type: 'DRAW_EXTRA' }
  | { type: 'DRAW_SUPER_EXTRA' }
  | { type: 'SET_PREVIEW'; pattern: Pattern | null; cardIndex: number }
  | { type: 'FORCE_PATTERN'; pattern: Pattern; cardIndex: number }
  | { type: 'TICK' };

function reducer(state: DebugState, action: DebugAction): DebugState {
  switch (action.type) {
    case 'SET_SEED':
      return { ...state, seed: action.seed };
    case 'SET_STAKE':
      return { ...state, stake: action.stake };
    case 'NEW_ROUND': {
      const random = makeSeededRandom(state.seed);
      const dist = distributeCards(random);
      const cards: Card[] = [];
      for (let i = 0; i < NUM_CARDS; i++) {
        const card = new Card(i);
        card.setNumbers(dist.cardNumbers[i]);
        cards.push(card);
      }
      const round = new Round(cards, dist.ballSequence);
      logNewRound(round, state.seed);
      return { ...state, round, tick: state.tick + 1, patternPreview: null };
    }
    case 'DRAW_NEXT': {
      if (!state.round) return state;
      const draw = state.round.drawNext(state.stake);
      if (draw) logDraw(draw, state.round);
      return { ...state, tick: state.tick + 1 };
    }
    case 'DRAW_ALL': {
      if (!state.round) return state;
      const remaining = DEFAULT_BALLS - state.round.currentBallIndex;
      for (let i = 0; i < remaining; i++) {
        const draw = state.round.drawNext(state.stake);
        if (draw) logDraw(draw, state.round);
      }
      return { ...state, tick: state.tick + 1 };
    }
    case 'DRAW_EXTRA': {
      if (!state.round) return state;
      const draw = state.round.drawExtra(state.stake);
      if (draw) logDraw(draw, state.round);
      return { ...state, tick: state.tick + 1 };
    }
    case 'DRAW_SUPER_EXTRA': {
      if (!state.round) return state;
      const draw = state.round.drawSuperExtra(state.stake);
      if (draw) logDraw(draw, state.round);
      return { ...state, tick: state.tick + 1 };
    }
    case 'SET_PREVIEW':
      return {
        ...state,
        patternPreview: action.pattern
          ? { pattern: action.pattern, cardIndex: action.cardIndex }
          : null,
      };
    case 'FORCE_PATTERN':
      // handled in the callback (side-effects)
      return { ...state, tick: state.tick + 1 };
    case 'TICK':
      return { ...state, tick: state.tick + 1 };
    default:
      return state;
  }
}

export interface DebugEngine {
  state: DebugState;
  setSeed: (seed: number) => void;
  setStake: (stake: number) => void;
  newRound: () => void;
  drawNext: () => void;
  drawAll: () => void;
  drawExtra: () => void;
  drawSuperExtra: () => void;
  setPreview: (pattern: Pattern | null, cardIndex: number) => void;
  forcePattern: (pattern: Pattern, cardIndex: number) => ForceResult | null;
}

export function useDebugEngine(): DebugEngine {
  const [state, dispatch] = useReducer(reducer, {
    round: null,
    seed: Math.floor(Math.random() * 100000),
    stake: 1,
    tick: 0,
    patternPreview: null,
  });

  const forcePattern = useCallback(
    (pattern: Pattern, cardIndex: number): ForceResult | null => {
      if (!state.round) return null;
      const card = state.round.cards[cardIndex];
      if (!card) return null;
      const result = forcePatternOnCard(card, pattern, state.stake);
      dispatch({ type: 'FORCE_PATTERN', pattern, cardIndex });
      return result;
    },
    [state.round, state.stake],
  );

  return {
    state,
    setSeed: (seed: number) => dispatch({ type: 'SET_SEED', seed }),
    setStake: (stake: number) => dispatch({ type: 'SET_STAKE', stake }),
    newRound: () => dispatch({ type: 'NEW_ROUND' }),
    drawNext: () => dispatch({ type: 'DRAW_NEXT' }),
    drawAll: () => dispatch({ type: 'DRAW_ALL' }),
    drawExtra: () => dispatch({ type: 'DRAW_EXTRA' }),
    drawSuperExtra: () => dispatch({ type: 'DRAW_SUPER_EXTRA' }),
    setPreview: (pattern: Pattern | null, cardIndex: number) =>
      dispatch({ type: 'SET_PREVIEW', pattern, cardIndex }),
    forcePattern,
  };
}
