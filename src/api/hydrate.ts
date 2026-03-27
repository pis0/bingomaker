/**
 * Hydration layer — converts server JSON responses into engine-compatible
 * objects that components can read.
 *
 * The server returns plain JSON (ClientCard, ClientDraw, ClientSlotBonus).
 * Components expect engine types (Round, Card, Draw) with Pattern instances,
 * Set<Pattern>, grids, getters, etc. These functions bridge that gap.
 *
 * Strategy:
 * - Card: create real Card instances (same class components expect), then
 *   populate mutable fields from server data. This gives us all methods
 *   (hasBall, getPosition, etc.) and correct grid types for free.
 * - Draw: plain object satisfying the Draw interface.
 * - Round: ServerRound class that duck-types to Round — same readable
 *   getters/properties but no RNG or ball-drawing logic.
 * - SlotBonusSession: real instance with positions/state restored.
 */
import { Card } from '../engine/Card'
import type { Draw } from '../engine/Draw'
import { CardMatches } from '../engine/CardMatches'
import { SORTED_PATTERNS, type Pattern } from '../engine/Pattern'
import { checkForPatterns } from '../engine/PatternResolver'
import { ROWS, COLS, DEFAULT_BALLS } from '../engine/constants'
import { type ExtraStakeType, type BellPosition } from '../engine/Round'
import { SlotBonusSession } from '../engine/SlotBonusSession'
import type { MatchType } from '../engine/types'
import type {
  ClientCard,
  ClientDraw,
  ClientSlotBonus,
  CreateRoundResponse,
  DrawResponse,
  GetRoundResponse,
} from '../../server/src/types/api'

// ── Pattern name → Pattern instance lookup ──────────────────────
const PATTERN_MAP = new Map<string, Pattern>()
for (const p of SORTED_PATTERNS) {
  PATTERN_MAP.set(p.name, p)
}

function resolvePatterns(names: string[]): Pattern[] {
  const result: Pattern[] = []
  for (const name of names) {
    const p = PATTERN_MAP.get(name)
    if (p) result.push(p)
  }
  return result
}

// ── Hydrate a ClientDraw → engine Draw ──────────────────────────

export function hydrateDraw(cd: ClientDraw): Draw {
  // Build CardMatches from the matchTypes grid if present
  let cardMatches: CardMatches | null = null
  if (cd.matchTypes) {
    // CardMatches only needs .matchTypes — components read it as Grid<MatchType>
    const mt: MatchType[][] = []
    for (let row = 0; row < ROWS; row++) {
      mt[row] = []
      for (let col = 0; col < COLS; col++) {
        mt[row][col] = (cd.matchTypes[row]?.[col] ?? 0) as MatchType
      }
    }
    cardMatches = { matchTypes: mt } as CardMatches
  }

  return {
    index: cd.index,
    ball: cd.ball,
    affectedCard: cd.affectedCard,
    position: cd.position,
    cardMatches,
    additionalPayout: cd.additionalPayout,
    bellHit: cd.bellHit,
    newPatterns: resolvePatterns(cd.newPatterns),
  }
}

// ── Hydrate ClientCard[] → engine Card[] ────────────────────────

/**
 * Populate a Card instance's mutable state from server data.
 *
 * Creates a real Card so all methods (hasBall, getPosition, etc.) work.
 * Rebuilds patternPriority from completedPatterns masks — the server
 * doesn't send it, but SlotCell reads card.patternPriority[row][col].
 */
function hydrateCardInstance(cc: ClientCard): Card {
  const card = new Card(cc.index)

  // Flatten 2D numbers grid to 1D column-major (Card.setNumbers expects
  // row = i % 3, col = floor(i / 3), matching AS3 behavior)
  const nums: number[] = []
  for (let col = 0; col < COLS; col++) {
    for (let row = 0; row < ROWS; row++) {
      nums.push(cc.numbers[row][col])
    }
  }
  card.setNumbers(nums)

  // Apply match state + inPattern from server
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      card.matches[row][col] = cc.matches[row][col]
      card.inPattern[row][col] = cc.inPattern[row][col]
    }
  }

  // Apply completed patterns + rebuild patternPriority
  for (const name of cc.completedPatterns) {
    const p = PATTERN_MAP.get(name)
    if (p) {
      card.completedPatterns.add(p)
      // Rebuild patternPriority: highest priority per cell
      const priority = p.group.priority
      for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
          if (p.getMaskIndex(row, col)) {
            if (priority > card.patternPriority[row][col]) {
              card.patternPriority[row][col] = priority
            }
          }
        }
      }
    }
  }

  card.payout = cc.payout
  card.maxMissingPriority = cc.maxMissingPriority
  card.maxCompletedPriority = cc.maxCompletedPriority

  return card
}

export function hydrateCards(clientCards: ClientCard[]): Card[] {
  return clientCards.map(hydrateCardInstance)
}

// ── Hydrate SlotBonus ───────────────────────────────────────────

export function hydrateSlotBonus(
  cs: ClientSlotBonus,
  cards: Card[],
): SlotBonusSession {
  const session = new SlotBonusSession()

  // Reconstruct positions with actual ball numbers from hydrated cards
  // Positions are set but start unhit — hits accumulate via applyNextDraw
  session.positions = cs.positions.map(p => ({
    cardIndex: p.cardIndex,
    row: p.row,
    col: p.col,
    ball: cards[p.cardIndex]?.numbers[p.row]?.[p.col] ?? 0,
    hit: false, // starts unhit — revealed as draws apply bell hits
  }))
  session.hits = 0 // starts at 0 — incremented by applyNextDraw
  session.triggered = false
  // Store server values for reveal after 4th hit
  ;(session as SlotBonusSession & { _serverSymbols: typeof cs.symbols; _serverPrize: typeof cs.prize })._serverSymbols = cs.symbols
  ;(session as SlotBonusSession & { _serverSymbols: typeof cs.symbols; _serverPrize: typeof cs.prize })._serverPrize = cs.prize
  session.symbols = null
  session.prize = null

  return session
}

// ── ServerRound — duck-typed to match what components expect from Round ──

/**
 * Lightweight Round-compatible object hydrated from server data.
 *
 * Components access:
 * - round.cards, round.draws, round.ballSequence
 * - round.totalPayout, round.currentBallIndex
 * - round.extraAvailable, round.superExtraAvailable
 * - round.shouldHalt, round.maxPatternPriority
 * - round.bellPositions
 * - round.slotBonus (.hits, .triggered, .symbols, .prize, .positions, .winMultiplier)
 * - round.extraStakes, round.extraStakeAt(idx), round.extraPriceAt(idx, stake)
 *
 * This is NOT a full Round instance — no RNG, no drawNext logic. The caller
 * manages draw progression via API calls and applyDrawResponse().
 */
export class ServerRound {
  readonly cards: Card[]
  readonly draws: Draw[] = []
  readonly ballSequence: number[] = []
  readonly slotBonus: SlotBonusSession

  private _totalPayout: number
  private _extraAvailable: boolean
  private _superExtraAvailable: boolean
  private _bellPositions: BellPosition[]
  private _extraStakes: Array<{ type: ExtraStakeType; price: number }>
  private _currentBallIndex = 0
  /** Extra prices from DrawResponse (current + next), indexed by slot */
  private _livePrices: Map<number, number> = new Map()
  /** Server's final availability — applied after initial 30 draws are consumed */
  _serverExtraAvailable = false
  _serverSuperExtraAvailable = false
  /** Fruit bomb positions from server (deterministic, RNG-based) */
  serverBombPositions: Array<{ cardIndex: number; row: number; col: number }> | null = null
  /** x2 slot bonus payout — server-authoritative, updated on each draw response */
  private _winMultiplierPayout = 0
  /** Applied multiplier bonus — added once at end of round */
  private _appliedMultiplierBonus = 0

  constructor(
    cards: Card[],
    draws: Draw[],
    totalPayout: number,
    extraAvailable: boolean,
    superExtraAvailable: boolean,
    bellPositions: BellPosition[],
    extraStakes: Array<{ type: ExtraStakeType; price: number }>,
    slotBonus: SlotBonusSession,
  ) {
    this.cards = cards
    this.draws = draws
    this.ballSequence = draws.map(d => d.ball)
    this._totalPayout = totalPayout
    this._extraAvailable = extraAvailable
    this._superExtraAvailable = superExtraAvailable
    this._bellPositions = bellPositions
    this._extraStakes = extraStakes
    this.slotBonus = slotBonus
    this._currentBallIndex = 0
  }

  get totalPayout(): number { return this._totalPayout + this._appliedMultiplierBonus }
  set totalPayout(v: number) { this._totalPayout = v }

  /** AS3: Round.winMultiplierPayout — x2 bonus from server (not calculated locally) */
  get winMultiplierPayout(): number { return this._winMultiplierPayout }
  set winMultiplierPayout(v: number) { this._winMultiplierPayout = v }

  /** Apply x2 multiplier bonus (call once at end of round). Idempotent. */
  applyMultiplierBonus(): void {
    if (this._appliedMultiplierBonus > 0) return
    this._appliedMultiplierBonus = this._winMultiplierPayout
  }

  get currentBallIndex(): number { return this._currentBallIndex }
  set currentBallIndex(v: number) { this._currentBallIndex = v }

  get extraAvailable(): boolean { return this._extraAvailable }
  set extraAvailable(v: boolean) { this._extraAvailable = v }

  get superExtraAvailable(): boolean { return this._superExtraAvailable }
  set superExtraAvailable(v: boolean) { this._superExtraAvailable = v }

  get bellPositions(): BellPosition[] { return this._bellPositions }

  /** AS3: shouldHalt — halt during initial 30 when high-priority pattern detected */
  get shouldHalt(): boolean {
    return this._currentBallIndex < DEFAULT_BALLS && this.maxPatternPriority >= 3
  }

  /** Max priority across all cards (completed + missing-one) */
  get maxPatternPriority(): number {
    let max = 0
    for (const card of this.cards) {
      if (card.maxCompletedPriority > max) max = card.maxCompletedPriority
      if (card.maxMissingPriority > max) max = card.maxMissingPriority
    }
    return max
  }

  /** Extra stake type at a given draw index */
  extraStakeAt(drawIndex: number): ExtraStakeType {
    if (drawIndex < DEFAULT_BALLS) return 'coins'
    const slot = drawIndex - DEFAULT_BALLS
    return this._extraStakes[slot]?.type ?? 'coins'
  }

  /**
   * Extra price at a given draw index (server pre-computed).
   *
   * First checks live prices from DrawResponse (more current),
   * then falls back to initial extraStakes from CreateRoundResponse.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  extraPriceAt(drawIndex: number, _stake: number): number {
    if (drawIndex < DEFAULT_BALLS) return 0
    const slot = drawIndex - DEFAULT_BALLS
    // Live price from DrawResponse takes precedence
    const live = this._livePrices.get(slot)
    if (live !== undefined) return live
    return this._extraStakes[slot]?.price ?? 0
  }

  /** Set a live extra price (from DrawResponse.extraPrice / nextExtraPrice) */
  setLivePrice(slot: number, price: number): void {
    this._livePrices.set(slot, price)
  }

  get extraStakes(): readonly ExtraStakeType[] {
    return this._extraStakes.map(s => s.type)
  }

  /**
   * Apply the next pre-computed draw to card state (incremental).
   * Called by processNextBall when a ball visually arrives.
   * Marks the cell, adds completed patterns, updates payout.
   * Returns the Draw or null if no more draws.
   */
  /** Stake used for payout calculations — set from createRound */
  private _stake = 1

  set stake(v: number) { this._stake = v }

  applyNextDraw(): Draw | null {
    const draw = this.draws[this._currentBallIndex]
    if (!draw) return null

    this._currentBallIndex++

    // Apply match to card + full pattern check (expectations, payout, priorities)
    if (draw.affectedCard >= 0 && draw.position) {
      const card = this.cards[draw.affectedCard]
      if (card) {
        card.matches[draw.position.row][draw.position.col] = true

        // checkForPatterns handles everything: completedPatterns, inPattern,
        // patternPriority, expectations, maxMissingPriority, and payout
        checkForPatterns(card, this._stake)
      }
    }

    // Accumulate round total from card payouts (engine-computed, same as server)
    let cardPayoutSum = 0
    for (const c of this.cards) cardPayoutSum += c.payout
    this._totalPayout = cardPayoutSum

    // Update bell hit + mark position as hit
    if (draw.bellHit && draw.affectedCard >= 0) {
      const pos = this.slotBonus.positions.find(
        p => p.cardIndex === draw.affectedCard && !p.hit
      )
      if (pos) pos.hit = true
      this.slotBonus.hits++

      // Reveal slot symbols/prize when 4th bell hit (HITS_REQUIRED)
      if (this.slotBonus.hits >= 4 && !this.slotBonus.triggered) {
        this.slotBonus.triggered = true
        const sb = this.slotBonus as SlotBonusSession & { _serverSymbols?: unknown; _serverPrize?: unknown }
        this.slotBonus.symbols = (sb._serverSymbols as typeof this.slotBonus.symbols) ?? null
        this.slotBonus.prize = (sb._serverPrize as typeof this.slotBonus.prize) ?? null
      }
    }

    // Reveal extra after initial 30-ball discharge completes
    if (this._currentBallIndex >= DEFAULT_BALLS) {
      this._extraAvailable = this._serverExtraAvailable
    }
    // Reveal super only when ALL fetched draws have been consumed
    // (prevents showing SUPER while last extra is still in peel animation)
    if (this._currentBallIndex >= this.draws.length) {
      this._superExtraAvailable = this._serverSuperExtraAvailable
    }

    return draw
  }

  /** Re-evaluate extra availability from card state (after fruit bomb marks cells) */
  evaluateExtras(): void {
    for (const card of this.cards) {
      const maxPri = Math.max(card.maxCompletedPriority, card.maxMissingPriority)
      if (maxPri >= 2) this._extraAvailable = true      // EXTRA_MIN_PRIORITY
      if (maxPri >= 4) this._superExtraAvailable = true  // SUPER_EXTRA_MIN_PRIORITY
    }
  }

  // Dummy methods — not used in server mode (API calls replace engine logic)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  drawNext(_stake: number): Draw | null { return null }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  drawExtra(_stake: number): Draw | null { return null }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  drawSuperExtra(_stake: number): Draw | null { return null }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  process(_stake: number): void { /* noop */ }
  reshuffleBells(): void { /* noop */ }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  reorderRemaining(_newRemaining: number[]): void { /* noop */ }
}

// ── Top-level hydration from API responses ──────────────────────

/**
 * Hydrate a CreateRoundResponse or GetRoundResponse into a ServerRound.
 *
 * Cards start CLEAN (numbers only, no matches). The pre-computed draws
 * are stored but NOT applied — the client applies them one-by-one via
 * applyNextDraw() as balls animate and arrive. This preserves the
 * incremental visual flow (slot marks only when ball settles).
 */
export function hydrateRound(
  res: CreateRoundResponse | GetRoundResponse,
  stake = 1,
): ServerRound {
  // Create clean cards (numbers only, no matches)
  const cards = res.cards.map(cc => {
    const card = new Card(cc.index)
    const nums: number[] = []
    for (let col = 0; col < COLS; col++) {
      for (let row = 0; row < ROWS; row++) {
        nums.push(cc.numbers[row][col])
      }
    }
    card.setNumbers(nums)
    return card
  })

  // Pre-hydrate all draws (stored, applied incrementally)
  const draws = res.draws.map(hydrateDraw)

  // Slot bonus with clean cards (bell positions need card numbers)
  const slotBonus = hydrateSlotBonus(res.slotBonus, cards)

  const round = new ServerRound(
    cards,
    draws,
    0, // payout starts at 0 — accumulates as draws are applied
    false, // extraAvailable starts false — revealed after initial draws applied
    false, // superExtraAvailable starts false
    res.bellPositions,
    res.extraStakes,
    slotBonus,
  )
  round.stake = stake
  // Store server's x2 multiplier payout (server-authoritative)
  round.winMultiplierPayout = res.winMultiplierPayout ?? 0
  // Store server's final availability for use after all initial draws are consumed
  round._serverExtraAvailable = res.extraAvailable
  round._serverSuperExtraAvailable = res.superExtraAvailable
  // Store bomb positions if server computed them (slot prize = FRUIT)
  if ('bombPositions' in res && res.bombPositions) {
    round.serverBombPositions = res.bombPositions
  }
  return round
}

/**
 * Apply a DrawResponse to an existing ServerRound — adds the new draw,
 * updates card state in place, and refreshes availability flags.
 *
 * Returns the hydrated Draw for animation processing.
 */
export function applyDrawResponse(round: ServerRound, res: DrawResponse): Draw {
  const draw = hydrateDraw(res.draw)
  round.draws.push(draw)
  round.ballSequence.push(draw.ball)

  // Card state NOT synced here — deferred to applyNextDraw() when ball animates.
  // This ensures ChipFly/PatternMovie trigger at the right visual moment.

  // Update x2 multiplier payout from server (grows as extras add payout)
  round.winMultiplierPayout = res.winMultiplierPayout ?? 0

  // Defer availability until ball arrives (applyNextDraw)
  round._serverExtraAvailable = res.extraAvailable
  round._serverSuperExtraAvailable = res.superExtraAvailable

  // Update live extra prices from server (UI can show price before ball animates)
  // draws.length already includes the just-pushed draw, so subtract 1 for its slot
  const drawnSlot = round.draws.length - 1 - DEFAULT_BALLS
  if (drawnSlot >= 0) {
    round.setLivePrice(drawnSlot, res.extraPrice)
  }
  if (drawnSlot + 1 >= 0) {
    round.setLivePrice(drawnSlot + 1, res.nextExtraPrice)
  }

  return draw
}
