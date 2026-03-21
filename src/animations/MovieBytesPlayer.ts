import { Container, Sprite, Texture, Ticker } from 'pixi.js'
import type { MovieBytesData, FrameObject } from './parseMovieBytes'

/**
 * PixiJS player for AssukarMovieBytes animations.
 *
 * Creates a Container with pre-allocated Sprites for each texture instance
 * and applies per-frame matrix transforms + alpha from parsed data.
 *
 * The `scale` option maps Flash authoring coordinates to game coordinates
 * by scaling tx/ty values (same as AS3 AssukarMovieBytes.gotoFrame).
 * Matrix a/b/c/d are applied as-is from the binary data.
 *
 * Usage:
 *   const data = await parseMovieBytes(buffer)
 *   const player = new MovieBytesPlayer(data, name => Assets.get(name), { scale: 0.41667 })
 *   parent.addChild(player.container)
 *   player.play({ fps: 30, onComplete: () => { ... } })
 */

export interface PlayOptions {
  fps?: number
  /** Number of times to play. Default = 1. Use Infinity for loop. */
  repeatCount?: number
  onComplete?: () => void
  onUpdate?: (frame: number) => void
}

export class MovieBytesPlayer {
  readonly container: Container
  readonly data: MovieBytesData

  private sprites: Sprite[][] = []  // [textureIdx][instanceIdx]
  private flatSprites: Sprite[] = []
  private _currentFrame = 0
  private _playing = false
  private _ticker: Ticker | null = null
  private _elapsed = 0
  private _repeatCount = 1
  private _playCount = 0
  private _fps = 30
  private _onComplete: (() => void) | null = null
  private _onUpdate: ((frame: number) => void) | null = null
  private _scale = 1
  private _texScale = 1
  private _offsetX = 0
  private _offsetY = 0
  private _checkIndex = false

  constructor(
    data: MovieBytesData,
    getTexture: (name: string) => Texture,
    options?: {
      /**
       * Scale applied to tx/ty values (AS3 movieScale).
       * Maps Flash authoring coordinates → game coordinates.
       * For Praia games: 0.41667 (PRAIA_GAME_CONTAINER_SCALE).
       */
      scale?: number
      /**
       * Atlas pre-scale factor. When atlas sprites are pre-scaled
       * (e.g., 0.5 means sprites are at half authoring resolution),
       * a/b/c/d are divided by this to compensate. Default = 1 (no compensation).
       */
      textureScale?: number
      /** Offset added to raw tx before scaling. */
      offsetX?: number
      /** Offset added to raw ty before scaling. */
      offsetY?: number
      /** Reorder sprites per frame to match Flash timeline z-order. */
      checkIndex?: boolean
    },
  ) {
    this.data = data
    this.container = new Container()
    this._scale = options?.scale ?? 1
    this._texScale = options?.textureScale ?? 1
    this._offsetX = options?.offsetX ?? 0
    this._offsetY = options?.offsetY ?? 0
    this._checkIndex = options?.checkIndex ?? false

    // Pre-allocate sprites for each texture instance
    for (const entry of data.textures) {
      if (entry.name.startsWith('ankor_')) {
        // Text fields — skip for now (push empty array to keep indices aligned)
        this.sprites.push([])
        continue
      }

      const tex = getTexture(entry.name)
      const instances: Sprite[] = []
      for (let j = 0; j < entry.instanceCount; j++) {
        const sprite = new Sprite(tex)
        sprite.visible = false
        this.container.addChild(sprite)
        instances.push(sprite)
        this.flatSprites.push(sprite)
      }
      this.sprites.push(instances)
    }

    // Show first frame
    if (data.totalFrames > 0) {
      this.gotoFrame(1)
    }
  }

  get currentFrame(): number { return this._currentFrame }
  get totalFrames(): number { return this.data.totalFrames }
  get isPlaying(): boolean { return this._playing }

  /** movieScale — controls full matrix scaling. Settable at runtime for debug. */
  set scale(v: number) {
    this._scale = v
    // Re-apply current frame so the change is visible immediately
    if (this._currentFrame > 0) {
      const objects = this.data.frames[this._currentFrame]
      if (objects) {
        for (const s of this.flatSprites) s.visible = false
        this._applyFrame(objects)
      }
    }
  }
  get scale(): number { return this._scale }

  /** Jump to a specific frame (1-indexed). */
  gotoFrame(frame: number): void {
    if (frame < 1 || frame > this.data.totalFrames) return
    if (frame === this._currentFrame) return
    this._currentFrame = frame

    // Hide all sprites
    for (const s of this.flatSprites) s.visible = false

    const objects = this.data.frames[frame]
    if (!objects) return

    this._applyFrame(objects)
  }

  private _applyFrame(objects: FrameObject[]): void {
    const scale = this._scale
    const ox = this._offsetX
    const oy = this._offsetY

    for (let i = objects.length - 1; i >= 0; i--) {
      const obj = objects[i]
      if (obj.isTextField) continue

      const texIdx = this._texIdxByName(obj.textureName)
      if (texIdx === -1) continue

      const instances = this.sprites[texIdx]
      const sprite = instances[obj.instanceIndex]
      if (!sprite) continue

      sprite.alpha = obj.alpha

      if (obj.alpha <= 0.01) {
        sprite.visible = false
      } else {
        sprite.visible = true
        const m = sprite.localTransform
        // a/b/c/d: compensate for pre-scaled atlas sprites (1/textureScale)
        // tx/ty: map authoring coords → game coords (movieScale)
        const texComp = 1 / this._texScale
        m.a = obj.a * texComp
        m.b = obj.b * texComp
        m.c = obj.c * texComp
        m.d = obj.d * texComp
        m.tx = (obj.tx + ox) * scale
        m.ty = (obj.ty + oy) * scale
        sprite.setFromMatrix(m)

        // AS3 checkIndex: addChildAt(obj, 0) in forward iteration
        // = first object in binary ends at top of display list
        if (this._checkIndex) {
          this.container.addChildAt(sprite, 0)
        }
      }
    }
  }

  // Texture name → index lookup (cached)
  private _nameToIdx: Map<string, number> | null = null
  private _texIdxByName(name: string): number {
    if (!this._nameToIdx) {
      this._nameToIdx = new Map()
      for (let i = 0; i < this.data.textures.length; i++) {
        this._nameToIdx.set(this.data.textures[i].name, i)
      }
    }
    return this._nameToIdx.get(name) ?? -1
  }

  /** Start playback from frame 1. */
  play(options?: PlayOptions): void {
    if (this._playing) this.stop()

    this._fps = options?.fps ?? 30
    this._repeatCount = options?.repeatCount ?? 1
    this._onComplete = options?.onComplete ?? null
    this._onUpdate = options?.onUpdate ?? null
    this._playCount = 0
    this._elapsed = 0

    this.gotoFrame(1)
    this._currentFrame = 1

    this._ticker = Ticker.shared
    this._ticker.add(this._tick, this)
    this._playing = true
  }

  /** Stop playback. */
  stop(): void {
    if (this._ticker) {
      this._ticker.remove(this._tick, this)
      this._ticker = null
    }
    this._playing = false
  }

  /** Reset to frame 1 and stop. */
  reset(): void {
    this.stop()
    this._currentFrame = 0
    this.gotoFrame(1)
  }

  private _tick = (ticker: Ticker): void => {
    this._elapsed += ticker.deltaMS
    const frameDuration = 1000 / this._fps
    const targetFrame = Math.floor(this._elapsed / frameDuration) + 1

    if (targetFrame > this.data.totalFrames) {
      // End of one pass
      this.gotoFrame(this.data.totalFrames)
      this._playCount++

      if (this._playCount >= this._repeatCount) {
        this.stop()
        this._onComplete?.()
      } else {
        // Loop: reset elapsed for next pass
        this._elapsed = 0
        this._currentFrame = 0
        this.gotoFrame(1)
      }
    } else if (targetFrame !== this._currentFrame) {
      this.gotoFrame(targetFrame)
      this._onUpdate?.(targetFrame)
    }
  }

  /** Clean up all sprites and stop playback. */
  destroy(): void {
    this.stop()
    this.container.destroy({ children: true })
    this.flatSprites.length = 0
    this.sprites.length = 0
  }
}
