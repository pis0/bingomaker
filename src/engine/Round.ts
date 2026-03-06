import { DEFAULT_BALLS } from './constants';
import type { Card } from './Card';
import type { Draw } from './Draw';
import { checkForPatterns } from './PatternResolver';

export class Round {
  readonly cards: Card[];
  readonly ballSequence: number[];
  readonly draws: Draw[] = [];

  /** ball number → card that contains it */
  private readonly cardsByBall = new Map<number, Card>();

  private ballIndex = 0;
  private _totalPayout = 0;

  constructor(cards: Card[], ballSequence: number[]) {
    this.cards = cards;
    this.ballSequence = ballSequence;

    // Register all cards' balls
    for (const card of cards) {
      card.reset(this.cardsByBall);
    }
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
    const card = this.cardsByBall.get(ball);

    if (!card) {
      // Ball not on any card (shouldn't happen with proper distribution)
      return {
        index,
        ball,
        affectedCard: -1,
        position: null,
        cardMatches: null,
        additionalPayout: 0,
      };
    }

    const position = card.setMatch(ball);
    const additionalPayout = checkForPatterns(card, stake);
    const cardMatches = card.produceCardMatches();
    card.clearLastMatch();

    this._totalPayout += additionalPayout;

    return {
      index,
      ball,
      affectedCard: card.index,
      position,
      cardMatches,
      additionalPayout,
    };
  }

  /** Check if extra balls are available (any card missing-one with priority >= 2) */
  get extraAvailable(): boolean {
    return this.cards.some((card) => card.maxMissingPriority >= 2);
  }

  /** Check if super extra balls are available (priority >= 4) */
  get superExtraAvailable(): boolean {
    return this.cards.some((card) => card.maxMissingPriority >= 4);
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
