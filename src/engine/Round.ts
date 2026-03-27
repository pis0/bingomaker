import { DEFAULT_BALLS, EXTRA_BALLS, SUPER_EXTRA_BALLS, HALT_PRIORITY } from './constants';
import type { Card } from './Card';
import type { Draw } from './Draw';
import { checkForPatterns } from './PatternResolver';
import type { RandomFn } from './types';
import { SlotBonusSession } from './SlotBonusSession';

/** AS3: PatternGroup.EXTRA_MIN_PRIORITY */
const EXTRA_MIN_PRIORITY = 2;
// HALT_PRIORITY imported from constants
/** AS3: PatternGroup.SUPER_EXTRA_MIN_PRIORITY */
const SUPER_EXTRA_MIN_PRIORITY = 4;
/** Max ball index for extras (30 + 10) */
const MAX_EXTRA_INDEX = DEFAULT_BALLS + EXTRA_BALLS;
/** Max ball index for super extras (30 + 10 + 5) */
const MAX_SUPER_EXTRA_INDEX = MAX_EXTRA_INDEX + SUPER_EXTRA_BALLS;

/** AS3: PraiaControlInfo.mentonExtraMultiple — price multiplier for regular extras */
const EXTRA_PRICE_MULTIPLE = 1.03;
/** AS3: PraiaControlInfo.mentonSuperExtraMultiple — price multiplier for super extras */
const SUPER_EXTRA_PRICE_MULTIPLE = 1.27;
/** AS3: PraiaStatics.CASH_TO_COINS — 1 cash = 20 coins */
const CASH_TO_COINS = 20;
/** AS3: total ball pool size used in price denominator */
const TOTAL_BALL_POOL = 60;

export interface BellPosition {
  row: number;
  col: number;
}

/** AS3: mentonFreeExtraProbs — 66% chance of 1 free, 33% chance of 2 */
const FREE_EXTRA_PROBS = [1, 1, 2];

/** Payment type for each extra ball slot */
export type ExtraStakeType = 'free' | 'coins' | 'cash';

export class Round {
  readonly cards: Card[];
  readonly ballSequence: number[];
  readonly draws: Draw[] = [];

  /** Slot bonus session — tracks bell hits + symbol generation */
  readonly slotBonus: SlotBonusSession;

  /** ball number → card that contains it */
  private readonly cardsByBall = new Map<number, Card>();

  private ballIndex = 0;
  private _totalPayout = 0;
  /** Applied multiplier bonus — added once at end of round, never recalculated */
  private _appliedMultiplierBonus = 0;
  private _random: RandomFn;

  /** AS3 latch: once extra is enabled, stays enabled for the round */
  private _extraEverEnabled = false;
  /** AS3 latch: once super extra is enabled, stays enabled for the round */
  private _superExtraEverEnabled = false;

  /**
   * AS3: Round.extraStakes — payment type for each extra ball slot.
   * Allocated when extras are first enabled (enableExtra).
   * Regular extras (0-9): 'coins' or 'free'
   * Super extras (10-14): always 'cash'
   */
  private readonly _extraStakes: ExtraStakeType[] = [];

  /** Cached prices per extra slot (calculated lazily, AS3: calculateExtraStakes) */
  private readonly _extraPrices: number[] = [];

  constructor(cards: Card[], ballSequence: number[], random: RandomFn = Math.random) {
    this.cards = cards;
    this.ballSequence = ballSequence;
    this._random = random;

    // Initialize slot bonus with bell positions
    this.slotBonus = new SlotBonusSession();
    this.slotBonus.shuffle(cards, random);

    // Register all cards' balls
    for (const card of cards) {
      card.reset(this.cardsByBall);
    }
  }

  /** Bell positions derived from slot bonus positions */
  get bellPositions(): BellPosition[] {
    return this.slotBonus.positions.map(p => ({ row: p.row, col: p.col }));
  }

  /** Re-randomize bell positions (AS3: SlotBonusSession.shuffle on Shuffle button) */
  reshuffleBells(): void {
    this.slotBonus.shuffle(this.cards, this._random);
  }

  get totalPayout(): number {
    return this._totalPayout + this._appliedMultiplierBonus;
  }

  /** AS3: Round.winMultiplierPayout — bonus from x2 slot prize: straightPayout * (multiplier - 1) */
  get winMultiplierPayout(): number {
    return this._totalPayout * (this.slotBonus.winMultiplier - 1);
  }

  /**
   * Apply x2 multiplier bonus to payout (call once at end of round).
   * Adds winMultiplierPayout as a fixed bonus on top of straightPayout.
   * Idempotent — calling again has no effect.
   */
  applyMultiplierBonus(): void {
    if (this._appliedMultiplierBonus > 0) return; // already applied
    this._appliedMultiplierBonus = this.winMultiplierPayout;
  }

  get currentBallIndex(): number {
    return this.ballIndex;
  }

  /** Process the default 30 balls */
  process(stake: number): void {
    const count = Math.min(DEFAULT_BALLS, this.ballSequence.length);
    for (let i = 0; i < count; i++) {
      this.drawNext(stake);
    }
  }

  /** Draw the next ball in sequence */
  drawNext(stake: number): Draw | null {
    if (this.ballIndex >= this.ballSequence.length) return null;

    const ball = this.ballSequence[this.ballIndex];
    const draw = this.drawBall(this.ballIndex, ball, stake);
    this.draws.push(draw);
    this.ballIndex++;
    return draw;
  }

  /** Draw a specific ball */
  private drawBall(index: number, ball: number, stake: number): Draw {
    // Check for bell hit
    const bellHit = this.slotBonus.process(ball, this._random);

    const card = this.cardsByBall.get(ball);

    if (!card) {
      return {
        index,
        ball,
        affectedCard: -1,
        position: null,
        cardMatches: null,
        additionalPayout: 0,
        bellHit,
        newPatterns: [],
      };
    }

    const position = card.setMatch(ball);
    const { additionalPayout, newPatterns } = checkForPatterns(card, stake);
    const cardMatches = card.produceCardMatches();
    card.clearLastMatch();

    this._totalPayout += additionalPayout;

    // AS3: enableExtra — evaluate latch after pattern resolution
    this.evaluateExtraLatch();

    return {
      index,
      ball,
      affectedCard: card.index,
      position,
      cardMatches,
      additionalPayout,
      bellHit,
      newPatterns,
    };
  }

  /**
   * AS3: Round.evaluateExtra — extra enabled when any card has a completed
   * or missing-one pattern with priority >= 2. Latched once enabled.
   * Available only while ballIndex < MAX_EXTRA_INDEX (40).
   */
  get extraAvailable(): boolean {
    if (this.ballIndex < DEFAULT_BALLS) return false;
    if (this.ballIndex >= MAX_EXTRA_INDEX) return false;
    return this._extraEverEnabled;
  }

  /**
   * AS3: Round.evaluateSuperExtra — super extra enabled when any card has a
   * completed or missing-one pattern with priority >= 4. Latched once enabled.
   * Available only while ballIndex < MAX_SUPER_EXTRA_INDEX (45).
   */
  get superExtraAvailable(): boolean {
    if (this.ballIndex < MAX_EXTRA_INDEX) return false;
    if (this.ballIndex >= MAX_SUPER_EXTRA_INDEX) return false;
    return this._superExtraEverEnabled;
  }

  /**
   * AS3: maxMissingPriority across all cards — drives ball trigger interval
   * and halt-for-user. Considers both completed and missing-one patterns.
   */
  get maxPatternPriority(): number {
    let max = 0;
    for (const card of this.cards) {
      if (card.maxCompletedPriority > max) max = card.maxCompletedPriority;
      if (card.maxMissingPriority > max) max = card.maxMissingPriority;
    }
    return max;
  }

  /**
   * AS3: haltedForUser — should auto-discharge pause?
   * True when maxPatternPriority >= 3 during the initial 30 balls.
   */
  get shouldHalt(): boolean {
    return this.ballIndex < DEFAULT_BALLS && this.maxPatternPriority >= HALT_PRIORITY;
  }

  /**
   * Extra stakes array — 'free'/'coins'/'cash' for each extra slot.
   * Slots 0-9 = regular extras, 10-14 = super extras.
   * Only populated once extras are enabled.
   */
  get extraStakes(): readonly ExtraStakeType[] {
    return this._extraStakes;
  }

  /** Get the stake type for a specific extra ball (by draw index, 30-based) */
  extraStakeAt(drawIndex: number): ExtraStakeType {
    if (drawIndex < DEFAULT_BALLS) return 'coins'; // not an extra
    const slot = drawIndex - DEFAULT_BALLS;
    return this._extraStakes[slot] ?? 'coins';
  }

  /**
   * AS3: calculateExtraStakes — compute price for an extra ball slot.
   * Lazy: calculates once per slot, caches result.
   *
   * Formula: sum(card.calculateXp()) / remainingBalls * multiplier
   * Regular extras → coins (ceil), Super extras → cash (/CASH_TO_COINS)
   */
  extraPriceAt(drawIndex: number, stake: number): number {
    if (drawIndex < DEFAULT_BALLS) return 0;
    const slot = drawIndex - DEFAULT_BALLS;

    // Free slot → price = 0
    if (this._extraStakes[slot] === 'free') return 0;

    // Return cached if already calculated
    if (this._extraPrices[slot] != null) return this._extraPrices[slot];

    // AS3: missingOnePayoutInCoins = cards.sum(card.calculateXp())
    let xp = 0;
    for (const card of this.cards) {
      xp += card.calculateXp();
    }

    // Normalize by remaining balls
    const remaining = TOTAL_BALL_POOL - this.draws.length - 1;
    if (remaining > 0) xp /= remaining;

    // Bonus multipliers (AS3: slotBonus adjustments)
    if (this.slotBonus.winMultiplier > 1) xp *= 1.90;

    // Floor
    if (xp <= 0) xp = 1;

    let price: number;
    const isSuper = slot >= EXTRA_BALLS;
    if (isSuper) {
      // Super extra: cash units
      xp *= 1 + (SUPER_EXTRA_PRICE_MULTIPLE - 1) * (stake / 100); // 100 = maxStake provisório
      price = Math.max(1, Math.round(xp / CASH_TO_COINS));
    } else {
      // Regular extra: coins
      price = Math.ceil(xp * EXTRA_PRICE_MULTIPLE);
    }

    this._extraPrices[slot] = price;
    return price;
  }

  /** Evaluate extra/super latch after each draw (AS3: Round.enableExtra) */
  evaluateExtraLatch(): void {
    const wasPreviouslyEnabled = this._extraEverEnabled;
    for (const card of this.cards) {
      const maxPriority = Math.max(card.maxCompletedPriority, card.maxMissingPriority);
      if (maxPriority >= EXTRA_MIN_PRIORITY) {
        this._extraEverEnabled = true;
      }
      if (maxPriority >= SUPER_EXTRA_MIN_PRIORITY) {
        this._superExtraEverEnabled = true;
      }
    }
    // First time extras enabled → allocate free slots
    if (!wasPreviouslyEnabled && this._extraEverEnabled) {
      this.allocateExtraStakes();
    }
  }

  /**
   * AS3: Round.enableExtra — allocate free/paid slots for extra balls.
   * Picks 1-2 free slots (random, never consecutive).
   * Regular extras = 'coins', super extras = 'cash'.
   */
  private allocateExtraStakes(): void {
    // Initialize all regular extras as 'coins', super extras as 'cash'
    for (let i = 0; i < EXTRA_BALLS; i++) {
      this._extraStakes[i] = 'coins';
    }
    for (let i = 0; i < SUPER_EXTRA_BALLS; i++) {
      this._extraStakes[EXTRA_BALLS + i] = 'cash';
    }

    // Pick how many free extras (AS3: mentonFreeExtraProbs)
    const freeCount = FREE_EXTRA_PROBS[Math.floor(this._random() * FREE_EXTRA_PROBS.length)];

    // Build pool of eligible indices (1 to EXTRA_BALLS-1, skip 0)
    const pool: number[] = [];
    for (let i = 1; i < EXTRA_BALLS; i++) pool.push(i);

    // Shuffle pool
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(this._random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    // Allocate free slots, removing adjacent to prevent consecutive frees
    const used = new Set<number>();
    let allocated = 0;
    for (const idx of pool) {
      if (allocated >= freeCount) break;
      if (used.has(idx)) continue;
      this._extraStakes[idx] = 'free';
      // Block adjacent
      used.add(idx);
      used.add(idx - 1);
      used.add(idx + 1);
      allocated++;
    }
  }

  /** Replace the remaining (undrawn) portion of the ball sequence */
  reorderRemaining(newRemaining: number[]): void {
    this.ballSequence.splice(this.ballIndex, this.ballSequence.length - this.ballIndex, ...newRemaining);
  }

  /** Draw an extra ball */
  drawExtra(stake: number): Draw | null {
    return this.drawNext(stake);
  }

  /** Draw a super extra ball */
  drawSuperExtra(stake: number): Draw | null {
    return this.drawNext(stake);
  }
}
