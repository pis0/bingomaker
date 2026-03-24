export interface SeededRng {
  (): number
  readonly state: number
}

export function makeSeededRandom(seed: number): SeededRng {
  let s = seed
  const fn = (() => {
    s = (s * 16807) % 2147483647
    return s / 2147483647
  }) as SeededRng
  Object.defineProperty(fn, 'state', { get: () => s, enumerable: true })
  return fn
}
