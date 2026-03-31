import type { MatchType } from '../../../src/engine/types'
import type { ExtraStakeType } from '../../../src/engine/Round'
import type { SlotSymbol } from '../../../src/engine/SlotBonusSession'

// ── Requests ────────────────────────────────────────────────

export interface CreateRoundRequest {
  stake: number
}

// DrawRequest: roundId comes from path param, no body needed
export type DrawRequest = Record<string, never>

// EndRoundRequest: roundId comes from path param, no body needed
export type EndRoundRequest = Record<string, never>

// ── Client-safe types (no secrets, no engine internals) ─────

export interface ClientDraw {
  index: number
  ball: number
  affectedCard: number
  position: { row: number; col: number } | null
  additionalPayout: number
  bellHit: boolean
  newPatterns: string[]
  matchTypes: MatchType[][] | null
}

export interface ClientCard {
  index: number
  numbers: number[][]
  matches: boolean[][]
  inPattern: boolean[][]
  patternPriority: number[][]
  completedPatterns: string[]
  payout: number
  maxMissingPriority: number
  maxCompletedPriority: number
  missingExpectations?: Array<{
    row: number
    col: number
    patternNames: string[]
    maxPriority: number
  }>
}

export interface ClientSlotBonus {
  hits: number
  triggered: boolean
  symbols: SlotSymbol[] | null
  prize: SlotSymbol | null
  positions: Array<{
    cardIndex: number
    row: number
    col: number
    hit: boolean
  }>
}

// ── Responses ───────────────────────────────────────────────

export interface CreateRoundResponse {
  roundId: string
  seed: number
  cards: ClientCard[]
  draws: ClientDraw[]
  totalPayout: number
  /** AS3: Round.winMultiplierPayout — bonus from x2 slot prize (server-authoritative) */
  winMultiplierPayout: number
  extraAvailable: boolean
  superExtraAvailable: boolean
  extraStakes: Array<{ type: ExtraStakeType; price: number }>
  bellPositions: Array<{ row: number; col: number }>
  slotBonus: ClientSlotBonus
  /** Fruit bomb positions — only present when slot prize = FRUIT */
  bombPositions?: Array<{ cardIndex: number; row: number; col: number }>
}

export interface DrawResponse {
  draw: ClientDraw
  cards: ClientCard[]
  totalPayout: number
  /** AS3: Round.winMultiplierPayout — bonus from x2 slot prize (server-authoritative) */
  winMultiplierPayout: number
  extraAvailable: boolean
  superExtraAvailable: boolean
  extraPrice: number
  nextExtraPrice: number
  slotBonus: ClientSlotBonus
}

export interface GetRoundResponse {
  roundId: string
  cards: ClientCard[]
  draws: ClientDraw[]
  totalPayout: number
  /** AS3: Round.winMultiplierPayout — bonus from x2 slot prize (server-authoritative) */
  winMultiplierPayout: number
  extraAvailable: boolean
  superExtraAvailable: boolean
  extraStakes: Array<{ type: ExtraStakeType; price: number }>
  bellPositions: Array<{ row: number; col: number }>
  slotBonus: ClientSlotBonus
}

export interface EndRoundResponse {
  totalPayout: number
  winMultiplierPayout: number
  status: 'completed'
}
