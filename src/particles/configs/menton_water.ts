import type { ParticleConfig } from '../types'

/**
 * Water particle — spray at pipe exit during ball discharge.
 *
 * Base values from water.pex, with AS3 runtime overrides applied
 * (speed, angle, size, lifespan, blend — see BallPanelMenton.waterParticle).
 *
 * AS3 emitAngle = 1.55 rad (~88.8° in Starling) → 271° in PEX convention
 * (Starling sin goes down; PEX/ours uses -sin, so angle = -88.8° ≡ 271.2°)
 */
export const mentonWater: ParticleConfig = {
  texture: 'menton_water',
  maxParticles: 148,
  duration: 4, // AS3: temp2.start(4)
  emitterType: 0, // gravity mode

  lifespan: 1.4, // AS3 override
  lifespanVariance: 0,

  sourcePositionVariance: { x: 10, y: 0 }, // AS3: emitterXVariance=10, emitterYVariance=0

  speed: 700, // AS3 override (initial — tweens to 200 after 2.555s)
  speedVariance: 50, // from PEX
  angle: 271.2, // AS3: emitAngle=1.55 rad, converted to PEX convention
  angleVariance: 0, // AS3 override

  gravity: { x: 0, y: 500 }, // from PEX
  radialAcceleration: -135.29, // from PEX
  radialAccelVariance: 0, // from PEX
  tangentialAcceleration: -5.88, // from PEX
  tangentialAccelVariance: 97.01, // from PEX

  maxRadius: 0,
  maxRadiusVariance: 0,
  minRadius: 0,
  minRadiusVariance: 0,
  rotatePerSecond: -360,
  rotatePerSecondVariance: 0,

  startSize: 50, // AS3 override (initial — tweens to 12 after 2.555s)
  startSizeVariance: 0,
  finishSize: 5, // AS3 override
  finishSizeVariance: 0,

  startColor: { r: 0.14, g: 0.14, b: 0, a: 1 }, // from PEX
  startColorVariance: { r: 0, g: 0, b: 0, a: 0 },
  finishColor: { r: 0, g: 0, b: 0, a: 0 }, // from PEX
  finishColorVariance: { r: 0, g: 0, b: 0, a: 0 },

  rotationStart: 57.07, // from PEX
  rotationStartVariance: 70.82,
  rotationEnd: 0,
  rotationEndVariance: 0,

  blendFuncSource: 769, // SRC_ALPHA (from PEX)
  blendFuncDestination: 1, // ONE = additive (AS3 override)
}
