import type { APIGatewayProxyHandlerV2 } from 'aws-lambda'
import crypto from 'node:crypto'
import { ulid } from 'ulid'
import { Card } from '../../../src/engine/Card'
import { distributeCards } from '../../../src/engine/CardDistributor'
import { Round } from '../../../src/engine/Round'
import { FruitBombBonusSession } from '../../../src/engine/FruitBombBonusSession'
import { STAKE_LEVELS, DEFAULT_BALLS } from '../../../src/engine/constants'
import { makeSeededRandom } from '../lib/rng'
import { putRoundItem } from '../lib/dynamo'
import { sanitizeRoundFull } from '../lib/sanitize'
import { created, error } from '../lib/responses'

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    const body = JSON.parse(event.body ?? '{}')
    const { stake, seed: requestedSeed } = body

    // Validate stake
    if (!STAKE_LEVELS.includes(stake)) {
      return error(400, `Invalid stake. Must be one of: ${STAKE_LEVELS.join(', ')}`)
    }

    // Use requested seed (dev/test) or generate cryptographic seed (production)
    const seed = (typeof requestedSeed === 'number' && requestedSeed > 0 && requestedSeed < 2147483647)
      ? requestedSeed
      : crypto.randomInt(1, 2147483646)
    const roundId = ulid()

    // Run engine
    const random = makeSeededRandom(seed)
    const dist = distributeCards(random)
    const cards = dist.cardNumbers.map((nums, i) => {
      const card = new Card(i)
      card.setNumbers(nums)
      return card
    })
    const round = new Round(cards, dist.ballSequence, random)
    round.process(stake)

    // x2 is useless without payout — nullify if base 30 has no payout AND no extras available
    if (round.slotBonus.prize === 'x' && round.totalPayout === 0 && !round.extraAvailable) {
      round.slotBonus.prize = null
    }

    // If slot bonus triggered with Fruit Bomb prize, process it server-side
    // This ensures extras availability and bomb positions are deterministic
    let bombPositions: Array<{ cardIndex: number; row: number; col: number }> | undefined
    if (round.slotBonus.prize === 'F') {
      const bombSession = new FruitBombBonusSession()
      bombSession.selectPositions(round.cards, random)
      bombSession.process(round, stake)
      // AS3: round.evaluateExtra() after fruit bomb — enables extras if patterns qualify
      round.evaluateExtraLatch()
      bombPositions = [...bombSession.positions]
    }

    // Bell positions for client
    const bellPositions = round.slotBonus.positions.map(p => ({ row: p.row, col: p.col }))

    // Save to DynamoDB
    const now = new Date().toISOString()
    await putRoundItem({
      PK: `ROUND#${roundId}`,
      SK: 'META',
      roundId,
      userId: 'anonymous', // V2: from auth token
      seed,
      stake,
      drawCount: DEFAULT_BALLS,
      totalPayout: round.totalPayout,
      status: 'active',
      cardNumbers: dist.cardNumbers,
      bellPositions,
      createdAt: now,
      updatedAt: now,
      ttl: Math.floor(Date.now() / 1000) + 86400, // 24h TTL
    })

    return created(sanitizeRoundFull(roundId, seed, round, stake, bombPositions))
  } catch (err) {
    console.error('createRound error:', err)
    return error(500, 'Internal server error')
  }
}
