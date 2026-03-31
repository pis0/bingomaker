import type { APIGatewayProxyHandlerV2 } from 'aws-lambda'
import { replayRound } from '../lib/replay'
import { getRoundItem, completeRound } from '../lib/dynamo'
import { ok, error } from '../lib/responses'

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    const roundId = event.pathParameters?.roundId
    if (!roundId) return error(400, 'Missing roundId')

    const item = await getRoundItem(roundId)
    if (!item) return error(404, 'Round not found')
    // Idempotent — if already completed, return success with stored payout
    if (item.status !== 'active') return ok({
      roundId,
      totalPayout: item.totalPayout,
      winMultiplierPayout: item.winMultiplierPayout ?? 0,
      status: 'completed',
    })

    // Replay to get final payout (including x2 multiplier bonus)
    const round = replayRound(item.seed, item.stake, item.drawCount, item.cardNumbers)
    const finalPayout = round.totalPayout + round.winMultiplierPayout

    try {
      await completeRound(roundId, finalPayout, round.winMultiplierPayout)
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'ConditionalCheckFailedException') {
        return error(409, 'Round already completed')
      }
      throw err
    }

    return ok({
      roundId,
      totalPayout: finalPayout,
      winMultiplierPayout: round.winMultiplierPayout,
      status: 'completed',
    })
  } catch (err) {
    console.error('endRound error:', err)
    return error(500, 'Internal server error')
  }
}
