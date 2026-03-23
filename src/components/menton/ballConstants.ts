/** BallPanel layout constants — AS3 BallPanelMenton positions confirmed by Composer */

// ── Ball travel speed multiplier ─────────────────────────────────
// Scales drop/roll speeds and shrinks landing duration.
// 1.0 = AS3 original, >1.0 = faster trajectory (dispatch interval unchanged).
export const BALL_TRAVEL_SPEED = 1.7

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

// BallCounter — centered with pipe exit (pipe texture bottom center = x:39, + PIPE_X=-6 → 33)
export const COUNTER_X = 33
export const COUNTER_Y = 30
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

// ── Extra ball path (AS3: BallPath.as) ──────────────────────────
// Extra balls exit from the chute, not the pipe
export const EXTRA_CHUTE_X = 130
export const EXTRA_CHUTE_Y = -70
export const EXTRA_WAYPOINT_X = 135
export const EXTRA_WAYPOINT_Y = -70

// Extra ball grid: 2 rows × 5 cols (AS3: BallPath stake positions)
// Formula: x = 511 - 76 * floor((i-30)/2), y = -43 - 60 * ((i-30)%2)
export const EXTRA_GRID_START_X = 511
export const EXTRA_GRID_COL_SPACING = 76 // 61 + 15
export const EXTRA_GRID_ROW_SPACING = 60
export const EXTRA_GRID_BASE_Y = -43

// Extra ball flight scale (AS3: BallPath scale 1.3)
export const EXTRA_BALL_SCALE = 1.3

// Extra ball speeds (AS3: BallPath — fraction per frame at 60fps)
export const EXTRA_SPEED_PHASE1 = 0.25
export const EXTRA_SPEED_PHASE2 = 0.16

// Extra ball landing (AS3: Ball.fitToExtraStake)
export const EXTRA_LAND_DURATION = 0.6 // seconds, easeOutBack
export const EXTRA_LAND_SCALE_DURATION = 0.2 // seconds, easeOutBounce

// ── Super extra ball path ───────────────────────────────────────
// Super balls fly to far right then arc to vertical stack
export const SUPER_TARGET_X = 730
export const SUPER_TARGET_Y = 0
export const SUPER_SPEED = 0.05

// Super ball stack (AS3: Ball.fitToLastSuperPosition)
export const SUPER_STACK_X = 36
export const SUPER_STACK_BASE_Y = 320
export const SUPER_STACK_BALL_HEIGHT = 56 // extraball texture height

// Super arc (AS3: throwObject)
export const SUPER_PHASE1_DURATION = 0.4
export const SUPER_PHASE1_TARGET_X = 340
export const SUPER_PHASE1_TARGET_Y = 365
export const SUPER_ARC_PEAK_Y = 118 // 318 - 200
export const SUPER_FINAL_SNAP_DURATION = 0.2

// PopperJuice position (AS3: movieSplashContainer.addMovie pipo_juice)
export const POPPER_X = 36
export const POPPER_Y = 25

// ── Cover animation (AS3: BallPanelMenton.openExtraCover/closeExtraCover) ──
export const COVER_OPEN_DURATION = 1000 // 1s — burst open (EASE_OUT_BACK)
export const COVER_CLOSE_DURATION = 600 // 0.6s — slow close after peel fling
export const COVER_SPLASH_CLOSE_DURATION = 200 // 0.2s — quick close after splash

// ── Text overlay (AS3: BallPanelMenton.showText) ────────────────
export const EXTRA_TEXT_COLOR = 0xfff000 // yellow
export const EXTRA_TEXT_SIZE = 70
export const SUPER_TEXT_COLOR = 0x00fcff // cyan
export const SUPER_TEXT_SIZE = 74
export const TEXT_FADE_IN = 300 // 0.3s
export const TEXT_HOLD = 500 // 0.5s
export const TEXT_FADE_OUT = 200 // 0.2s

// ── Peel animation (AS3: extra/super ball launch buildup) ───────
// 3 visible steps (3→2→1) + final step 0 (full open → launch)
export const PEEL_STEP_INTERVAL = 500    // ms between steps
export const PEEL_STEP_TWEEN = 222       // ms per step cover tween (AS3: 0.222s easeOutBack)
export const PEEL_FLING_TWEEN = 120      // ms — step 0 fast open (force sensation)

// Cover rotation per step — indexed by step number [step0, step1, step2, step3]
export const PEEL_COVER_ROTATIONS = [COVER_ROTATION_OPEN, -0.66, -0.55, -0.44]

// Wobble on cover during steps 3-1 (after tween lands)
export const PEEL_WOBBLE_AMPLITUDE = 0.05 // radians (±0.05)
export const PEEL_WOBBLE_SPEED = 12       // radians/sec

// Stuck ball position per step — indexed by step number [step0, step1, step2, step3]
export const PEEL_BALL_X = [135, 135, 130, 126]
export const PEEL_BALL_Y = -70
export const PEEL_BALL_SCALE = 1.3
