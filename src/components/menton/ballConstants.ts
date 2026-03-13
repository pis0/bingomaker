/** BallPanel layout constants — AS3 BallPanelMenton positions confirmed by Composer */

// Tubos (ballcontainer1/2)
export const TUBING_Y = 340

// Cano (ballpipe)
export const PIPE_X = -6
export const PIPE_Y = 0

// Extra front container (pipoqueira area)
export const EXTRA_FRONT_Y = -140
export const FUNDO_Y = 20
export const TAMPA_Y = 20

// Cover (bigballpipe2 — tampa fechada)
export const COVER_X = 141
export const COVER_Y = 32
export const COVER_PIVOT_X = 5
export const COVER_PIVOT_Y = 8
export const COVER_ROTATION_CLOSED = 0
export const COVER_ROTATION_OPEN = -2.2 // radians (AS3: openExtraCover)

// BG extra ball
export const BG_EXTRA_X = 170
export const BG_EXTRA_Y = 0

// IdleLemon container offsets
export const IDLE_CONTAINER_X = 33
export const IDLE_CONTAINER_Y = 23
export const IDLE_LEMON_X = 38
export const IDLE_LEMON_Y = 48

// BallCounter
export const COUNTER_X = 18
export const COUNTER_Y = 20
export const COUNTER_FONT = '"Iowan Old Style Black", Georgia, serif'
export const COUNTER_SIZE = 25
export const COUNTER_COLOR = 0xc1c0ae
export const COUNTER_SHADOW = 0x37393c

// Large ball (pipoqueira)
export const LARGE_BALL_X = 40
export const LARGE_BALL_Y = 29

// Ball layout (2 rows of 15)
export const ROW_0_Y = 460
export const ROW_1_Y = 425
export const ROW_0_START_X = 685
export const ROW_1_START_X = 705
export const BALL_SPACING = 45
export const BALL_ROW_SIZE = 15

// Ball text
// AS3 uses bitmap font at 33/39px — PixiJS vector font renders larger,
// so we scale down to achieve visual parity with the 45×44 ball texture.
export const BALL_FONT = '"Iowan Old Style Black", Georgia, serif'
export const BALL_TEXT_COLOR = 0x4d371e
export const BALL_NORMAL_SIZE = 24
export const BALL_EXTRA_SIZE = 29
