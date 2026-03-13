import { describe, expect, it } from 'vitest'
import { Card } from '../Card'
import { Round } from '../Round'
import { distributeCards } from '../CardDistributor'
import { FruitBombBonusSession } from '../FruitBombBonusSession'
import { ROWS, COLS } from '../constants'

function makeSeededRandom(seed: number) {
  let s = seed
  return () => {
    s = (s * 16807 + 0) % 2147483647
    return s / 2147483647
  }
}

function createRound(seed: number) {
  const random = makeSeededRandom(seed)
  const { cardNumbers, ballSequence } = distributeCards(random)
  const cards = cardNumbers.map((nums, i) => {
    const card = new Card(i)
    card.setNumbers(nums)
    return card
  })
  return { round: new Round(cards, ballSequence, random), random }
}

describe('FruitBombBonusSession', () => {
  const STAKE = 1

  it('selects one position per card', () => {
    const { round, random } = createRound(42)
    const session = new FruitBombBonusSession()
    session.selectPositions(round.cards, random)

    expect(session.positions).toHaveLength(4)
    for (let i = 0; i < 4; i++) {
      expect(session.positions[i].cardIndex).toBe(i)
    }
  })

  it('positions are within valid 2×2 range', () => {
    for (let seed = 1; seed <= 100; seed++) {
      const { round, random } = createRound(seed)
      const session = new FruitBombBonusSession()
      session.selectPositions(round.cards, random)

      for (const pos of session.positions) {
        expect(pos.row).toBeGreaterThanOrEqual(0)
        expect(pos.row).toBeLessThanOrEqual(ROWS - 2) // row+1 must be valid
        expect(pos.col).toBeGreaterThanOrEqual(0)
        expect(pos.col).toBeLessThanOrEqual(COLS - 2) // col+1 must be valid
      }
    }
  })

  it('marks exactly 4 cells per card (2×2 block)', () => {
    const { round, random } = createRound(42)
    // Process some balls first so we have some matches
    round.process(STAKE)

    const session = new FruitBombBonusSession()
    session.selectPositions(round.cards, random)

    // Count matches before
    const matchesBefore = round.cards.map(card => {
      let count = 0
      for (let r = 0; r < ROWS; r++)
        for (let c = 0; c < COLS; c++)
          if (card.matches[r][c]) count++
      return count
    })

    session.process(round, STAKE)

    // Count matches after — each card should have up to 4 more (some may already be matched)
    for (let i = 0; i < 4; i++) {
      const card = round.cards[i]
      let countAfter = 0
      for (let r = 0; r < ROWS; r++)
        for (let c = 0; c < COLS; c++)
          if (card.matches[r][c]) countAfter++

      expect(countAfter).toBeGreaterThanOrEqual(matchesBefore[i])
      expect(countAfter - matchesBefore[i]).toBeLessThanOrEqual(4)
    }

    // true + nil should equal total cells processed (4 per card × 4 cards = 16)
    expect(session.trueMatches + session.nilMatches).toBe(16)
  })

  it('trueMatches counts only newly marked cells', () => {
    const { round, random } = createRound(99)
    // No balls drawn — all cells unmatched
    const session = new FruitBombBonusSession()
    session.selectPositions(round.cards, random)
    session.process(round, STAKE)

    // All 16 cells should be new matches (none were matched before)
    expect(session.trueMatches).toBe(16)
    expect(session.nilMatches).toBe(0)
  })

  it('nilMatches counts already-matched cells', () => {
    const { round, random } = createRound(42)
    // Draw all 30 balls — many cells matched
    round.process(STAKE)

    const session = new FruitBombBonusSession()
    session.selectPositions(round.cards, random)
    session.process(round, STAKE)

    // Some cells should have been already matched
    expect(session.nilMatches).toBeGreaterThan(0)
    expect(session.trueMatches + session.nilMatches).toBe(16)
  })

  it('2×2 block cells are correctly marked', () => {
    const { round, random } = createRound(77)
    // No balls drawn
    const session = new FruitBombBonusSession()
    session.selectPositions(round.cards, random)
    session.process(round, STAKE)

    for (const pos of session.positions) {
      const card = round.cards[pos.cardIndex]
      // All 4 cells of the 2×2 block should be matched
      expect(card.matches[pos.row][pos.col]).toBe(true)
      expect(card.matches[pos.row][pos.col + 1]).toBe(true)
      expect(card.matches[pos.row + 1][pos.col]).toBe(true)
      expect(card.matches[pos.row + 1][pos.col + 1]).toBe(true)
    }
  })
})
