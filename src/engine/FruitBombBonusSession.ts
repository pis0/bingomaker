import { ROWS, COLS } from './constants'
import type { Card } from './Card'
import type { Round } from './Round'
import { checkForPatterns } from './PatternResolver'
import type { RandomFn } from './types'

export interface BombPosition {
  cardIndex: number
  /** Top-left row of the 2×2 block */
  row: number
  /** Top-left column of the 2×2 block */
  col: number
}

/**
 * AS3: FruitBombBonusSession
 *
 * Picks 1 random position per card (from valid 2×2-able slots),
 * marks a 2×2 block of cells on each card.
 */
export class FruitBombBonusSession {
  readonly positions: BombPosition[] = []
  trueMatches = 0
  nilMatches = 0

  /**
   * Select bomb positions (one per card).
   *
   * AS3 eligible indices: [0,1,2,3,5,6,7,8] (column-major, skipping center=4)
   * Converted to (row, col) where row ∈ [0,1] and col ∈ [0,3]
   * so the 2×2 block doesn't overflow the 3×5 grid.
   *
   * Index mapping (column-major: idx = col * ROWS + row):
   *   0→(0,0) 1→(1,0) 2→(2,0) 3→(0,1) 4→(1,1) 5→(2,1) 6→(0,2) 7→(1,2) 8→(2,2)
   *
   * But 2×2 needs row+1 valid → row ∈ [0, ROWS-2] = [0,1]
   * And col+1 valid → col ∈ [0, COLS-2] = [0,3]
   *
   * AS3 uses: line = s / 5, column = s % 5 (row-major),
   * with eligible = [0,1,2,3,5,6,7,8] which gives:
   *   0→(0,0) 1→(0,1) 2→(0,2) 3→(0,3) 5→(1,0) 6→(1,1) 7→(1,2) 8→(1,3)
   * All satisfy row ∈ [0,1] and col ∈ [0,3] ✓
   */
  private static readonly ELIGIBLE = [0, 1, 2, 3, 5, 6, 7, 8]

  selectPositions(cards: Card[], random: RandomFn = Math.random): void {
    this.positions.length = 0
    const eligible = FruitBombBonusSession.ELIGIBLE

    for (let i = 0; i < cards.length; i++) {
      const idx = eligible[Math.floor(random() * eligible.length)]
      // AS3: line = s / 5, column = s % 5 (integer division, row-major indexing)
      const row = Math.floor(idx / COLS)
      const col = idx % COLS
      this.positions.push({ cardIndex: i, row, col })
    }
  }

  /**
   * Process: mark 2×2 block on each card, draw balls through Round.
   * Returns draws made (for visual animation of newly marked cells).
   */
  process(round: Round, stake: number): void {
    this.trueMatches = 0
    this.nilMatches = 0

    for (const pos of this.positions) {
      const card = round.cards[pos.cardIndex]
      // AS3: 4 cells — TL, TR, BR, BL (order from AS3 FruitBombBonusSession)
      const cells = [
        { row: pos.row, col: pos.col },
        { row: pos.row, col: pos.col + 1 },
        { row: pos.row + 1, col: pos.col + 1 },
        { row: pos.row + 1, col: pos.col },
      ]

      for (const cell of cells) {
        if (cell.row >= ROWS || cell.col >= COLS) continue

        if (card.matches[cell.row][cell.col]) {
          // Already matched
          this.nilMatches++
        } else {
          // New match — mark it
          this.trueMatches++
          const ball = card.numbers[cell.row][cell.col]
          card.setMatch(ball)
          // Check patterns after each match
          checkForPatterns(card, stake)
          card.clearLastMatch()
        }
      }
    }
  }
}
