import { Container, Sprite, Texture, Ticker } from 'pixi.js'
import type { ParticleConfig, ParticleColor } from './types'

const DEG2RAD = Math.PI / 180

interface PState {
  sprite: Sprite
  alive: boolean
  age: number
  lifetime: number
  velocityX: number
  velocityY: number
  radialAccel: number
  tangentialAccel: number
  startSize: number
  endSize: number
  startR: number; startG: number; startB: number; startA: number
  endR: number; endG: number; endB: number; endA: number
  rotStart: number
  rotEnd: number
  posX: number
  posY: number
}

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v
}

function vary(base: number, variance: number): number {
  return base + (Math.random() * 2 - 1) * variance
}

function varyColor(base: ParticleColor, variance: ParticleColor) {
  return {
    r: clamp01(vary(base.r, variance.r)),
    g: clamp01(vary(base.g, variance.g)),
    b: clamp01(vary(base.b, variance.b)),
    a: clamp01(vary(base.a, variance.a)),
  }
}

export class ParticleEmitter {
  readonly container: Container
  private states: PState[] = []
  private config: ParticleConfig
  private texture: Texture
  private emitting = false
  private elapsed = 0
  private emitCounter = 0
  private _ticker: Ticker | null = null

  emitterX = 0
  emitterY = 0
  emitterXVariance: number
  emitterYVariance: number

  /** Override config lifespan at runtime (AS3: particle.lifespan = ...) */
  set lifespan(v: number) { this.config.lifespan = v }
  get lifespan(): number { return this.config.lifespan }

  set lifespanVariance(v: number) { this.config.lifespanVariance = v }
  get lifespanVariance(): number { return this.config.lifespanVariance }

  constructor(config: ParticleConfig, texture: Texture) {
    this.config = config
    this.texture = texture
    this.emitterXVariance = config.sourcePositionVariance.x
    this.emitterYVariance = config.sourcePositionVariance.y

    const blendMode = config.blendFuncDestination === 1 ? 'add' : 'normal'

    this.container = new Container()

    // Pre-allocate sprite pool
    for (let i = 0; i < config.maxParticles; i++) {
      const sprite = new Sprite(texture)
      sprite.anchor.set(0.5)
      sprite.alpha = 0
      sprite.scale.set(0)
      sprite.blendMode = blendMode
      this.container.addChild(sprite)
      this.states.push({
        sprite,
        alive: false,
        age: 0, lifetime: 0,
        velocityX: 0, velocityY: 0,
        radialAccel: 0, tangentialAccel: 0,
        startSize: 0, endSize: 0,
        startR: 0, startG: 0, startB: 0, startA: 0,
        endR: 0, endG: 0, endB: 0, endA: 0,
        rotStart: 0, rotEnd: 0,
        posX: 0, posY: 0,
      })
    }
  }

  start(ticker: Ticker): void {
    if (this.emitting) return
    this.emitting = true
    this.elapsed = 0
    this.emitCounter = 0
    // Remove existing listener before adding to avoid accumulation
    if (this._ticker) {
      this._ticker.remove(this._update, this)
    }
    this._ticker = ticker
    ticker.add(this._update, this)
  }

  stop(): void {
    this.emitting = false
  }

  reset(): void {
    this.emitting = false
    for (const s of this.states) {
      if (s.alive) {
        s.alive = false
        s.sprite.alpha = 0
        s.sprite.scale.set(0)
      }
    }
  }

  destroy(): void {
    this.reset()
    if (this._ticker) {
      this._ticker.remove(this._update, this)
      this._ticker = null
    }
    this.container.destroy({ children: true })
  }

  get active(): boolean {
    if (this.emitting) return true
    return this.states.some(s => s.alive)
  }

  private _update(ticker: Ticker): void {
    const dt = ticker.deltaMS / 1000
    const cfg = this.config

    // Emit new particles
    if (this.emitting) {
      if (cfg.duration >= 0) {
        this.elapsed += dt
        if (this.elapsed >= cfg.duration) {
          this.emitting = false
        }
      }

      if (this.emitting) {
        const rate = cfg.maxParticles / Math.max(cfg.lifespan, 0.001)
        this.emitCounter += dt * rate
        while (this.emitCounter >= 1) {
          this._spawn()
          this.emitCounter -= 1
        }
      }
    }

    // Update alive particles
    for (const s of this.states) {
      if (!s.alive) continue

      s.age += dt
      if (s.age >= s.lifetime) {
        s.alive = false
        s.sprite.alpha = 0
        s.sprite.scale.set(0)
        continue
      }

      const t = s.age / s.lifetime

      // Radial vector
      let dx = s.posX
      let dy = s.posY
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist > 0.001) {
        dx /= dist
        dy /= dist
      }

      const radX = dx * s.radialAccel
      const radY = dy * s.radialAccel
      const tanX = -dy * s.tangentialAccel
      const tanY = dx * s.tangentialAccel

      s.velocityX += (radX + tanX + cfg.gravity.x) * dt
      s.velocityY += (radY + tanY + cfg.gravity.y) * dt

      s.posX += s.velocityX * dt
      s.posY += s.velocityY * dt

      s.sprite.x = this.emitterX + s.posX
      s.sprite.y = this.emitterY + s.posY

      // Size
      const size = s.startSize + (s.endSize - s.startSize) * t
      const texW = this.texture.width || 1
      const scale = Math.max(0, size / texW)
      s.sprite.scale.set(scale)

      // Color
      const r = s.startR + (s.endR - s.startR) * t
      const g = s.startG + (s.endG - s.startG) * t
      const b = s.startB + (s.endB - s.startB) * t
      const a = s.startA + (s.endA - s.startA) * t

      s.sprite.tint = ((clamp01(r) * 255) << 16) | ((clamp01(g) * 255) << 8) | (clamp01(b) * 255)
      s.sprite.alpha = clamp01(a)

      // Rotation
      s.sprite.rotation = (s.rotStart + (s.rotEnd - s.rotStart) * t) * DEG2RAD
    }
  }

  private _spawn(): void {
    const s = this.states.find(s => !s.alive)
    if (!s) return

    const cfg = this.config
    s.alive = true
    s.age = 0
    s.lifetime = Math.max(0.001, vary(cfg.lifespan, cfg.lifespanVariance))

    s.posX = vary(0, this.emitterXVariance)
    s.posY = vary(0, this.emitterYVariance)

    s.sprite.x = this.emitterX + s.posX
    s.sprite.y = this.emitterY + s.posY

    const angle = vary(cfg.angle, cfg.angleVariance) * DEG2RAD
    const speed = vary(cfg.speed, cfg.speedVariance)
    s.velocityX = Math.cos(angle) * speed
    s.velocityY = -Math.sin(angle) * speed

    s.radialAccel = vary(cfg.radialAcceleration, cfg.radialAccelVariance)
    s.tangentialAccel = vary(cfg.tangentialAcceleration, cfg.tangentialAccelVariance)

    s.startSize = Math.max(0, vary(cfg.startSize, cfg.startSizeVariance))
    s.endSize = Math.max(0, vary(cfg.finishSize, cfg.finishSizeVariance))

    const sc = varyColor(cfg.startColor, cfg.startColorVariance)
    const ec = varyColor(cfg.finishColor, cfg.finishColorVariance)
    s.startR = sc.r; s.startG = sc.g; s.startB = sc.b; s.startA = sc.a
    s.endR = ec.r; s.endG = ec.g; s.endB = ec.b; s.endA = ec.a

    s.rotStart = vary(cfg.rotationStart, cfg.rotationStartVariance)
    s.rotEnd = vary(cfg.rotationEnd, cfg.rotationEndVariance)

    const texW = this.texture.width || 1
    const scale = Math.max(0, s.startSize / texW)
    s.sprite.scale.set(scale)
    s.sprite.tint = ((clamp01(s.startR) * 255) << 16) | ((clamp01(s.startG) * 255) << 8) | (clamp01(s.startB) * 255)
    s.sprite.alpha = clamp01(s.startA)
  }
}
