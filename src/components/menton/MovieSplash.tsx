/**
 * MovieSplash — prize celebration animation in the BallPanel pipoqueira area.
 *
 * AS3: com.assukar.praia.menton.components.balls.MovieSplash
 * Position: x:406, y:62 inside extraBallsFrontContainer
 *
 * Triggered by RoundMotion when patterns ≥ DOUBLE_LINE are completed.
 * Shows: rolling ball with number + juice splash + prize text with mask reveal.
 *
 * Animation sequence (play()):
 *   0.0s: ballContainer appears at x:-323, squishes (scaleY:0.6)
 *   0.2s: ball rolls to x:-260, juice splash plays, label mask reveals (0.2s)
 *         ball tweens to x:260 (0.2s easeInOutSine), then drifts to x:280 (1.5s, rot:0.3)
 *   2.5s: label fades out (0.2s)
 *   2.7s: ball exits to x:550 (0.2s, rot:0.6) → reset
 *   Total: ~2.9s
 *
 * Text: Iowan Black 56px, dark brown 0x340100, autoScale
 * Ball: bigball 138×138, scale 0.65, with number text (Iowan Black 75px)
 */
import { useRef, useCallback, useImperativeHandle, forwardRef, useEffect } from 'react'
import { Container, Sprite, Text, TextStyle, Ticker, Assets, Spritesheet, Texture } from 'pixi.js'
import { extend } from '@pixi/react'
import { tex } from '../../assets/atlas'
import { loadMovieBytes } from '../../animations/loadMovieBytes'
import { MovieBytesPlayer } from '../../animations/MovieBytesPlayer'

extend({ Container, Sprite, Text })

const SPLASH_BYTES_URL = '/assets/menton/movies/juicesplash.bytes'
// AS3: AssukarMovieBytes with movieScale=0 → defaults to PRAIA_GAME_CONTAINER_SCALE
const MOVIE_SCALE = 0.41667

/** Resolve texture — juice_* sprites in menton_ballpanel atlas */
function getTexture(name: string): Texture {
  const sheet = Assets.get<Spritesheet>('menton_ballpanel')
  if (sheet?.textures[name]) return sheet.textures[name]
  console.warn(`[MovieSplash] texture "${name}" not found`)
  return Texture.EMPTY
}

// AS3: label — Iowan Black 56px, dark brown, autoScale within 430×80
const labelStyle = new TextStyle({
  fontFamily: '"Iowan Old Style Black", Georgia, serif',
  fontSize: 56,
  fill: 0x340100,
})

// AS3: ball number — Iowan Black 75px, dark brown
const ballNumberStyle = new TextStyle({
  fontFamily: '"Iowan Old Style Black", Georgia, serif',
  fontSize: 75,
  fill: 0x4d371e,
  letterSpacing: -2,
})

// Max label width before auto-scale (AS3: addText(430, 80, ..., autoScale:true))
const LABEL_MAX_W = 430

function easeInOutSine(t: number): number {
  return -(Math.cos(Math.PI * t) - 1) / 2
}

export interface MovieSplashHandle {
  play: (text: string, ballNumber: string, onComplete?: () => void) => void
}

/**
 * MovieSplash renders within the BallPanel pipoqueira area.
 * Controlled imperatively via ref.play(text, ballNumber, onComplete).
 */
const MovieSplash = forwardRef<MovieSplashHandle>(function MovieSplash(_props, ref) {
  const containerRef = useRef<Container>(null)
  const ballContainerRef = useRef<Container>(null)
  const labelRef = useRef<Text>(null)
  const ballTextRef = useRef<Text>(null)
  const movieRef = useRef<MovieBytesPlayer | null>(null)
  const cleanupRef = useRef<(() => void) | null>(null)

  // Load juicesplash.bytes on mount — adds player container behind label/ball
  useEffect(() => {
    let disposed = false
    loadMovieBytes(SPLASH_BYTES_URL).then((data) => {
      if (disposed) return
      const player = new MovieBytesPlayer(data, getTexture, { scale: MOVIE_SCALE })
      movieRef.current = player
      player.container.visible = false
      if (containerRef.current) {
        // Insert at index 0 so it renders behind label and ball
        containerRef.current.addChildAt(player.container, 0)
      }
    })
    return () => {
      disposed = true
      movieRef.current?.destroy()
      movieRef.current = null
    }
  }, [])

  const reset = useCallback(() => {
    const ball = ballContainerRef.current
    const label = labelRef.current
    if (ball) {
      ball.visible = false
      ball.x = -323
      ball.y = 9
      ball.rotation = 0
      ball.scale.set(0.65)
    }
    if (label) {
      label.visible = false
      label.alpha = 1
      label.x = -260
      label.scale.set(1)
      label.scale.x = 0 // hidden via scaleX (mask reveal substitute)
    }
    const movie = movieRef.current
    if (movie) {
      movie.stop()
      movie.container.visible = false
    }
  }, [])

  const play = useCallback((text: string, ballNumber: string, onComplete?: () => void) => {
    // Cleanup previous animation
    cleanupRef.current?.()

    const ball = ballContainerRef.current
    const label = labelRef.current
    const ballText = ballTextRef.current
    if (!ball || !label || !ballText) return

    // Setup
    reset()
    label.text = text
    // Auto-scale label if too wide
    // Measure natural width at scale 1, then auto-scale if needed
    label.scale.set(1)
    const labelScale = label.width > LABEL_MAX_W ? LABEL_MAX_W / label.width : 1
    label.scale.set(labelScale)
    label.scale.x = 0 // start hidden, reveal via scaleX tween
    ballText.text = ballNumber

    const ticker = Ticker.shared
    let elapsed = 0
    const tweens: { update: (e: number) => boolean }[] = []

    // Helper: create a tween
    const tween = (
      delay: number, duration: number,
      update: (t: number) => void,
      onComplete?: () => void,
      easing?: (t: number) => number,
    ) => {
      tweens.push({
        update: (e: number) => {
          if (e < delay) return false
          const t = Math.min(1, (e - delay) / duration)
          const et = easing ? easing(t) : t
          update(et)
          if (t >= 1) { onComplete?.(); return true }
          return false
        }
      })
    }

    // Phase 1 (0-0.2s): Ball appears, squishes, rolls to x:-260
    ball.visible = true
    ball.x = -323
    ball.scale.set(0.65)
    tween(0, 0.2, (t) => {
      ball.x = -323 + (-260 - (-323)) * t
      ball.scale.y = 0.65 + (0.6 - 0.65) * t
    }, () => {
      // Phase 2 starts: show movie + label
      label.visible = true
      const movie = movieRef.current
      if (movie) {
        movie.container.visible = true
        movie.play({ fps: 45, repeatCount: 1 })
      }

      // Label reveal via scaleX (0.1s delay, 0.2s duration)
      tween(0.3, 0.2, (t) => {
        label.scale.x = labelScale * t
      })

      // Label drift (0.28s delay, 2s drift)
      tween(0.48, 2, (t) => {
        label.x = -260 + (-250 - (-260)) * t
      })

      // Ball roll to center (0.2s, easeInOutSine)
      tween(0.2, 0.2, (t) => {
        ball.x = -260 + (260 - (-260)) * t
        ball.scale.y = 0.6 + (1 - 0.6) * t
        ball.scale.x = 0.65 + (1 - 0.65) * t
      }, undefined, easeInOutSine)

      // Ball drift right + rotate (0.29s delay, 1.5s)
      tween(0.49, 1.5, (t) => {
        ball.x = 260 + (280 - 260) * t
        ball.rotation = 0.3 * t
      })

      // Label fade out (2.5s delay, 0.2s)
      tween(2.7, 0.2, (t) => {
        label.alpha = 1 - t
      })

      // Ball exit (2.7s delay, 0.2s)
      tween(2.9, 0.2, (t) => {
        ball.x = 280 + (550 - 280) * t
        ball.rotation = 0.3 + (0.6 - 0.3) * t
      }, () => {
        reset()
        onComplete?.()
      })
    })

    const onTick = () => {
      elapsed += ticker.deltaMS / 1000
      // Run all active tweens, remove completed ones
      for (let i = tweens.length - 1; i >= 0; i--) {
        if (tweens[i].update(elapsed)) {
          tweens.splice(i, 1)
        }
      }
      // All done
      if (tweens.length === 0 && elapsed > 3.2) {
        ticker.remove(onTick)
      }
    }

    ticker.add(onTick)
    cleanupRef.current = () => {
      ticker.remove(onTick)
      tweens.length = 0
      reset()
    }
  }, [reset])

  useImperativeHandle(ref, () => ({ play }), [play])

  return (
    <pixiContainer ref={containerRef} x={406} y={62}>
      {/* Juice splash MovieBytes — loaded imperatively, inserted at index 0 (behind label/ball) */}

      {/* Prize text label — revealed via scaleX 0→1 (AS3 used mask, we use scale) */}
      <pixiText
        ref={labelRef}
        text=""
        style={labelStyle}
        x={-260}
        y={-45}
        visible={false}
      />

      {/* Ball container — bigball + number text, centerPivots */}
      <pixiContainer
        ref={ballContainerRef}
        x={-323}
        y={9}
        scale={0.65}
        visible={false}
      >
        <pixiSprite texture={tex('bigball')} anchor={0.5} />
        <pixiText
          ref={ballTextRef}
          text=""
          style={ballNumberStyle}
          anchor={0.5}
        />
      </pixiContainer>
    </pixiContainer>
  )
})

export default MovieSplash
