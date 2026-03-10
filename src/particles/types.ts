/** Particle system config — engine-agnostic format.
 *  Can be produced by parsePex() or hand-authored as JSON. */

export interface ParticleColor {
  r: number // 0–1
  g: number // 0–1
  b: number // 0–1
  a: number // 0–1
}

export interface ParticleConfig {
  /** Texture key (resolved by the consumer) */
  texture: string

  // --- Emission ---
  /** Max simultaneous particles */
  maxParticles: number
  /** Emission duration in seconds (-1 = infinite) */
  duration: number
  /** Emitter type: 0 = gravity, 1 = radial */
  emitterType: number

  // --- Lifetime ---
  lifespan: number
  lifespanVariance: number

  // --- Position ---
  sourcePositionVariance: { x: number; y: number }

  // --- Speed & direction ---
  speed: number
  speedVariance: number
  angle: number // degrees
  angleVariance: number // degrees

  // --- Gravity mode (emitterType 0) ---
  gravity: { x: number; y: number }
  radialAcceleration: number
  radialAccelVariance: number
  tangentialAcceleration: number
  tangentialAccelVariance: number

  // --- Radial mode (emitterType 1) ---
  maxRadius: number
  maxRadiusVariance: number
  minRadius: number
  minRadiusVariance: number
  rotatePerSecond: number // degrees
  rotatePerSecondVariance: number // degrees

  // --- Size ---
  startSize: number
  startSizeVariance: number
  finishSize: number
  finishSizeVariance: number

  // --- Color ---
  startColor: ParticleColor
  startColorVariance: ParticleColor
  finishColor: ParticleColor
  finishColorVariance: ParticleColor

  // --- Rotation (sprite rotation) ---
  rotationStart: number // degrees
  rotationStartVariance: number
  rotationEnd: number // degrees
  rotationEndVariance: number

  // --- Blend ---
  /** GL blend func source (770 = SRC_ALPHA) */
  blendFuncSource: number
  /** GL blend func destination (1 = ONE = additive, 771 = ONE_MINUS_SRC_ALPHA = normal) */
  blendFuncDestination: number
}
