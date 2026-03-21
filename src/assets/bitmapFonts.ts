/**
 * BitmapFont runtime installation — generates GPU-resident glyph atlases
 * from the TTF/OTF fonts already loaded via @font-face.
 *
 * Called once at startup (before first render). Each unique font+size combo
 * = one BitmapFont. Resolution 3x for retina/mobile crisp rendering.
 *
 * Color consolidation: fonts that previously had multiple color variants are
 * now installed as WHITE (0xffffff). Components apply color via `tint` prop
 * on <pixiBitmapText>. This cuts GPU atlas memory roughly in half.
 *
 * Usage in components: replace <pixiText style={...}> with
 *   <pixiBitmapText style={{ fontFamily: 'font-name', fontSize: size }}
 *                   tint={0xff0000} />
 */
import { BitmapFont, DynamicBitmapFont, TextStyle } from 'pixi.js'

// RES=3 with textureSize=256 → nextPow2(256*3)=1024 → 4MB per page (same as
// RES=2 with textureSize=512). PixiJS auto-creates extra pages if chars don't
// fit, so even large charsets (BUTTON_CHARS ~37 chars at 43px) stay manageable.
const RES = 3 // @3x — sharp on all densities, 256px texture keeps pages at 4MB

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

// ── Helper ──────────────────────────────────────────────────────
type Chars = (string | [string, string])[]

export function installBitmapFonts(): void {
  if (installed) return
  installed = true
  // Set textureSize=256 globally: nextPow2(256*3)=1024 → 4MB/page (vs default 512 → 16MB/page)
  DynamicBitmapFont.defaultOptions.textureSize = 256
  const t0 = performance.now()
  let count = 0

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
    count++
  }

  // ── Iowan Old Style Black ───────────────────────────────────

  // SlotCell — white 28px, components tint per state (default/matched/pattern/idle)
  ins('slot', IOWAN, 28, 0xffffff, NUMERIC)

  // BallCounter — white 25px, components tint for shadow/label
  ins('counter', IOWAN, 25, 0xffffff, NUMERIC)

  // AnimatedBall / Ball — brown 24px regular, 29px extra (unique colors, no consolidation)
  ins('ball-regular', IOWAN, 24, 0x4d371e, NUMERIC)
  ins('ball-extra', IOWAN, 29, 0x4d371e, NUMERIC)

  // BallPanel — large ball 50px brown
  ins('ball-large', IOWAN, 50, 0x4d371e, NUMERIC)

  // MissingMark — white 30px number, 18px price (unique color)
  ins('missing-num', IOWAN, 30, 0xffffff, NUMERIC)
  ins('missing-price', IOWAN, 18, 0xffffff, LABEL_CHARS)

  // MovieSplash — prize label 56px dark, ball number 75px brown (unique colors)
  ins('splash-label', IOWAN, 56, 0x340100, BUTTON_CHARS)
  ins('splash-ball', IOWAN, 75, 0x4d371e, NUMERIC)

  // Labels — white 16px (jackpot title/sub, any 16px label — tint per use)
  ins('label-16', IOWAN, 16, 0xffffff, LABEL_CHARS)

  // PayoutCard + MissingMark bonus — white 14px numeric + 14px label, tint per state
  ins('prize-num', IOWAN, 14, 0xffffff, NUMERIC)
  ins('prize-label', IOWAN, 14, 0xffffff, LABEL_CHARS)

  // BallPanel overlays — EXTRA 70px yellow, SUPER 74px cyan (unique colors)
  ins('overlay-extra', IOWAN, 70, 0xfff000, BUTTON_CHARS)
  ins('overlay-super', IOWAN, 74, 0x00fcff, BUTTON_CHARS)

  // BallPanel — extra price 20px white
  ins('extra-price', IOWAN, 20, 0xffffff, PRICE_CHARS)

  // Tongue + Stake — white 26px numeric, tint per stake level
  ins('value-26', IOWAN, 26, 0xffffff, NUMERIC)

  // ── Myriad Pro ──────────────────────────────────────────────

  // Payout — white 43px, tint for won/blink states
  ins('payout', MYRIAD, 43, 0xffffff, NUM_FORMAT, '600')

  // JackpotPanel — jackpot value 35px tan (unique color)
  ins('jackpot-value', MYRIAD, 35, 0xd5cdaa, NUM_FORMAT, 'bold')

  // ── Clarendon Black BT ──────────────────────────────────────

  // ButtonPanel — white, tint for on/off states
  ins('btn-play', CLARENDON, 43, 0xffffff, BUTTON_CHARS)
  ins('btn-end', CLARENDON, 33, 0xffffff, BUTTON_CHARS)
  ins('btn-bet', CLARENDON, 24, 0xffffff, BUTTON_CHARS)

  console.log(`[BitmapFonts] ${count} fonts installed in ${(performance.now() - t0).toFixed(1)}ms`)
}
