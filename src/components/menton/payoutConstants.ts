/** PayoutTable layout constants — matching AS3 PayoutTable.as / PayoutCard.as */

import {
  LINE_1, LINE_2, LINE_3,
  DOUBLE_COLUMN_1, DOUBLE_COLUMN_2, DOUBLE_COLUMN_3, DOUBLE_COLUMN_4,
  TRIPLE_COLUMN_1, TRIPLE_COLUMN_2, TRIPLE_COLUMN_3,
  DOUBLE_LINE_1, DOUBLE_LINE_2, DOUBLE_LINE_3,
  QUAD_COLUMN_1, QUAD_COLUMN_2, QUAD_COLUMN_3,
  FULL,
  type Pattern,
} from '../../engine/Pattern'

// Each PayoutCard group: index → list of patterns it displays
export const PAYOUT_CARD_PATTERNS: Pattern[][] = [
  [LINE_1, LINE_2, LINE_3],                                       // 0 — LINE
  [DOUBLE_COLUMN_1, DOUBLE_COLUMN_2, DOUBLE_COLUMN_3, DOUBLE_COLUMN_4], // 1 — DOUBLE_COLUMN
  [TRIPLE_COLUMN_1, TRIPLE_COLUMN_2, TRIPLE_COLUMN_3],            // 2 — TRIPLE_COLUMN
  [DOUBLE_LINE_1, DOUBLE_LINE_2, DOUBLE_LINE_3],                  // 3 — DOUBLE_LINE
  [QUAD_COLUMN_1, QUAD_COLUMN_2],                                 // 4 — QUAD_COLUMN
  [QUAD_COLUMN_3],                                                 // 5 — QUAD_COLUMN_3
  [FULL],                                                          // 6 — FULL
]

// Pattern → PayoutCard index mapping (reverse lookup)
export const PATTERN_TO_CARD_INDEX = new Map<Pattern, number>()
PAYOUT_CARD_PATTERNS.forEach((patterns, cardIdx) => {
  patterns.forEach(p => PATTERN_TO_CARD_INDEX.set(p, cardIdx))
})

// Card spacing — AS3: addComp(new PayoutCard(...), {x: i * 73, y: 0})
export const PAYOUT_CARD_SPACING = 73

// PayoutTable position within Menton — AS3: Menton.as (x:80, y:215)
export const PAYOUT_TABLE_X = 80
export const PAYOUT_TABLE_Y = 215

// Slot dot layout within PayoutCard — AS3: x: 11*(i%5)+1, y: (8+1)*floor(i/5)
export const DOT_COLS = 5
export const DOT_ROWS = 3
export const DOT_CELL_W = 11
export const DOT_CELL_H = 9   // 8 + 1
export const DOT_OFFSET_X = 3
export const DOT_OFFSET_Y = 3

// Background on textures per card index — AS3: BG_ON_TEXTURES
export const BG_ON_TEXTURES = [
  'prize2', 'prize2', 'prize3', 'prize4', 'prize5', 'prize6', 'prize7',
]

// bgon offset — AS3: addImage(..., {x:-3, y:-2})
export const BGON_OFFSET_X = -3
export const BGON_OFFSET_Y = -2

// Slot dot colors — IDLE
export const PATTERN_COLORS = [
  0x1b1302, // brown
  0xffffff, // white (default dot color)
  0x119dee, // blue
]

// Slot dot colors — MISSING blink
export const BLINK_COLORS = [
  0xf63e3b, // red
  0xffea00, // yellow
]

// Per-card missing colors — AS3: MISSING_COLORS
export const MISSING_COLORS = [
  0x521c67, // 0 LINE — purple
  0x521c67, // 1 DOUBLE_COLUMN — purple
  0x1f6f1d, // 2 TRIPLE_COLUMN — green
  0xd42f88, // 3 DOUBLE_LINE — pink
  0x24688d, // 4 QUAD_COLUMN — blue
  0xa88800, // 5 QUAD_COLUMN_3 — dark yellow
  0xb30625, // 6 FULL — red
]

// Label colors
export const LABEL_COLOR_IDLE = 0x1b1302    // brown
export const LABEL_COLOR_WON = 0xd11919     // red
export const COUNT_COLOR_IDLE = 0xfacb25    // gold

// Font families
export const FONT_LABEL = '"Iowan Old Style Black", "Iowan Old Style", Georgia, serif'
export const FONT_COUNT = '"Myriad Pro", "Myriad Pro Bold", Arial, sans-serif'

// Timing
export const PATTERN_CYCLE_INTERVAL = 2000    // ms between pattern changes in idle (PayoutCard dot cycling)
export const INTERVAL_PATTERN_DELAY = 1500    // ms — AS3 IntervalCardPatternController.animPattern delay
export const MISSING_BLINK_INTERVAL = 1500    // ms — Syncable.interval
export const MISSING_ANIM_INTERVAL = 1200     // ms between cycling missing patterns
export const MISSING_ANIM_INTERVAL_SINGLE = 330 // ms when only 1 missing pattern

// All individual patterns for idle cycling (AS3: IntervalCardPatternController.PATTERNS — no FULL)
export const INTERVAL_PATTERNS: Pattern[] = [
  LINE_1, LINE_2, LINE_3,
  DOUBLE_COLUMN_1, DOUBLE_COLUMN_2, DOUBLE_COLUMN_3, DOUBLE_COLUMN_4,
  TRIPLE_COLUMN_1, TRIPLE_COLUMN_2, TRIPLE_COLUMN_3,
  DOUBLE_LINE_1, DOUBLE_LINE_2, DOUBLE_LINE_3,
  QUAD_COLUMN_1, QUAD_COLUMN_2, QUAD_COLUMN_3,
]
