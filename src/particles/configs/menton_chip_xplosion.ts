import type { ParticleConfig } from '../types'

/** Chip explosion particle — used in BingoMovie at t=1.85s */
export const mentonChipXplosion: ParticleConfig = {
  texture: 'menton_chip_xplosion',
  maxParticles: 28,
  duration: -1,
  emitterType: 0,

  lifespan: 1.41,
  lifespanVariance: 0,

  sourcePositionVariance: { x: 125, y: 75 },

  speed: 160,
  speedVariance: 66.67,
  angle: 268.39,
  angleVariance: 22.86,

  gravity: { x: 0, y: 500 },
  radialAcceleration: 4.71,
  radialAccelVariance: 0,
  tangentialAcceleration: 5.88,
  tangentialAccelVariance: 0,

  maxRadius: 0,
  maxRadiusVariance: 0,
  minRadius: 0,
  minRadiusVariance: 0,
  rotatePerSecond: -360,
  rotatePerSecondVariance: 0,

  startSize: 30.32,
  startSizeVariance: 0,
  finishSize: 48.62,
  finishSizeVariance: 0,

  startColor: { r: 1, g: 1, b: 1, a: 1 },
  startColorVariance: { r: 0, g: 0, b: 0, a: 0 },
  finishColor: { r: 1, g: 1, b: 1, a: 1 },
  finishColorVariance: { r: 0, g: 0, b: 0, a: 0 },

  rotationStart: 0,
  rotationStartVariance: 0,
  rotationEnd: 0,
  rotationEndVariance: 0,

  blendFuncSource: 770,
  blendFuncDestination: 771,
}
