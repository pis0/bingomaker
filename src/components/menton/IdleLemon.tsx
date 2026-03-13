import { useRef, useEffect } from 'react'
import { Assets, Container, Sprite, Graphics, Texture, Ticker } from 'pixi.js'
import { extend, useTick } from '@pixi/react'
import { tex } from '../../assets/atlas'
import { ParticleEmitter } from '../../particles/ParticleEmitter'
import { mentonPipoqueiraBbl } from '../../particles/configs/menton_pipoqueira_bbl'

extend({ Container })

// AS3 IdleLemon.loop(): bob ±3px over 2.2s per half-cycle
const BOB_RANGE = 3
const BOB_HALF_PERIOD = 2.2 // seconds per half-cycle (4.4s full cycle)
// AS3: rotation tween runs 3s, triggered each loop() (every 4.4s)
const ROT_DURATION = 3

// Mask dimensions (AS3: quad @ x:-36, y:-48, 96×95)
const MASK_X = -36
const MASK_Y = -48
const MASK_W = 96
const MASK_H = 95

// AS3: blendFactorDestination = Context3DBlendFactor.ONE (additive override at runtime)
// Override: additive blend + boosted alpha/color for PixiJS visual parity with Starling
// Starling's premultiplied-alpha pipeline amplifies additive glow more than PixiJS,
// so we raise base alpha and warm the tint to compensate.
const bubbleConfig = {
  ...mentonPipoqueiraBbl,
  blendFuncDestination: 1,
  maxParticles: 25,
  lifespan: 4,
  lifespanVariance: 1,
  // Tighter horizontal spread to stay within mask (96px wide, centered at x≈12)
  sourcePositionVariance: { x: 40, y: 5 },
  startSize: 10,
  startSizeVariance: 5,
  finishSize: 4,
  finishSizeVariance: 0,
  // Boosted vs legacy — Starling premultiplied-alpha amplifies additive glow more
  startColor: { r: 1, g: 0.85, b: 0.65, a: 0.95 },
  startColorVariance: { r: 0, g: 0.1, b: 0.1, a: 0.05 },
  finishColor: { r: 1, g: 0.6, b: 0.4, a: 0.3 },
  finishColorVariance: { r: 0, g: 0.1, b: 0.1, a: 0.1 },
}

interface Props {
  active: boolean
  x?: number
  y?: number
}

/** AS3: IdleLemon — lemon bobbing in the pipoqueira with bubbles */
export default function IdleLemon({ active, x = 0, y = 0 }: Props) {
  const containerRef = useRef<Container>(null)
  const lemonRef = useRef<Sprite | null>(null)
  const centerYRef = useRef(0)
  const emitterRef = useRef<ParticleEmitter | null>(null)

  // Bob state — AS3: loop() tweens down then up, restarts on full cycle
  const bobTimeRef = useRef(0)
  const bobPhaseRef = useRef<0 | 1>(0) // 0 = going to +3 (down), 1 = going to -3 (up)
  const bobStartYRef = useRef(0) // tween start position

  // Rotation state — AS3: tween from current to random target, 3s, tied to loop()
  const rotTimeRef = useRef(0)
  const rotFromRef = useRef(0)
  const rotTargetRef = useRef(0)
  const rotActiveRef = useRef(false)

  // Build display hierarchy — StrictMode-safe (cleanup tears down, remount rebuilds)
  useEffect(() => {
    const root = containerRef.current
    if (!root) return

    // 1. pipoqueirasuco (juice background) — AS3: centerPivots
    const suco = new Sprite(tex('pipoqueirasuco'))
    suco.anchor.set(0.5)
    root.addChild(suco)

    // 2. pipoqueiralimao (lemon) — AS3: x: bg.x + 13, y: bg.y + 1, centerPivots
    const limao = new Sprite(tex('pipoqueiralimao'))
    limao.anchor.set(0.5)
    limao.x = 13
    limao.y = 1
    root.addChild(limao)
    lemonRef.current = limao
    centerYRef.current = limao.y
    bobStartYRef.current = limao.y

    // Init rotation — AS3: first loop() picks a random target
    rotFromRef.current = 0
    rotTargetRef.current = Math.random() * 0.8
    rotActiveRef.current = true

    // 3. Mask quad — AS3: addQuad(96, 95, 0xff00ff, {x:-36, y:-48})
    const maskGfx = new Graphics()
    maskGfx.rect(MASK_X, MASK_Y, MASK_W, MASK_H)
    maskGfx.fill({ color: 0xffffff })

    // 4. Particle emitter — managed directly (StrictMode-safe)
    const bubbleTex = Assets.get<Texture>('menton_pipoqueira_bbl') ?? Texture.WHITE
    const emitter = new ParticleEmitter(bubbleConfig, bubbleTex)
    // Emit from bottom of mask area — bubbles rise upward through the juice
    // Mask covers (-36,-48) to (60,47); center-x≈12, bottom≈40
    emitter.emitterX = 12
    emitter.emitterY = 40
    emitterRef.current = emitter

    // 5. Masked container for bubbles — AS3: container at (maskk.x, maskk.y)
    // Mask as sibling (not child of maskedContainer) to avoid stencil/additive-blend conflicts
    const maskedContainer = new Container()
    maskedContainer.addChild(emitter.container)
    root.addChild(maskedContainer)
    root.addChild(maskGfx)
    maskedContainer.mask = maskGfx

    // Start emitter
    emitter.start(Ticker.shared)

    return () => {
      emitter.destroy()
      emitterRef.current = null
      lemonRef.current = null
      // Remove all imperative children so remount can rebuild
      while (root.children.length > 0) root.removeChildAt(0)
    }
  }, [])

  // Start/stop emitter based on active prop
  useEffect(() => {
    const emitter = emitterRef.current
    if (!emitter) return
    if (active) {
      emitter.start(Ticker.shared)
    } else {
      emitter.stop()
    }
  }, [active])

  useTick((ticker) => {
    const root = containerRef.current
    if (!root) return

    root.visible = active

    if (!active) return

    const lemon = lemonRef.current
    if (!lemon) return

    const dt = ticker.deltaMS / 1000
    const cy = centerYRef.current

    // --- Bob animation (AS3: loop() → tween to ycenter+3, then ycenter-3, repeat) ---
    bobTimeRef.current += dt
    const bobT = Math.min(bobTimeRef.current / BOB_HALF_PERIOD, 1)

    const bobEndY = bobPhaseRef.current === 0 ? cy + BOB_RANGE : cy - BOB_RANGE
    lemon.y = bobStartYRef.current + (bobEndY - bobStartYRef.current) * bobT

    if (bobT >= 1) {
      bobStartYRef.current = bobEndY
      bobTimeRef.current = 0

      if (bobPhaseRef.current === 1) {
        // Full cycle complete (up phase done) — restart loop()
        bobPhaseRef.current = 0
        // AS3: loop() also starts a new rotation tween from current rotation
        rotFromRef.current = lemon.rotation
        rotTargetRef.current = Math.random() * 0.8
        rotTimeRef.current = 0
        rotActiveRef.current = true
      } else {
        bobPhaseRef.current = 1
      }
    }

    // --- Rotation (AS3: tween from current to random*0.8, 3s linear, per loop cycle) ---
    if (rotActiveRef.current) {
      rotTimeRef.current += dt
      const rotT = Math.min(rotTimeRef.current / ROT_DURATION, 1)
      lemon.rotation = rotFromRef.current + (rotTargetRef.current - rotFromRef.current) * rotT
      if (rotT >= 1) {
        rotActiveRef.current = false
      }
    }
  })

  return <pixiContainer ref={containerRef} x={x} y={y} />
}
