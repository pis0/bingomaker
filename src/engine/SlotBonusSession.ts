import type { Card } from './Card'
import type { RandomFn } from './types'
import { ROWS, COLS } from './constants'

/** Slot symbol types (AS3 constants) */
export const SLOT_X2 = 'x' as const
export const SLOT_FRUIT = 'F' as const
export const SLOT_BONUS = '@' as const
export type SlotSymbol = typeof SLOT_X2 | typeof SLOT_FRUIT | typeof SLOT_BONUS

export const ALL_SLOT_SYMBOLS: SlotSymbol[] = [SLOT_X2, SLOT_FRUIT, SLOT_BONUS]

export interface SlotPosition {
  cardIndex: number
  row: number
  col: number
  ball: number
  hit: boolean
}

const HITS_REQUIRED = 4

// AS3: SlotBonusSession.BUCKET — equal probability
const PRIMARY_BUCKET: SlotSymbol[] = [
  SLOT_X2, SLOT_X2, SLOT_X2, SLOT_X2,
  SLOT_FRUIT, SLOT_FRUIT, SLOT_FRUIT, SLOT_FRUIT,
  SLOT_BONUS, SLOT_BONUS, SLOT_BONUS, SLOT_BONUS,
]

// AS3: SlotBonusSession.BUCKETS2 — weighted by first symbol
const SECONDARY_BUCKETS: Record<SlotSymbol, SlotSymbol[]> = {
  [SLOT_X2]: [SLOT_X2, SLOT_X2, SLOT_X2, SLOT_X2, SLOT_FRUIT, SLOT_FRUIT, SLOT_BONUS, SLOT_BONUS],
  [SLOT_FRUIT]: [SLOT_X2, SLOT_X2, SLOT_FRUIT, SLOT_FRUIT, SLOT_FRUIT, SLOT_FRUIT, SLOT_BONUS, SLOT_BONUS],
  [SLOT_BONUS]: [SLOT_X2, SLOT_X2, SLOT_FRUIT, SLOT_FRUIT, SLOT_BONUS, SLOT_BONUS, SLOT_BONUS, SLOT_BONUS],
}

function pickRandom<T>(arr: T[], random: RandomFn): T {
  return arr[Math.floor(random() * arr.length)]
}

export class SlotBonusSession {
  positions: SlotPosition[] = []
  hits = 0
  triggered = false
  symbols: SlotSymbol[] | null = null
  prize: SlotSymbol | null = null

  /** Create 4 random bell positions (one per card) */
  shuffle(cards: Card[], random: RandomFn): void {
    this.positions = []
    for (let i = 0; i < Math.min(HITS_REQUIRED, cards.length); i++) {
      const card = cards[i]
      const row = Math.floor(random() * ROWS)
      const col = Math.floor(random() * COLS)
      const ball = card.numbers[row][col]
      this.positions.push({ cardIndex: i, row, col, ball, hit: false })
    }
    this.hits = 0
    this.triggered = false
    this.symbols = null
    this.prize = null
  }

  reset(): void {
    for (const pos of this.positions) pos.hit = false
    this.hits = 0
    this.triggered = false
    this.symbols = null
    this.prize = null
  }

  /** Process a drawn ball. Returns true if it was a bell hit. */
  process(ball: number, random: RandomFn = Math.random): boolean {
    if (this.triggered) return false
    for (const pos of this.positions) {
      if (pos.ball === ball && !pos.hit) {
        pos.hit = true
        this.hits++
        if (this.hits >= HITS_REQUIRED) {
          this._trigger(random)
        }
        return true
      }
    }
    return false
  }

  private _trigger(random: RandomFn): void {
    this.triggered = true
    const first = pickRandom(PRIMARY_BUCKET, random)
    const secondary = SECONDARY_BUCKETS[first]
    const second = pickRandom(secondary, random)
    const third = pickRandom(secondary, random)
    this.symbols = [first, second, third]

    if (first === second && second === third) {
      this.prize = first
    } else {
      this.prize = null
    }
  }

  get winMultiplier(): number {
    return this.prize === SLOT_X2 ? 2 : 1
  }
}
