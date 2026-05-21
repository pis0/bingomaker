import type { Round } from '../../../src/engine/Round'

/**
 * In-memory LRU cache for hydrated Round objects, scoped to a single Lambda
 * container's process memory. Best-effort: survives warm invocations but not
 * cold starts, and is not shared across instances.
 *
 * Hit avoids the full replayRound() rebuild (RNG + 30+ draws + bomb session).
 * On optimistic-lock conflict, the caller MUST invalidate to drop a stale entry.
 */

const MAX_ENTRIES = 100

const cache = new Map<string, Round>()

export function getCachedRound(roundId: string): Round | undefined {
  const round = cache.get(roundId)
  if (!round) return undefined
  // LRU: re-insert moves key to the end
  cache.delete(roundId)
  cache.set(roundId, round)
  return round
}

export function setCachedRound(roundId: string, round: Round): void {
  if (cache.has(roundId)) cache.delete(roundId)
  cache.set(roundId, round)
  while (cache.size > MAX_ENTRIES) {
    const oldest = cache.keys().next().value
    if (oldest === undefined) break
    cache.delete(oldest)
  }
}

export function invalidateCachedRound(roundId: string): void {
  cache.delete(roundId)
}
