import type { APIGatewayProxyHandlerV2 } from 'aws-lambda'
import { DEFAULT_BALLS, EXTRA_BALLS, SUPER_EXTRA_BALLS } from '../../../src/engine/constants'
import { replayRound } from '../lib/replay'
import { getRoundItem, incrementDrawCount } from '../lib/dynamo'
import { sanitizeDraw, sanitizeCard, sanitizeSlotBonus } from '../lib/sanitize'
import { ok, error } from '../lib/responses'

const MAX_DRAWS = DEFAULT_BALLS + EXTRA_BALLS + SUPER_EXTRA_BALLS // 45

/**
 * POST /rounds/:roundId/draw
 *
 * Commit mode (default): advances the round one ball, persists drawCount to
 * DynamoDB via optimistic lock. The client's user-driven extra/super-extra
 * click takes this path.
 *
 * Peek mode (?peek=true): replays one extra step in-process, returns the
 * same response shape as commit, but does NOT touch DynamoDB. The client's
 * background prefetch uses this so a subsequent endRound is never charged
 * for a ball the user never consumed.
 *
 * Peek and commit are deterministic — for the same (seed, drawCount, stake)
 * they return the same draw. Client applies peek's response locally on user
 * click then fires commit in the background.
 */
export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    const roundId = event.pathParameters?.roundId
    if (!roundId) return error(400, 'Missing roundId')

    const isPeek = event.queryStringParameters?.peek === 'true'

    // Load from DynamoDB
    const item = await getRoundItem(roundId)
    if (!item) return error(404, 'Round not found')
    if (item.status !== 'active') return error(409, 'Round already completed')
    if (item.drawCount >= MAX_DRAWS) return error(409, 'No more draws available')

    // Replay to current state. Peek deliberately skips the warm cache to avoid
    // polluting the committed state with a speculative drawNext.
    const round = replayRound(item.seed, item.stake, item.drawCount, item.cardNumbers)

    // Validate extras are available
    if (!round.extraAvailable && !round.superExtraAvailable) {
      return error(409, 'No extra balls available')
    }

    // Get extra price BEFORE drawing
    const extraPrice = round.extraPriceAt(item.drawCount, item.stake)

    // Draw next ball
    const draw = round.drawNext(item.stake)
    if (!draw) return error(500, 'Draw failed unexpectedly')

    // Persist only in commit mode
    if (!isPeek) {
      try {
        await incrementDrawCount(roundId, item.drawCount, round.totalPayout)
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'ConditionalCheckFailedException') {
          return error(409, 'Concurrent draw detected. Retry.')
        }
        throw err
      }
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
