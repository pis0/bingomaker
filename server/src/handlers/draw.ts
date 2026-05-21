import type { APIGatewayProxyHandlerV2 } from 'aws-lambda'
import { DEFAULT_BALLS, EXTRA_BALLS, SUPER_EXTRA_BALLS } from '../../../src/engine/constants'
import { replayRound } from '../lib/replay'
import { getCachedRound, setCachedRound, invalidateCachedRound } from '../lib/roundCache'
import { getRoundItem, incrementDrawCount } from '../lib/dynamo'
import { sanitizeDraw, sanitizeCard, sanitizeSlotBonus } from '../lib/sanitize'
import { ok, error } from '../lib/responses'

const MAX_DRAWS = DEFAULT_BALLS + EXTRA_BALLS + SUPER_EXTRA_BALLS // 45

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    const roundId = event.pathParameters?.roundId
    if (!roundId) return error(400, 'Missing roundId')

    // Load from DynamoDB
    const item = await getRoundItem(roundId)
    if (!item) return error(404, 'Round not found')
    if (item.status !== 'active') return error(409, 'Round already completed')
    if (item.drawCount >= MAX_DRAWS) return error(409, 'No more draws available')

    // Hydrate round: warm-instance cache avoids replaying 30+ draws from seed.
    // Cached entry must match the DDB drawCount, otherwise it's stale.
    let round = getCachedRound(roundId)
    if (!round || round.currentBallIndex !== item.drawCount) {
      round = replayRound(item.seed, item.stake, item.drawCount, item.cardNumbers)
      setCachedRound(roundId, round)
    }

    // Validate extras are available
    if (!round.extraAvailable && !round.superExtraAvailable) {
      return error(409, 'No extra balls available')
    }

    // Get extra price BEFORE drawing
    const extraPrice = round.extraPriceAt(item.drawCount, item.stake)

    // Draw next ball (mutates the cached round in place)
    const draw = round.drawNext(item.stake)
    if (!draw) return error(500, 'Draw failed unexpectedly')

    // Optimistic locking update
    try {
      await incrementDrawCount(roundId, item.drawCount, round.totalPayout)
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'ConditionalCheckFailedException') {
        // Cache is now ahead of DDB (we mutated locally but didn't persist) — drop it
        invalidateCachedRound(roundId)
        return error(409, 'Concurrent draw detected. Retry.')
      }
      throw err
    }

    // Next extra price (if available)
    const nextDrawIndex = item.drawCount + 1
    const nextExtraPrice = (round.extraAvailable || round.superExtraAvailable)
      ? round.extraPriceAt(nextDrawIndex, item.stake)
      : null

    return ok({
      draw: sanitizeDraw(draw),
      cards: round.cards.map(sanitizeCard),
      totalPayout: round.totalPayout,
      winMultiplierPayout: round.winMultiplierPayout,
      extraAvailable: round.extraAvailable,
      superExtraAvailable: round.superExtraAvailable,
      extraPrice,
      nextExtraPrice,
      slotBonus: sanitizeSlotBonus(round),
    })
  } catch (err) {
    console.error('draw error:', err)
    return error(500, 'Internal server error')
  }
}
