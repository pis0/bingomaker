import type { ParticleConfig, ParticleColor } from './types'

/** Parse a PEX XML string into a ParticleConfig.
 *  PEX is the standard Cocos2d / Starling particle format. */
export function parsePex(xml: string): ParticleConfig {
  const doc = new DOMParser().parseFromString(xml, 'text/xml')

  const float = (tag: string, attr: string): number => {
    const el = doc.querySelector(tag)
    return el ? parseFloat(el.getAttribute(attr) ?? '0') : 0
  }

  const vec = (tag: string): { x: number; y: number } => ({
    x: float(tag, 'x'),
    y: float(tag, 'y'),
  })

  const color = (tag: string): ParticleColor => ({
    r: float(tag, 'red'),
    g: float(tag, 'green'),
    b: float(tag, 'blue'),
    a: float(tag, 'alpha'),
  })

  const texEl = doc.querySelector('texture')
  const textureName = texEl?.getAttribute('name') ?? ''

  return {
    texture: textureName,
    maxParticles: Math.round(float('maxParticles', 'value')),
    duration: float('duration', 'value'),
    emitterType: float('emitterType', 'value'),

    lifespan: float('particleLifeSpan', 'value'),
    lifespanVariance: float('particleLifespanVariance', 'value'),

    sourcePositionVariance: vec('sourcePositionVariance'),

    speed: float('speed', 'value'),
    speedVariance: float('speedVariance', 'value'),
    angle: float('angle', 'value'),
    angleVariance: float('angleVariance', 'value'),

    gravity: vec('gravity'),
    radialAcceleration: float('radialAcceleration', 'value'),
    radialAccelVariance: float('radialAccelVariance', 'value'),
    tangentialAcceleration: float('tangentialAcceleration', 'value'),
    tangentialAccelVariance: float('tangentialAccelVariance', 'value'),

    maxRadius: float('maxRadius', 'value'),
    maxRadiusVariance: float('maxRadiusVariance', 'value'),
    minRadius: float('minRadius', 'value'),
    minRadiusVariance: float('minRadiusVariance', 'value'),
    rotatePerSecond: float('rotatePerSecond', 'value'),
    rotatePerSecondVariance: float('rotatePerSecondVariance', 'value'),

    startSize: float('startParticleSize', 'value'),
    startSizeVariance: float('startParticleSizeVariance', 'value'),
    finishSize: float('finishParticleSize', 'value'),
    finishSizeVariance: float('FinishParticleSizeVariance', 'value'),

    startColor: color('startColor'),
    startColorVariance: color('startColorVariance'),
    finishColor: color('finishColor'),
    finishColorVariance: color('finishColorVariance'),

    rotationStart: float('rotationStart', 'value'),
    rotationStartVariance: float('rotationStartVariance', 'value'),
    rotationEnd: float('rotationEnd', 'value'),
    rotationEndVariance: float('rotationEndVariance', 'value'),

    blendFuncSource: float('blendFuncSource', 'value'),
    blendFuncDestination: float('blendFuncDestination', 'value'),
  }
}
