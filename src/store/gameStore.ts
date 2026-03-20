/**
 * Zustand game store — centralized state for Menton game.
 *
 * Replaces prop drilling through Menton → children.
 * Each component subscribes only to the slices it needs,
 * preventing cascading re-renders.
 *
 * Animation flags (chipFly, splash, bellRing, etc.) are the
 * biggest win — they change frequently but each only matters
 * to 1-2 components.
 */
import { create } from 'zustand'
import type { Round } from '../engine/Round'
import type { Draw } from '../engine/Draw'
import type { SlotSymbol } from '../engine/SlotBonusSession'
import type { ChipPosition } from '../components/menton/ChipFlyAnimation'
import type { BombPosition } from '../engine/FruitBombBonusSession'
import type { ButtonPhase } from '../components/menton/ButtonPanel'

export interface GameState {
  // ── Engine state (from debug engine / server) ───────────────
  round: Round | null
  stakeIndex: number
  stake: number
  targetBallCount: number
  isCollecting: boolean
  lastPayout: number
  peelAdvanceTick: number

  // ── Animation flags ─────────────────────────────────────────
  bellRingActive: boolean
  releasedSpinSymbols: SlotSymbol[] | null
  slotBlinking: boolean
  multiplierActive: boolean
  fruitBombActive: boolean
  bombPositions: BombPosition[]
  chipFlyPositions: ChipPosition[] | null
  chipFlyDelay: number
  splashActive: boolean
  superFlying: boolean
  cardShake: { x: number; y: number }

  // ── Visual state ────────────────────────────────────────────
  idlePatternIndex: number

  // ── Derived (computed on set) ───────────────────────────────
  bonusActive: boolean
  drawing: boolean

  // ── ButtonPanel ─────────────────────────────────────────────
  buttonPhase: ButtonPhase
  buttonEnabled: boolean
  showEnd: boolean

  // ── Tick (force re-render for mutable state changes) ────────
  tick: number
}

// Compute bonusActive from individual flags
function computeBonusActive(s: Partial<GameState> & Pick<GameState, 'bellRingActive' | 'releasedSpinSymbols' | 'slotBlinking' | 'multiplierActive' | 'fruitBombActive' | 'chipFlyPositions' | 'splashActive'>): boolean {
  return s.bellRingActive
    || (s.releasedSpinSymbols !== null && !s.slotBlinking)
    || s.multiplierActive
    || s.fruitBombActive
    || !!s.chipFlyPositions
    || s.splashActive
}

export const useGameStore = create<GameState>(() => ({
  // Engine
  round: null,
  stakeIndex: 0,
  stake: 1,
  targetBallCount: 0,
  isCollecting: false,
  lastPayout: 0,
  peelAdvanceTick: 0,

  // Animation flags
  bellRingActive: false,
  releasedSpinSymbols: null,
  slotBlinking: false,
  multiplierActive: false,
  fruitBombActive: false,
  bombPositions: [],
  chipFlyPositions: null,
  chipFlyDelay: 300,
  splashActive: false,
  superFlying: false,
  cardShake: { x: 0, y: 0 },

  // Visual
  idlePatternIndex: 0,

  // Derived
  bonusActive: false,
  drawing: false,

  // ButtonPanel
  buttonPhase: 'play',
  buttonEnabled: true,
  showEnd: false,

  // Tick
  tick: 0,
}))

// ── Actions (standalone functions, not in store) ──────────────
// Zustand best practice: actions as module functions calling setState

export function setRound(round: Round | null) {
  useGameStore.setState({ round })
}

export function setAnimFlag<K extends keyof GameState>(key: K, value: GameState[K]) {
  useGameStore.setState((s) => {
    const next = { ...s, [key]: value }
    return { [key]: value, bonusActive: computeBonusActive(next) }
  })
}

export function setChipFly(positions: ChipPosition[] | null, delay?: number) {
  useGameStore.setState((s) => {
    const next = { ...s, chipFlyPositions: positions }
    return {
      chipFlyPositions: positions,
      ...(delay !== undefined ? { chipFlyDelay: delay } : {}),
      bonusActive: computeBonusActive(next),
    }
  })
}

export function bumpTick() {
  useGameStore.setState((s) => ({ tick: s.tick + 1 }))
}

export function resetAnimations() {
  useGameStore.setState({
    bellRingActive: false,
    releasedSpinSymbols: null,
    slotBlinking: false,
    multiplierActive: false,
    fruitBombActive: false,
    bombPositions: [],
    chipFlyPositions: null,
    splashActive: false,
    superFlying: false,
    cardShake: { x: 0, y: 0 },
    bonusActive: false,
  })
}
