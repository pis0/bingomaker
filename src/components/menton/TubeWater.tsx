import { useCallback, useEffect, useRef, useMemo } from 'react'
import { Container, Graphics, AnimatedSprite, Assets, Texture, Ticker } from 'pixi.js'
import { extend, useTick } from '@pixi/react'
import { tex, textures as getTextures } from '../../assets/atlas'
import { ParticleEmitter } from '../../particles/ParticleEmitter'
import { mentonWater } from '../../particles/configs/menton_water'

extend({ Container, Graphics, AnimatedSprite })

/* ── Water1: vertical liquid column inside pipe ─────────────── */
const W1_CLIP_X = 12
const W1_CLIP_Y = 66
const W1_CLIP_W = 45
const W1_CLIP_H = 413

const W1_COL_X = -6
const W1_START_Y = -680 - 2772 // off-screen above
const W1_END_Y = 520
const W1_ALPHA = 0.25
const W1_DURATION = 3000 // 3s descent

const W1_REVEAL = 200   // 0.2s mask reveal
const W1_RIPPLE = 100   // 0.1s half-period oscillation

const W1_MEIO_COUNT = 10
const W1_MEIO_SPACING = 308

/* ── Water2: horizontal scroll in tank ──────────────────────── */
const W2_X = 11
const W2_Y = 441
const W2_CLIP_X = 4
const W2_CLIP_Y = -10
const W2_CLIP_W = 734
const W2_CLIP_H = 52

const W2_ALPHA = 0.8
const W2_SPEED = 8
const W2_Y0 = 30  // scroll container start Y (within w2 container)
const W2_Y1 = 15  // mid tween target
const W2_PH1 = 2555  // 2.555s phase 1
const W2_PH2 = 2000  // 2s phase 2

/* ── Splash (Water3) — at tank entry ───────────────────────── */
const SPLASH_X = -2
const SPLASH_Y = -7
const SPLASH_DELAY = 300  // 0.3s after dropWater
const SPLASH_LOOPS = 10

/* ── Gotas final — water drops at pipe exit ────────────────── */
const GOTAS_X = 5
const GOTAS_Y = 67

/** Idle drip: random interval 5-13s, 1 loop of gotas_final */
const IDLE_DRIP_MIN = 5000
const IDLE_DRIP_RANGE = 8000

/* ── Water particle — spray at pipe exit ─────────────────────── */
const PARTICLE_X = 34
const PARTICLE_Y = 77
const PARTICLE_SWITCH_DELAY = 2555 // 2.555s before param switch

interface Props {
  /** One-shot trigger: starts the full water cascade (water1 descent, water2 scroll, splash) */
  active: boolean
  /** Continuous flag: particle emitter runs while true. Gotas plays when transitions to false. */
  flowing?: boolean
  idle?: boolean
}

/**
 * AS3: BallPanelMenton water effects during ball discharge.
 *
 * Water1: Vertical liquid column descends through pipe (3s, alpha 0.25)
 * Water2: Horizontal liquid scrolls in tank (seamless loop, alpha 0.8)
 * Splash: 12-frame animation at tank entry (0.3s delay, 10 loops)
 * Gotas:  15-frame water drops at pipe exit (plays at Water1 descent end)
 */
export default function TubeWater({ active, flowing = active, idle = false }: Props) {
  // Textures
  const tankTex = useMemo(() => tex('liquido_tanque_loop'), [])
  const splashFrames = useMemo(() => getTextures('splash'), [])
  const gotasFrames = useMemo(() => getTextures('gotas_final'), [])

  // Water particle emitter — config held by ref so we can mutate speed/size
  const waterCfg = useRef({ ...mentonWater })
  const waterEmitter = useRef<ParticleEmitter | null>(null)
  if (!waterEmitter.current) {
    const texture = Assets.get<Texture>('menton_water') ?? Texture.WHITE
    waterEmitter.current = new ParticleEmitter(waterCfg.current, texture)
    waterEmitter.current.emitterX = PARTICLE_X
    waterEmitter.current.emitterY = PARTICLE_Y
  }

  // Masks (off-screen Graphics, not in display tree)
  const w1Mask = useRef(new Graphics())
  const w2Mask = useRef(new Graphics())

  // Display object refs
  const w1ColumnRef = useRef<Container>(null)
  const w2ScrollRef = useRef<Container>(null)
  const splashRef = useRef<AnimatedSprite>(null)
  const gotasRef = useRef<AnimatedSprite>(null)

  // Animation state machine
  const st = useRef({
    running: false,
    t0: 0,
    // Water1
    w1Done: false,
    // Water2
    w2Phase: 0 as 0 | 1 | 2,
    w2t0: 0,
    texW: 742,
    // Splash
    splashFired: false,
    splashLoops: 0,
    // Gotas
    gotasFired: false,
    gotasLoops: 0,
    gotasTarget: 1,
    // Idle drip
    idleActive: false,
    idleNextDrip: 0,
    // Water particle
    particleSwitched: false,
  })

  // Setup Water1 mask on container mount
  // Mask must be a child of the container so its coordinates are in local space
  // (otherwise Graphics at global origin makes the clip 220px too high)
  const setupW1 = useCallback((c: Container | null) => {
    if (c) {
      const g = w1Mask.current
      g.clear()
      g.rect(W1_CLIP_X, W1_CLIP_Y, W1_CLIP_W, W1_CLIP_H)
      g.fill(0xffffff)
      c.addChild(g)
      c.mask = g
    }
  }, [])

  // Setup Water2 mask (static clip)
  const setupW2 = useCallback((c: Container | null) => {
    if (c) {
      const g = w2Mask.current
      g.clear()
      g.rect(W2_CLIP_X, W2_CLIP_Y, W2_CLIP_W, W2_CLIP_H)
      g.fill(0xffffff)
      c.addChild(g)
      c.mask = g
    }
  }, [])

  // Idle drip cycle — gotas_final plays every 5-13s during idle
  useEffect(() => {
    const s = st.current
    if (idle && !active) {
      s.idleActive = true
      s.idleNextDrip = performance.now() + IDLE_DRIP_MIN + Math.random() * IDLE_DRIP_RANGE
    } else {
      s.idleActive = false
      if (gotasRef.current && !active) {
        gotasRef.current.visible = false
        gotasRef.current.stop()
      }
    }
  }, [idle, active])

  // Trigger cascade (one-shot) — water1 descent, water2 scroll, splash
  useEffect(() => {
    const s = st.current
    if (active) {
      const now = performance.now()
      s.running = true
      s.t0 = now
      s.w1Done = false
      s.w2Phase = 0
      s.w2t0 = now
      s.texW = tankTex.width
      s.splashFired = false
      s.splashLoops = 0
      s.gotasFired = false
      s.gotasLoops = 0
      s.gotasTarget = Math.random() < 0.5 ? 2 : 1
      s.particleSwitched = false

      // Reset positions
      if (w1ColumnRef.current) w1ColumnRef.current.y = W1_START_Y
      if (w2ScrollRef.current) {
        w2ScrollRef.current.x = -s.texW
        w2ScrollRef.current.y = W2_Y0
      }
      if (splashRef.current) {
        splashRef.current.visible = false
        splashRef.current.stop()
      }
      if (gotasRef.current) {
        gotasRef.current.visible = false
        gotasRef.current.stop()
      }
    } else {
      s.running = false
      // Full reset on round end — kill everything
      waterEmitter.current?.reset()
      if (splashRef.current) { splashRef.current.visible = false; splashRef.current.stop() }
      if (gotasRef.current) { gotasRef.current.visible = false; gotasRef.current.stop() }
      // Reset Water1 mask
      const g1 = w1Mask.current
      g1.clear()
      g1.rect(W1_CLIP_X, W1_CLIP_Y, W1_CLIP_W, W1_CLIP_H)
      g1.fill(0xffffff)
      if (w1ColumnRef.current) w1ColumnRef.current.y = W1_START_Y
      if (w2ScrollRef.current) {
        w2ScrollRef.current.x = -s.texW
        w2ScrollRef.current.y = W2_Y0
      }
    }
  }, [active, tankTex])

  // Particle emitter + gotas — driven by flowing prop
  const cascadeStartedRef = useRef(false)
  useEffect(() => {
    const em = waterEmitter.current
    if (flowing) {
      if (!cascadeStartedRef.current) {
        // First discharge — full particle spray (cascade handles water1/water2/splash)
        cascadeStartedRef.current = true
        const cfg = waterCfg.current
        cfg.speed = 700
        cfg.startSize = 50
        if (em) {
          em.emitterXVariance = 10
          em.stop()
          em.start(Ticker.shared)
        }
        st.current.particleSwitched = false
      } else {
        // Resume after halt — only light ending particles + gotas
        const cfg = waterCfg.current
        cfg.speed = 200
        cfg.startSize = 12
        if (em) {
          em.emitterXVariance = 16
          em.stop()
          em.start(Ticker.shared)
        }
        const gotas = gotasRef.current
        if (gotas) {
          gotas.visible = true
          gotas.gotoAndPlay(0)
        }
      }
    } else if (active) {
      // Halt/pause — stop emitting (existing particles fade), play gotas
      em?.stop()
      const gotas = gotasRef.current
      if (gotas) {
        gotas.visible = true
        gotas.gotoAndPlay(0)
        st.current.gotasFired = true
        st.current.gotasLoops = 0
        st.current.gotasTarget = 1
      }
    }
  }, [flowing, active])

  // Reset cascade flag when round ends
  useEffect(() => {
    if (!active) cascadeStartedRef.current = false
  }, [active])

  // Per-frame animation
  useTick(() => {
    const s = st.current
    const now = performance.now()

    /* ── Idle drip: random drops every 5-13s ─── */
    if (s.idleActive && gotasRef.current) {
      const g = gotasRef.current
      if (now >= s.idleNextDrip && !g.playing) {
        if (!g.visible) {
          // Start drip
          g.visible = true
          g.gotoAndPlay(0)
        } else {
          // Drip finished → schedule next
          g.visible = false
          s.idleNextDrip = now + IDLE_DRIP_MIN + Math.random() * IDLE_DRIP_RANGE
        }
      }
    }

    if (!s.running) return
    const e = now - s.t0

    /* ── Water1: column descent (3s linear) ─── */
    const col = w1ColumnRef.current
    if (col && !s.w1Done) {
      const t = Math.min(e / W1_DURATION, 1)
      col.y = W1_START_Y + (W1_END_Y - W1_START_Y) * t
      if (t >= 1) {
        col.y = W1_END_Y
        s.w1Done = true
        // Trigger gotas final
        const gotas = gotasRef.current
        if (gotas && !s.gotasFired) {
          s.gotasFired = true
          gotas.visible = true
          gotas.gotoAndPlay(0)
        }
      }
    }

    /* ── Water1 mask: reveal (0.2s) then ripple ─── */
    const g1 = w1Mask.current
    let cx = W1_CLIP_X, cw = W1_CLIP_W
    if (e < W1_REVEAL) {
      // Reveal: width 0→45, x 23→12
      const t = e / W1_REVEAL
      cx = 23 + (W1_CLIP_X - 23) * t
      cw = W1_CLIP_W * t
    } else {
      // Ripple: oscillate width 45↔35, x 12↔17
      const ripple = (e - W1_REVEAL) / W1_RIPPLE
      const wave = Math.sin(ripple * Math.PI)
      cx = W1_CLIP_X + 2.5 * (1 + wave)
      cw = W1_CLIP_W - 5 * (1 + wave)
    }
    g1.clear()
    g1.rect(cx, W1_CLIP_Y, Math.max(cw, 0), W1_CLIP_H)
    g1.fill(0xffffff)

    /* ── Water particle: switch to slower params after 2.555s ─── */
    if (!s.particleSwitched && e >= PARTICLE_SWITCH_DELAY) {
      s.particleSwitched = true
      waterCfg.current.speed = 200
      waterCfg.current.startSize = 12
      if (waterEmitter.current) waterEmitter.current.emitterXVariance = 16
    }

    /* ── Water2: horizontal scroll ─── */
    const scroll = w2ScrollRef.current
    if (scroll && s.w2Phase < 2) {
      // Seamless horizontal scroll
      scroll.x += W2_SPEED
      if (scroll.x >= 0) scroll.x = -s.texW

      // Y tween: phase 0 (30→15 over 2.555s), phase 1 (15→30 over 2s)
      if (s.w2Phase === 0) {
        const t = Math.min((now - s.w2t0) / W2_PH1, 1)
        scroll.y = W2_Y0 + (W2_Y1 - W2_Y0) * t
        if (t >= 1) { s.w2Phase = 1; s.w2t0 = now }
      } else if (s.w2Phase === 1) {
        const t = Math.min((now - s.w2t0) / W2_PH2, 1)
        scroll.y = W2_Y1 + (W2_Y0 - W2_Y1) * t
        if (t >= 1) { s.w2Phase = 2 }
      }
    }

    /* ── Splash: trigger after delay, play N loops ─── */
    const splash = splashRef.current
    if (splash && !s.splashFired && e >= SPLASH_DELAY) {
      s.splashFired = true
      s.splashLoops = 0
      splash.visible = true
      splash.gotoAndPlay(0)
    }
    // Replay until loop count reached
    if (splash?.visible && s.splashFired && !splash.playing) {
      s.splashLoops++
      if (s.splashLoops < SPLASH_LOOPS) {
        splash.gotoAndPlay(0)
      } else {
        splash.visible = false
      }
    }

    /* ── Gotas: play 1-2 loops at descent end ─── */
    const gotas = gotasRef.current
    if (gotas?.visible && s.gotasFired && !gotas.playing) {
      s.gotasLoops++
      if (s.gotasLoops < s.gotasTarget) {
        gotas.gotoAndPlay(0)
      } else {
        gotas.visible = false
      }
    }

  })

  // Splash AnimatedSprite ref callback
  const onSplashCreated = useCallback((inst: AnimatedSprite | null) => {
    splashRef.current = inst
    if (inst) {
      inst.animationSpeed = 1 // 60fps
      inst.loop = false
      inst.visible = false
    }
  }, [])

  // Gotas AnimatedSprite ref callback
  const onGotasCreated = useCallback((inst: AnimatedSprite | null) => {
    gotasRef.current = inst
    if (inst) {
      inst.animationSpeed = 0.5 // 30fps
      inst.loop = false
      inst.visible = false
    }
  }, [])

  // Water particle container setup — add emitter's Container to display tree
  const setupParticle = useCallback((c: Container | null) => {
    if (c && waterEmitter.current) c.addChild(waterEmitter.current.container)
  }, [])

  // Cleanup GPU resources on unmount
  useEffect(() => {
    return () => {
      waterEmitter.current?.destroy()
      waterEmitter.current = null
      w1Mask.current.destroy()
      w2Mask.current.destroy()
    }
  }, [])

  return (
    <pixiContainer>
      {/* Water particle: spray at pipe exit (AS3: particlesContainer1, behind water) */}
      <pixiContainer ref={setupParticle} />
      {/* Water1: vertical liquid column with animated mask */}
      <pixiContainer ref={setupW1}>
        <pixiContainer ref={w1ColumnRef} x={W1_COL_X} alpha={W1_ALPHA} y={W1_START_Y}>
          <pixiSprite texture={tex('liquido_fim')} y={-40} />
          {Array.from({ length: W1_MEIO_COUNT }, (_, i) => (
            <pixiSprite key={i} texture={tex('liquido_meio')} y={200 + W1_MEIO_SPACING * i} />
          ))}
          <pixiSprite texture={tex('liquido_inicio')} y={500 + 2772} />
        </pixiContainer>
      </pixiContainer>
      {/* Gotas final — water drops at pipe exit (outside mask so not clipped) */}
      <pixiAnimatedSprite
        ref={onGotasCreated}
        textures={gotasFrames}
        x={GOTAS_X}
        y={GOTAS_Y}
      />

      {/* Water2: horizontal scroll in tank + Splash */}
      <pixiContainer ref={setupW2} x={W2_X} y={W2_Y}>
        <pixiContainer ref={w2ScrollRef} alpha={W2_ALPHA} x={-tankTex.width} y={W2_Y0}>
          <pixiSprite texture={tankTex} />
          <pixiSprite texture={tankTex} x={tankTex.width} />
        </pixiContainer>
        {/* Splash at tank entry */}
        <pixiAnimatedSprite
          ref={onSplashCreated}
          textures={splashFrames}
          x={SPLASH_X}
          y={SPLASH_Y}
        />
      </pixiContainer>
    </pixiContainer>
  )
}
