import type { CardMatches } from './CardMatches';

export interface Draw {
  /** Ball index in the sequence (0-based) */
  index: number;
  /** Ball number (1-90) */
  ball: number;
  /** Index of the card this ball belongs to, or -1 if none */
  affectedCard: number;
  /** Position on the card, or null */
  position: { row: number; col: number } | null;
  /** Card matches snapshot after this draw */
  cardMatches: CardMatches | null;
  /** Additional payout from patterns completed by this draw */
  additionalPayout: number;
  /** Whether this draw hit a bell position */
  bellHit: boolean;
}
