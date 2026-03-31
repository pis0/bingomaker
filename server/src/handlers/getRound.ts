import type { APIGatewayProxyHandlerV2 } from 'aws-lambda'
import { replayRound } from '../lib/replay'
import { getRoundItem } from '../lib/dynamo'
import { sanitizeRoundFull } from '../lib/sanitize'
import { ok, error } from '../lib/responses'

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    const roundId = event.pathParameters?.roundId
    if (!roundId) return error(400, 'Missing roundId')

    const item = await getRoundItem(roundId)
    if (!item) return error(404, 'Round not found')

    // Replay to current state
    const round = replayRound(item.seed, item.stake, item.drawCount, item.cardNumbers)

    return ok(sanitizeRoundFull(roundId, item.seed, round, item.stake))
  } catch (err) {
    console.error('getRound error:', err)
    return error(500, 'Internal server error')
  }
}
