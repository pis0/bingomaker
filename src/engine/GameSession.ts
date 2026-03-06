import { Card } from './Card';
import { distributeCards } from './CardDistributor';
import type { Draw } from './Draw';
import { Round } from './Round';
import type { RandomFn } from './types';

export interface RoundResult {
  round: Round;
  draws: Draw[];
  totalPayout: number;
  extraAvailable: boolean;
  superExtraAvailable: boolean;
}

export interface GameSessionConfig {
  stake: number;
  random?: RandomFn;
}

export class GameSession {
  private readonly random: RandomFn;

  constructor(random: RandomFn = Math.random) {
    this.random = random;
  }

  createRound(config: GameSessionConfig): RoundResult {
    const { stake, random = this.random } = config;
    const { cardNumbers, ballSequence } = distributeCards(random);

    const cards = cardNumbers.map((nums, i) => {
      const card = new Card(i);
      card.setNumbers(nums);
      return card;
    });

    const round = new Round(cards, ballSequence, random);
    round.process(stake);

    return {
      round,
      draws: round.draws,
      totalPayout: round.totalPayout,
      extraAvailable: round.extraAvailable,
      superExtraAvailable: round.superExtraAvailable,
    };
  }

  drawExtra(round: Round, stake: number): Draw | null {
    return round.drawExtra(stake);
  }

  drawSuperExtra(round: Round, stake: number): Draw | null {
    return round.drawSuperExtra(stake);
  }
}
