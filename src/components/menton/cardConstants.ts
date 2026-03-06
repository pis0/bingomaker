/** Layout constants matching AS3 Cardd.as */

// Slot dimensions (visual quad)
export const SLOT_W = 58
export const SLOT_H = 40

// Grid offset within card
export const X_O = 16
export const Y_O = 33

// Number field cell spacing
export const CELL_W = 65
export const CELL_H = 46

// Card source size (from atlas frame)
export const CARD_W = 332
export const CARD_H = 168

// Card panel grid gap
export const CARD_GAP = 5

// Colors
export const COLORS = {
  // Slot backgrounds
  bgDefault: 0xffffff,
  bgMatched: 0x5b1f72,
  bgMatchedDark: 0x2f113d,
  bgMark: 0x666666,

  // Number text
  textDefault: 0x332d11,
  textMatched: 0x852f96,
  textInPattern: 0x5b1f72,
  textMatchTransition: 0x000000,
  textMissing: 0xffffff,

  // Missing mark
  missingBg: 0xffffff,
  missingPriceBg: 0x1e6c17,
  missingTitle: 0x1e6c17,

  // Pattern color cycles by priority (from Slot.as NEW_PATTERN_MATCH_FINISH_COLORS_BY_PATTERN_PRIORITY)
  // Index = PatternGroup.priority: LINE/DOUBLE_COLUMN=1, TRIPLE_COLUMN=2, DOUBLE_LINE=3, QUAD_COLUMN=4, QUAD_COLUMN_3=5, FULL=6
  patternColors: [
    null, // 0 — unused
    [0x00ff00, 0x44aa44], // 1 — LINE & DOUBLE_COLUMN
    [0x0066ff, 0xff77ff, 0x55aaff], // 2 — TRIPLE_COLUMN
    [0x0066ff, 0xff77ff, 0x55aaff], // 3 — DOUBLE_LINE
    [0xff00ff, 0xffbb00, 0xff0066, 0x6600ff], // 4 — QUAD_COLUMN
    [0xff00ff, 0xffbb00, 0xff0066, 0x6600ff], // 5 — QUAD_COLUMN_3
    [0xff00ff, 0xffbb00, 0xff0066, 0x6600ff], // 6 — FULL
  ] as (number[] | null)[],
} as const

// Missing mark icon names by maxPriority
// Priority 1 (LINE/DOUBLE_COLUMN): no icon
// Priority 2 (TRIPLE_COLUMN): missing_3colunas
// Priority 3 (DOUBLE_LINE): missing_linhadupla
// Priority 4 (QUAD_COLUMN): missing_4colunas
// Priority 5 (QUAD_COLUMN_3): missing_caixadupla
// Priority 6 (FULL): missing_bingo
export const MISSING_ICONS: Record<number, string> = {
  2: 'missing_3colunas',
  3: 'missing_linhadupla',
  4: 'missing_4colunas',
  5: 'missing_caixadupla',
  6: 'missing_bingo',
}

// Missing mark icon offsets (relative to slot position)
export const MISSING_ICON_OFFSETS: Record<number, { x: number; y: number }> = {
  2: { x: -6, y: -7 },
  3: { x: -6, y: -7 },
  4: { x: -10, y: -10 },
  5: { x: -10, y: -10 },
  6: { x: -15, y: -17 },
}

// Pulse animation keyframes (20-frame loop from MissingTextMotion.as)
// Each entry: [scale, alpha]
export const PULSE_KEYFRAMES: [number, number][] = [
  [0.95, 1.0],
  [0.90, 0.9],
  [0.85, 0.8],
  [0.80, 0.7],
  [0.85, 0.65],
  [0.90, 0.6],
  [0.95, 0.6],
  [1.0, 0.65],
  [1.05, 0.7],
  [1.10, 0.8],
  [1.05, 0.9],
  [1.0, 1.0],
]

// Moldura border frame names and positions by pattern name
// Z-order for moldura layers (matching AS3 MissingBackground.draww layer order)
// tripleColumnLayer(0) → fourColumnLayer(1) → doubleBoxLayer(2) → doubleLineLayer(3) → bingoLayer(4)
export const MOLDURA_CONFIG: Record<string, { texture: string; x: number; y: number; scaleX: number; scaleY: number; zOrder: number; dynamicY?: boolean }> = {
  TRIPLE_COLUMN_1: { texture: 'moldura_3colunas', x: 15, y: 33, scaleX: 1.0, scaleY: 1.05, zOrder: 0 },
  TRIPLE_COLUMN_2: { texture: 'moldura_3colunas', x: 79, y: 33, scaleX: 1.0, scaleY: 1.05, zOrder: 0 },
  TRIPLE_COLUMN_3: { texture: 'moldura_3colunas', x: 143, y: 33, scaleX: 1.0, scaleY: 1.05, zOrder: 0 },
  QUAD_COLUMN_1: { texture: 'moldura_4colunas', x: 15, y: 33, scaleX: 1.015, scaleY: 1.07, zOrder: 1 },
  QUAD_COLUMN_2: { texture: 'moldura_4colunas', x: 79, y: 33, scaleX: 1.015, scaleY: 1.07, zOrder: 1 },
  QUAD_COLUMN_3: { texture: 'moldura_caixadupla', x: 14, y: 27, scaleX: 1.0, scaleY: 1.05, zOrder: 2 },
  DOUBLE_LINE_1: { texture: 'moldura_linhadupla', x: 7, y: 0, scaleX: 1.0, scaleY: 1.0, zOrder: 3, dynamicY: true },
  DOUBLE_LINE_2: { texture: 'moldura_linhadupla', x: 7, y: 0, scaleX: 1.0, scaleY: 1.0, zOrder: 3, dynamicY: true },
  DOUBLE_LINE_3: { texture: 'moldura_linhadupla', x: 7, y: 0, scaleX: 1.0, scaleY: 1.0, zOrder: 3, dynamicY: true },
  FULL: { texture: 'moldura_bingo', x: 10, y: 9, scaleX: 1.0, scaleY: 1.0, zOrder: 4 },
}
