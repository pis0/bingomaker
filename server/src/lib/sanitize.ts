import { ROWS, COLS } from '../../../src/engine/constants'
import type { Card } from '../../../src/engine/Card'
import type { Draw } from '../../../src/engine/Draw'
import type { Round } from '../../../src/engine/Round'
import type {
  ClientCard,
  ClientDraw,
  ClientSlotBonus,
  CreateRoundResponse,
  DrawResponse,
  GetRoundResponse,
} from '../types/api'

// ── Draw ────────────────────────────────────────────────────

export function sanitizeDraw(draw: Draw): ClientDraw {
  return {
    index: draw.index,
    ball: draw.ball,
    affectedCard: draw.affectedCard,
    position: draw.position,
    additionalPayout: draw.additionalPayout,
    bellHit: draw.bellHit,
    newPatterns: draw.newPatterns.map(p => p.name),
    matchTypes: draw.cardMatches?.matchTypes ?? null,
  }
}

// ── Card ────────────────────────────────────────────────────

export function sanitizeCard(card: Card): ClientCard {
  // Extract missing-one expectations from the grid
  const missingExpectations: ClientCard['missingExpectations'] = []
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const holder = card.expectations[row][col]
      if (holder) {
        missingExpectations.push({
          row,
          col,
          patternNames: holder.getPatterns().map(p => p.name),
          maxPriority: holder.maxPriority,
        })
      }
    }
  }

  return {
    index: card.index,
    numbers: card.numbers,
    matches: card.matches,
    inPattern: card.inPattern,
    patternPriority: card.patternPriority,
    completedPatterns: Array.from(card.completedPatterns, p => p.name),
    payout: card.payout,
    maxMissingPriority: card.maxMissingPriority,
    maxCompletedPriority: card.maxCompletedPriority,
    ...(missingExpectations.length > 0 && { missingExpectations }),
  }
}

// ── Slot Bonus ──────────────────────────────────────────────

export function sanitizeSlotBonus(round: Round): ClientSlotBonus {
  const sb = round.slotBonus
  return {
    hits: sb.hits,
    triggered: sb.triggered,
    symbols: sb.symbols ? [...sb.symbols] : null,
    prize: sb.prize,
    positions: sb.positions.map(p => ({
      cardIndex: p.cardIndex,
      row: p.row,
      col: p.col,
      hit: p.hit,
    })),
  }
}

// ── Full round → CreateRoundResponse / GetRoundResponse ─────

export function sanitizeRoundFull(
  roundId: string,
  round: Round,
  stake: number,
  bombPositions?: Array<{ cardIndex: number; row: number; col: number }>,
): CreateRoundResponse & GetRoundResponse {
  return {
    roundId,
    cards: round.cards.map(sanitizeCard),
    draws: round.draws.map(sanitizeDraw),
    totalPayout: round.totalPayout,
    winMultiplierPayout: round.winMultiplierPayout,
    extraAvailable: round.extraAvailable,
    superExtraAvailable: round.superExtraAvailable,
    extraStakes: round.extraStakes.map((type, i) => ({
      type,
      price: round.extraPriceAt(i + 30, stake),
    })),
    bellPositions: round.bellPositions,
    slotBonus: sanitizeSlotBonus(round),
    ...(bombPositions && { bombPositions }),
  }
}

// ── Single draw → DrawResponse ──────────────────────────────

export function sanitizeDrawResponse(
  round: Round,
  draw: Draw,
  stake: number,
): DrawResponse {
  const drawIndex = round.currentBallIndex
  return {
    draw: sanitizeDraw(draw),
    cards: round.cards.map(sanitizeCard),
    totalPayout: round.totalPayout,
    winMultiplierPayout: round.winMultiplierPayout,
    extraAvailable: round.extraAvailable,
    superExtraAvailable: round.superExtraAvailable,
    extraPrice: round.extraPriceAt(drawIndex, stake),
    nextExtraPrice: round.extraPriceAt(drawIndex + 1, stake),
    slotBonus: sanitizeSlotBonus(round),
  }
}
