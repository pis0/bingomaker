import type { ParticleConfig } from '../types'

/** Bubbles particle — used in BingoMovie at t=1.85s */
export const mentonPipoqueiraBbl: ParticleConfig = {
  texture: 'menton_pipoqueira_bbl',
  maxParticles: 15,
  duration: -1,
  emitterType: 0,

  lifespan: 9.57,
  lifespanVariance: 1.33,

  sourcePositionVariance: { x: 75, y: 0 },

  speed: 0,
  speedVariance: 0,
  angle: 268.66,
  angleVariance: 45.71,

  gravity: { x: 0, y: -46.51 },
  radialAcceleration: 4.71,
  radialAccelVariance: 23.05,
  tangentialAcceleration: 5.88,
  tangentialAccelVariance: 0,

  maxRadius: 230.77,
  maxRadiusVariance: 0,
  minRadius: 30.86,
  minRadiusVariance: 0,
  rotatePerSecond: -360,
  rotatePerSecondVariance: 0,

  startSize: 13.49,
  startSizeVariance: 9.77,
  finishSize: 5.85,
  finishSizeVariance: 0,

  startColor: { r: 1, g: 0.48, b: 0.35, a: 0 },
  startColorVariance: { r: 0, g: 0, b: 0, a: 1 },
  finishColor: { r: 0.47, g: 0.28, b: 0.53, a: 0 },
  finishColorVariance: { r: 0, g: 0, b: 0, a: 1 },

  rotationStart: 0,
  rotationStartVariance: 0,
  rotationEnd: 0,
  rotationEndVariance: 0,

  blendFuncSource: 772,
  blendFuncDestination: 772,
}
