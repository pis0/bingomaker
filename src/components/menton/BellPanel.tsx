import { useRef, useEffect, useCallback } from 'react'
import { Container, Sprite, Spritesheet, Assets, Texture, Graphics } from 'pixi.js'
import { extend, useTick } from '@pixi/react'
import { ALL_SLOT_SYMBOLS, type SlotSymbol } from '../../engine/SlotBonusSession'
import { BELL_PANEL_X, BELL_PANEL_Y } from './layoutConstants'

extend({ Container })

// Stripe Y positions (AS3: BellPanel.draww)
const STRIPE_Y = [0, 32, 58]

// Bell frame textures (AS3: covers stripes when unrevealed)
const BELL_FRAME_NAMES = ['bell1', 'bell2', 'bell3']

// Symbol texture mapping: [symbolType][position] → textureName
// AS3: SlotSymbolPool — FRUIT→bomb, BONUS→lemon, X2→multiply, BELL→bell_on
const SYMBOL_TEXTURES: Record<string, [string, string, string]> = {
  F: ['bomb1', 'bomb2', 'bomb3'],
  '@': ['lemon1', 'lemon2', 'lemon3'],
  x: ['multiply1', 'multiply2', 'multiply3'],
  SLOT_BELL: ['bell1_on', 'bell2_on', 'bell3_on'],
}

// Spin direction per stripe: -1 = scroll left, +1 = scroll right
// AS3: stripe1 LEFT, stripe2 RIGHT, stripe3 LEFT
const STRIPE_DIRECTION = [-1, 1, -1]

const RANDOM_BEFORE = 5
const BLINK_INTERVAL_MS = 200

function easeOutQuint(t: number): number {
  return 1 - (1 - t) ** 5
}

function tex(name: string): Texture {
  const sheet = Assets.get<Spritesheet>('menton0')
  return sheet?.textures[name] ?? Texture.EMPTY
}

function pickRandomSymbol(exclude: SlotSymbol): SlotSymbol {
  const filtered = ALL_SLOT_SYMBOLS.filter(s => s !== exclude)
  return filtered[Math.floor(Math.random() * filtered.length)]
}

/** Get the width of a symbol texture for a given position */
function symbolWidth(sym: string, pos: number): number {
  const texName = SYMBOL_TEXTURES[sym]?.[pos]
  if (!texName) return 128
  const t = tex(texName)
  return t.width || 128
}

interface StripeAnim {
  startX: number
  endX: number
  duration: number
  elapsed: number
  done: boolean
}

type Phase = 'idle' | 'spinning' | 'result'

interface Props {
  bellsRevealed: number
  spinSymbols: SlotSymbol[] | null
  blinking: boolean
  onSpinComplete?: () => void
}

export default function BellPanel({ bellsRevealed, spinSymbols, blinking, onSpinComplete }: Props) {
  const containerRef = useRef<Container>(null)
  const built = useRef(false)

  const stripesRef = useRef<[Container, Container, Container] | null>(null)
  const bellFramesRef = useRef<Sprite[]>([])
  const winBlinkRef = useRef<Sprite | null>(null)

  const phaseRef = useRef<Phase>('idle')
  const stripeAnimsRef = useRef<StripeAnim[]>([])
  const remainingSpinsRef = useRef(0)
  const blinkTimerRef = useRef(0)
  const lastSpinSymbolsRef = useRef<SlotSymbol[] | null>(null)

  const onSpinCompleteRef = useRef(onSpinComplete)
  useEffect(() => { onSpinCompleteRef.current = onSpinComplete })

  // Build display hierarchy on mount (AS3: BellPanel.draww)
  useEffect(() => {
    const root = containerRef.current
    if (!root || built.current) return
    built.current = true

    const slotsContainer = new Container()
    root.addChild(slotsContainer)

    // 1. Three stripes (behind bell frames)
    const stripes: [Container, Container, Container] = [
      new Container(),
      new Container(),
      new Container(),
    ]
    for (let i = 0; i < 3; i++) {
      stripes[i].y = STRIPE_Y[i]
      slotsContainer.addChild(stripes[i])
      // Initial bell symbol in each stripe
      const bellSprite = new Sprite(tex(SYMBOL_TEXTURES.SLOT_BELL[i]))
      stripes[i].addChild(bellSprite)
    }
    stripesRef.current = stripes

    // 2. Bell frame images (on top of stripes, cover them when unrevealed)
    const bellFrames: Sprite[] = []
    for (let i = 0; i < 3; i++) {
      const frame = new Sprite(tex(BELL_FRAME_NAMES[i]))
      frame.y = STRIPE_Y[i]
      slotsContainer.addChild(frame)
      bellFrames.push(frame)
    }
    bellFramesRef.current = bellFrames

    // 3. slotmask1 — primary decorative frame overlay (ON TOP, inside slotsContainer)
    const mask1 = new Sprite(tex('slotmask1'))
    mask1.x = -5
    slotsContainer.addChild(mask1)

    // 4. slotmask2 — secondary decorative overlay (ON TOP, inside slotsContainer)
    const mask2 = new Sprite(tex('slotmask2'))
    mask2.x = -5
    mask2.y = -5
    slotsContainer.addChild(mask2)

    // 5. Clip mask (AS3: slotsContainer.clipRect = Rectangle(-5, 0, 200, 150))
    const maskGfx = new Graphics()
    maskGfx.rect(-5, 0, 200, 150)
    maskGfx.fill({ color: 0xffffff })
    slotsContainer.addChild(maskGfx)
    slotsContainer.mask = maskGfx

    // 6. Win blink overlay (outside slotsContainer — not clipped)
    const winBlink = new Sprite(tex('slotmask3'))
    winBlink.x = -5
    winBlink.visible = false
    root.addChild(winBlink)
    winBlinkRef.current = winBlink
  }, [])

  // Build stripe symbols and start spin
  const startSpin = useCallback((symbols: SlotSymbol[]) => {
    const stripes = stripesRef.current
    if (!stripes) return

    for (let pos = 0; pos < 3; pos++) {
      const stripe = stripes[pos]
      const target = symbols[pos]
      const direction = STRIPE_DIRECTION[pos]

      // Clear stripe
      while (stripe.children.length > 0) stripe.removeChildAt(0)

      if (direction === -1) {
        // Left-scrolling (top & bottom): symbols laid left→right, tween scrolls left
        // AS3: each symbol at x = Math.floor(stripe.width - 1)

        // Initial bell
        const bell = new Sprite(tex(SYMBOL_TEXTURES.SLOT_BELL[pos]))
        bell.x = 0
        stripe.addChild(bell)
        let xCursor = bell.width - 1

        // 5 random (last one can't match target — AS3 border guard)
        for (let r = 0; r < RANDOM_BEFORE; r++) {
          const sym = pickRandomSymbol(r === RANDOM_BEFORE - 1 ? target : ('' as SlotSymbol))
          const s = new Sprite(tex(SYMBOL_TEXTURES[sym][pos]))
          s.x = Math.floor(xCursor)
          stripe.addChild(s)
          xCursor += s.width - 1
        }

        // Target
        const tgt = new Sprite(tex(SYMBOL_TEXTURES[target][pos]))
        tgt.x = Math.floor(xCursor)
        stripe.addChild(tgt)
        xCursor += tgt.width - 1

        // 1 random after
        const after = new Sprite(tex(SYMBOL_TEXTURES[pickRandomSymbol(target)][pos]))
        after.x = Math.floor(xCursor)
        stripe.addChild(after)

        // AS3: endX = -stripe.width + (firstChild.width * 1.5) + 2
        const stripeW = Math.floor(xCursor) + after.width
        const firstW = (stripe.getChildAt(0) as Sprite).width
        const endX = -stripeW + firstW * 1.5 + 2

        stripeAnimsRef.current[pos] = {
          startX: 0, endX,
          duration: 1 + Math.random() * 1.5,
          elapsed: 0, done: false,
        }
      } else {
        // Right-scrolling (middle): symbols extend left, tween scrolls right
        // AS3: each symbol at x = -stripe.width + (X2_texture.width / 2)
        // stripe.width = auto-computed bounds (rightEdge - leftEdge)

        const bell = new Sprite(tex(SYMBOL_TEXTURES.SLOT_BELL[pos]))
        bell.x = 0
        stripe.addChild(bell)

        // AS3 uses X2 middle texture width / 2 as the half-width reference
        const refHalfW = symbolWidth('x', pos) / 2

        // Track bounds like AS3 container auto-width
        const rightEdge = bell.width // stays constant (bell at x=0)
        let leftEdge = 0
        const getWidth = () => rightEdge - leftEdge

        const addMiddleSymbol = (sym: SlotSymbol) => {
          const s = new Sprite(tex(SYMBOL_TEXTURES[sym][pos]))
          s.x = -getWidth() + refHalfW
          stripe.addChild(s)
          if (s.x < leftEdge) leftEdge = s.x
          return s
        }

        // 5 random (last can't match target)
        for (let r = 0; r < RANDOM_BEFORE; r++) {
          const sym = pickRandomSymbol(r === RANDOM_BEFORE - 1 ? target : ('' as SlotSymbol))
          addMiddleSymbol(sym)
        }

        // Target
        addMiddleSymbol(target)

        // 1 random after
        addMiddleSymbol(pickRandomSymbol(target))

        // AS3: endX = +stripe.width - (firstChild.width * 1.5) + 2
        const firstW = bell.width
        const endX = getWidth() - firstW * 1.5 + 2

        stripeAnimsRef.current[pos] = {
          startX: 0, endX,
          duration: 1 + Math.random() * 1.5,
          elapsed: 0, done: false,
        }
      }

      stripe.x = 0
    }

    phaseRef.current = 'spinning'
    remainingSpinsRef.current = 3
  }, [])

  useTick((ticker) => {
    // Bell frame visibility based on hits
    const bellFrames = bellFramesRef.current
    for (let i = 0; i < bellFrames.length; i++) {
      bellFrames[i].visible = bellsRevealed <= i
    }

    // Detect new spin trigger
    if (spinSymbols && spinSymbols !== lastSpinSymbolsRef.current && phaseRef.current === 'idle') {
      lastSpinSymbolsRef.current = spinSymbols
      startSpin(spinSymbols)
    }
    if (!spinSymbols) {
      lastSpinSymbolsRef.current = null
    }

    // Spin animation
    if (phaseRef.current === 'spinning') {
      const dt = ticker.deltaMS / 1000
      const stripes = stripesRef.current
      if (!stripes) return

      for (let i = 0; i < 3; i++) {
        const anim = stripeAnimsRef.current[i]
        if (!anim || anim.done) continue

        anim.elapsed += dt
        const t = Math.min(anim.elapsed / anim.duration, 1)
        stripes[i].x = anim.startX + (anim.endX - anim.startX) * easeOutQuint(t)

        if (t >= 1) {
          anim.done = true
          remainingSpinsRef.current--
          if (remainingSpinsRef.current <= 0) {
            phaseRef.current = 'result'
            onSpinCompleteRef.current?.()
          }
        }
      }
    }

    // Win blink
    const winBlink = winBlinkRef.current
    if (winBlink) {
      if (blinking) {
        blinkTimerRef.current += ticker.deltaMS
        if (blinkTimerRef.current >= BLINK_INTERVAL_MS) {
          blinkTimerRef.current = 0
          winBlink.visible = !winBlink.visible
        }
      } else {
        winBlink.visible = false
        blinkTimerRef.current = 0
      }
    }
  })

  // Reset stripes on new round (spinSymbols goes null)
  useEffect(() => {
    if (spinSymbols === null && phaseRef.current !== 'idle') {
      phaseRef.current = 'idle'
      const stripes = stripesRef.current
      if (stripes) {
        for (let i = 0; i < 3; i++) {
          while (stripes[i].children.length > 0) stripes[i].removeChildAt(0)
          const bellSprite = new Sprite(tex(SYMBOL_TEXTURES.SLOT_BELL[i]))
          stripes[i].addChild(bellSprite)
          stripes[i].x = 0
        }
      }
    }
  }, [spinSymbols])

  return <pixiContainer ref={containerRef} x={BELL_PANEL_X} y={BELL_PANEL_Y} />
}
