import { DEFAULT_BALLS, EXTRA_BALLS, SUPER_EXTRA_BALLS } from './constants';
import type { Card } from './Card';
import type { Draw } from './Draw';
import { checkForPatterns } from './PatternResolver';
import type { RandomFn } from './types';
import { SlotBonusSession } from './SlotBonusSession';

/** AS3: PatternGroup.EXTRA_MIN_PRIORITY */
const EXTRA_MIN_PRIORITY = 2;
/** AS3: PatternGroup.HALT_FOR_USER_MIN_PRIORITY — pauses auto-discharge */
const HALT_FOR_USER_MIN_PRIORITY = 3;
/** AS3: PatternGroup.SUPER_EXTRA_MIN_PRIORITY */
const SUPER_EXTRA_MIN_PRIORITY = 4;
/** Max ball index for extras (30 + 10) */
const MAX_EXTRA_INDEX = DEFAULT_BALLS + EXTRA_BALLS;
/** Max ball index for super extras (30 + 10 + 5) */
const MAX_SUPER_EXTRA_INDEX = MAX_EXTRA_INDEX + SUPER_EXTRA_BALLS;

export interface BellPosition {
  row: number;
  col: number;
}

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
  private _random: RandomFn;

  /** AS3 latch: once extra is enabled, stays enabled for the round */
  private _extraEverEnabled = false;
  /** AS3 latch: once super extra is enabled, stays enabled for the round */
  private _superExtraEverEnabled = false;

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
    return this._totalPayout;
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
      };
    }

    const position = card.setMatch(ball);
    const additionalPayout = checkForPatterns(card, stake);
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
    return this.ballIndex < DEFAULT_BALLS && this.maxPatternPriority >= HALT_FOR_USER_MIN_PRIORITY;
  }

  /** Evaluate extra/super latch after each draw (AS3: Round.enableExtra) */
  private evaluateExtraLatch(): void {
    for (const card of this.cards) {
      const maxPriority = Math.max(card.maxCompletedPriority, card.maxMissingPriority);
      if (maxPriority >= EXTRA_MIN_PRIORITY) {
        this._extraEverEnabled = true;
      }
      if (maxPriority >= SUPER_EXTRA_MIN_PRIORITY) {
        this._superExtraEverEnabled = true;
      }
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
