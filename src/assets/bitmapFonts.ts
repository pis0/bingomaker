/**
 * BitmapFont runtime installation — generates GPU-resident glyph atlases
 * from the TTF/OTF fonts already loaded via @font-face.
 *
 * Called once at startup (before first render). Each unique font+size+color
 * combo = one BitmapFont. Resolution 2x for retina/mobile crisp rendering.
 *
 * Usage in components: replace <pixiText style={...}> with
 *   <pixiBitmapText style={{ fontFamily: 'font-name', fontSize: size }} />
 */
import { BitmapFont, TextStyle } from 'pixi.js'

const RES = 3 // @3x — covers iPhone retina (3x) + high-end Android

// Character sets — PixiJS v8 uses [from, to] range pairs
const NUMERIC = [['0', '9'] as [string, string], ' ']
const BUTTON_CHARS = [['A', 'Z'] as [string, string], ['0', '9'] as [string, string], ' ']
const LABEL_CHARS = [['A', 'Z'] as [string, string], ['0', '9'] as [string, string], ...'É() ']
const NUM_FORMAT = [['0', '9'] as [string, string], ...'., ']
const PRICE_CHARS = [['0', '9'] as [string, string], ...'FREE ']

// ── Font families ───────────────────────────────────────────────
const IOWAN = '"Iowan Old Style Black", Georgia, serif'
const MYRIAD = '"Myriad Pro", sans-serif'
const CLARENDON = '"Clarendon Black BT", Georgia, serif'

// ── Install all BitmapFonts ─────────────────────────────────────
let installed = false

// Suppress PixiJS "[Cache] already has key" warnings for BitmapFont
// Applied immediately at module load — before any BitmapText mounts
const _origWarn = console.warn
console.warn = (...args: unknown[]) => {
  if (typeof args[1] === 'string' && args[1].includes('[Cache] already has key')) return
  _origWarn.apply(console, args)
}

export function installBitmapFonts(): void {
  if (installed) return
  installed = true
  const t0 = performance.now()
  let count = 0
  // ── Iowan Old Style Black ───────────────────────────────────

  // SlotCell — 4 color variants at 28px (60 instances on screen)
  // Colors from cardConstants.ts COLORS
  ins('slot-default', IOWAN, 28, 0x332d11, NUMERIC)     // textDefault
  ins('slot-matched', IOWAN, 28, 0x852f96, NUMERIC)     // textMatched
  ins('slot-pattern', IOWAN, 28, 0x5b1f72, NUMERIC)     // textInPattern
  ins('slot-idle', IOWAN, 28, 0x852f96, NUMERIC)         // textMatched (idle highlight)

  // BallCounter — shadow + label at 25px
  ins('counter-shadow', IOWAN, 25, 0x37393c, NUMERIC)
  ins('counter-label', IOWAN, 25, 0xc1c0ae, NUMERIC)

  // AnimatedBall / Ball — regular 24px, extra 29px
  ins('ball-regular', IOWAN, 24, 0x4d371e, NUMERIC)
  ins('ball-extra', IOWAN, 29, 0x4d371e, NUMERIC)

  // BallPanel — large ball 50px
  ins('ball-large', IOWAN, 50, 0x4d371e, NUMERIC)

  // MissingMark — number green/brown 30px, price 18px, bonus 14px
  ins('missing-green', IOWAN, 30, 0x198754, NUMERIC)
  ins('missing-brown', IOWAN, 30, 0x4d321e, NUMERIC)
  ins('missing-price', IOWAN, 18, 0xffffff, LABEL_CHARS)
  ins('missing-bonus', IOWAN, 14, 0xfff770, LABEL_CHARS)

  // MovieSplash — prize label 56px, ball number 75px
  ins('splash-label', IOWAN, 56, 0x340100, BUTTON_CHARS)
  ins('splash-ball', IOWAN, 75, 0x4d371e, NUMERIC)

  // JackpotPanel — title 16px white, subtitle 16px brown
  ins('jackpot-title', IOWAN, 16, 0xffffff, LABEL_CHARS)
  ins('jackpot-sub', IOWAN, 16, 0x4e2b0d, LABEL_CHARS)

  // PayoutCard — value 14px brown, count 14px gold, won variants red
  ins('prize-value', IOWAN, 14, 0x1b1302, NUMERIC)
  ins('prize-count', IOWAN, 14, 0xfacb25, LABEL_CHARS)
  ins('prize-value-won', IOWAN, 14, 0xd11919, NUMERIC)
  ins('prize-count-won', IOWAN, 14, 0xd11919, LABEL_CHARS)

  // BallPanel overlays — EXTRA 70px yellow, SUPER 74px cyan
  ins('overlay-extra', IOWAN, 70, 0xfff000, BUTTON_CHARS)
  ins('overlay-super', IOWAN, 74, 0x00fcff, BUTTON_CHARS)

  // BallPanel — extra price 20px white
  ins('extra-price', IOWAN, 20, 0xffffff, PRICE_CHARS)

  // Tongue — total stake 26px white
  ins('tongue-value', IOWAN, 26, 0xffffff, NUMERIC)

  // ── Myriad Pro ──────────────────────────────────────────────

  // Payout — value 43px white + won blink yellow
  ins('payout-value', MYRIAD, 43, 0xffffff, NUM_FORMAT, '600')
  ins('payout-won', MYRIAD, 43, 0xfdfaa6, NUM_FORMAT, '600')

  // JackpotPanel — jackpot value 35px tan
  ins('jackpot-value', MYRIAD, 35, 0xd5cdaa, NUM_FORMAT, 'bold')

  // ── Clarendon Black BT ──────────────────────────────────────

  // ButtonPanel — play 43px, end 33px, bet 24px (on/off colors)
  ins('btn-play', CLARENDON, 43, 0xffffff, BUTTON_CHARS)
  ins('btn-play-off', CLARENDON, 43, 0xbbbbbb, BUTTON_CHARS)
  ins('btn-end', CLARENDON, 33, 0xffffff, BUTTON_CHARS)
  ins('btn-end-off', CLARENDON, 33, 0xbbbbbb, BUTTON_CHARS)
  ins('btn-bet', CLARENDON, 24, 0xffffff, BUTTON_CHARS)
  ins('btn-bet-off', CLARENDON, 24, 0xbbbbbb, BUTTON_CHARS)

  // Stake value — 8 colors at 26px
  const STAKE_COLORS = [0x6AB22F, 0xB1AA03, 0xCF499D, 0x66736F, 0x4781CD, 0xd5cdaa, 0x80128F, 0xffffff]
  for (let i = 0; i < STAKE_COLORS.length; i++) {
    ins(`stake-${i}`, IOWAN, 26, STAKE_COLORS[i], NUMERIC)
  }

  console.log(`[BitmapFonts] ${count} fonts installed in ${(performance.now() - t0).toFixed(1)}ms`)
}

// ── Helper ──────────────────────────────────────────────────────
type Chars = (string | [string, string])[]

function ins(
  name: string,
  fontFamily: string,
  fontSize: number,
  fill: number,
  chars: Chars,
  fontWeight: string = 'normal',
): void {
  BitmapFont.install({
    name,
    style: new TextStyle({ fontFamily, fontSize, fill, fontWeight: fontWeight as TextStyle['fontWeight'] }),
    chars,
    resolution: RES,
  })
}
