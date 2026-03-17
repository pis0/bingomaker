import type { ParticleConfig } from '../types'

/**
 * Extra water particle — spray at chute exit during extra ball dispatch.
 *
 * AS3: BallPanelMenton.extraWaterParticle()
 * Base: water.pex values + runtime overrides from extraWaterParticle()
 *
 * 2 emitters, each: start(0.166 * random), pos(145, -85+random*50),
 * speed 50-150, emitAngle=0 (up in Starling = 270° PEX), size 10→5, lifespan 1.4s
 */
export const mentonExtraWater: ParticleConfig = {
  texture: 'menton_water',
  maxParticles: 178, // ~20% more than water.pex 148
  duration: 0.2, // slightly longer burst for denser start
  emitterType: 0, // gravity mode

  lifespan: 1.4, // AS3 override
  lifespanVariance: 0, // water.pex: 0

  sourcePositionVariance: { x: 0, y: 10 }, // AS3: emitterXVariance=0, emitterYVariance=10

  speed: 100, // AS3: 50 + 100*random → center ~100
  speedVariance: 50,
  angle: 330, // up-right — spray follows ball launch direction
  angleVariance: 25, // spread

  gravity: { x: 40, y: 150 }, // slight rightward push + downward pull
  radialAcceleration: -135.29, // water.pex
  radialAccelVariance: 0, // water.pex
  tangentialAcceleration: -5.88, // water.pex
  tangentialAccelVariance: 97.01, // water.pex

  maxRadius: 0,
  maxRadiusVariance: 0,
  minRadius: 0,
  minRadiusVariance: 0,
  rotatePerSecond: -360, // water.pex
  rotatePerSecondVariance: 0,

  startSize: 10, // AS3 override (water.pex: 10.96)
  startSizeVariance: 0,
  finishSize: 5, // AS3 override (water.pex: 5.12)
  finishSizeVariance: 0,

  startColor: { r: 0.14, g: 0.14, b: 0, a: 1 }, // water.pex
  startColorVariance: { r: 0, g: 0, b: 0, a: 0 },
  finishColor: { r: 0, g: 0, b: 0, a: 0 }, // water.pex
  finishColorVariance: { r: 0, g: 0, b: 0, a: 0 },

  rotationStart: 57.07, // water.pex
  rotationStartVariance: 70.82,
  rotationEnd: 0,
  rotationEndVariance: 0,

  blendFuncSource: 769, // SRC_ALPHA
  blendFuncDestination: 1, // ONE = additive (AS3 override)
}
