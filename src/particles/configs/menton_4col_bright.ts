import type { ParticleConfig } from '../types'

/** Pre-converted from menton_4col_bright.pex — glow effect on missing high-value patterns */
export const menton4colBright: ParticleConfig = {
  texture: 'menton_4col_bright',
  maxParticles: 73,
  duration: -1,
  emitterType: 0, // gravity mode

  lifespan: 1.95,
  lifespanVariance: 0.19,

  sourcePositionVariance: { x: 125, y: 100 },

  speed: 0,
  speedVariance: 0,
  angle: 96.72,
  angleVariance: 45.71,

  gravity: { x: 0, y: 0 },
  radialAcceleration: 5.88,
  radialAccelVariance: 0,
  tangentialAcceleration: -5.88,
  tangentialAccelVariance: 0,

  maxRadius: 230.77,
  maxRadiusVariance: 0,
  minRadius: 30.86,
  minRadiusVariance: 0,
  rotatePerSecond: -360,
  rotatePerSecondVariance: 0,

  startSize: 17.5,
  startSizeVariance: 3.26,
  finishSize: 0,
  finishSizeVariance: 10,

  startColor: { r: 1, g: 0.48, b: 0.35, a: 0.36 },
  startColorVariance: { r: 0, g: 0, b: 0, a: 1 },
  finishColor: { r: 0.47, g: 0.28, b: 0.53, a: 0 },
  finishColorVariance: { r: 0, g: 0, b: 0, a: 1 },

  rotationStart: 0,
  rotationStartVariance: 0,
  rotationEnd: 0,
  rotationEndVariance: 0,

  blendFuncSource: 770,  // GL_SRC_ALPHA
  blendFuncDestination: 1, // GL_ONE (additive)
}
