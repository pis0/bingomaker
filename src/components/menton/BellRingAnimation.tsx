import { useRef, useEffect } from 'react'
import { Container, Sprite, AnimatedSprite } from 'pixi.js'
import { extend, useTick } from '@pixi/react'
import { texFrom, texturesFrom } from '../../assets/atlas'
import { CARD_PANEL_X, CARD_PANEL_Y, BELL_PANEL_CENTER_X, BELL_PANEL_CENTER_Y } from './layoutConstants'

extend({ Container })

const BELL_ATLAS = 'menton_bell'

// AS3: bellAnima at (256, 96) in CardPanel local space
const ANIM_X = CARD_PANEL_X + 256
const ANIM_Y = CARD_PANEL_Y + 96

// AS3: bellImage at (320, 130) in CardPanel local space, rotation 0.4
const IMAGE_START_X = CARD_PANEL_X + 320
const IMAGE_START_Y = CARD_PANEL_Y + 130

// Fly destination: BellPanel center
const IMAGE_END_X = BELL_PANEL_CENTER_X
const IMAGE_END_Y = BELL_PANEL_CENTER_Y

const IMAGE_ROTATION = 0.4
const FLY_DURATION = 0.6
// AS3: AssukarMovieClip default fps = 30, playAnima(bellAnima, 5 loops, callback)
const ANIM_FPS = 30
const ANIM_LOOPS = 5

type Phase = 'idle' | 'ringing' | 'flying'

interface Props {
  active: boolean
  onComplete?: () => void
}

export default function BellRingAnimation({ active, onComplete }: Props) {
  const containerRef = useRef<Container>(null)
  const built = useRef(false)
  const animRef = useRef<AnimatedSprite | null>(null)
  const imageRef = useRef<Sprite | null>(null)
  const phaseRef = useRef<Phase>('idle')
  const loopCountRef = useRef(0)
  const flyElapsedRef = useRef(0)
  const onCompleteRef = useRef(onComplete)
  const wasActiveRef = useRef(false)

  useEffect(() => { onCompleteRef.current = onComplete })

  // Build display objects
  useEffect(() => {
    const root = containerRef.current
    if (!root || built.current) return
    built.current = true

    // sino_brilho animated sprite (11 frames)
    const frames = texturesFrom(BELL_ATLAS, 'sino_brilho')
    if (frames.length === 0) return

    const anim = new AnimatedSprite(frames)
    anim.anchor.set(0.5)
    anim.x = ANIM_X
    anim.y = ANIM_Y
    anim.animationSpeed = ANIM_FPS / 60
    anim.loop = true
    anim.visible = false
    root.addChild(anim)
    animRef.current = anim

    // Sino static image (flies to BellPanel)
    const sinoTex = texFrom(BELL_ATLAS, 'Sino')
    const image = new Sprite(sinoTex)
    image.anchor.set(0.5)
    image.x = IMAGE_START_X
    image.y = IMAGE_START_Y
    image.rotation = IMAGE_ROTATION
    image.visible = false
    root.addChild(image)
    imageRef.current = image
  }, [])

  useTick((ticker) => {
    // Detect rising edge of active
    if (active && !wasActiveRef.current) {
      wasActiveRef.current = true
      startRinging()
    }
    if (!active && wasActiveRef.current) {
      wasActiveRef.current = false
    }

    // Flying phase
    if (phaseRef.current === 'flying') {
      const image = imageRef.current
      if (!image) return

      flyElapsedRef.current += ticker.deltaMS / 1000
      const t = Math.min(flyElapsedRef.current / FLY_DURATION, 1)
      // easeOut (AS3 default tween)
      const e = 1 - (1 - t) ** 2

      image.x = IMAGE_START_X + (IMAGE_END_X - IMAGE_START_X) * e
      image.y = IMAGE_START_Y + (IMAGE_END_Y - IMAGE_START_Y) * e

      if (t >= 1) {
        image.visible = false
        phaseRef.current = 'idle'
        onCompleteRef.current?.()
      }
    }
  })

  function startRinging() {
    const anim = animRef.current
    if (!anim) {
      // No animation frames, skip directly
      onCompleteRef.current?.()
      return
    }

    phaseRef.current = 'ringing'
    loopCountRef.current = 0
    anim.visible = true
    anim.gotoAndPlay(0)
    anim.onLoop = () => {
      loopCountRef.current++
      if (loopCountRef.current >= ANIM_LOOPS) {
        anim.stop()
        anim.visible = false
        startFlying()
      }
    }
  }

  function startFlying() {
    const image = imageRef.current
    if (!image) {
      phaseRef.current = 'idle'
      onCompleteRef.current?.()
      return
    }

    phaseRef.current = 'flying'
    flyElapsedRef.current = 0
    image.x = IMAGE_START_X
    image.y = IMAGE_START_Y
    image.rotation = IMAGE_ROTATION
    image.visible = true
  }

  return <pixiContainer ref={containerRef} />
}
