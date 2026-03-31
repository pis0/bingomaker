import { Card } from '../../../src/engine/Card'
import { distributeCards } from '../../../src/engine/CardDistributor'
import { Round } from '../../../src/engine/Round'
import { FruitBombBonusSession } from '../../../src/engine/FruitBombBonusSession'
import { DEFAULT_BALLS } from '../../../src/engine/constants'
import { makeSeededRandom } from './rng'
import { shuffle } from '../../../src/engine/utils'

export function replayRound(seed: number, stake: number, drawCount: number, storedCards?: number[][]): Round {
  const random = makeSeededRandom(seed)

  let cardNumbers: number[][]
  let ballSequence: number[]

  if (storedCards) {
    // Reuse stored cards — regenerate ball sequence from seed
    cardNumbers = storedCards
    ballSequence = shuffle(storedCards.flat(), random)
  } else {
    // Generate everything from seed (legacy rounds)
    const dist = distributeCards(random)
    cardNumbers = dist.cardNumbers
    ballSequence = dist.ballSequence
  }

  const cards = cardNumbers.map((nums, i) => {
    const card = new Card(i)
    card.setNumbers(nums)
    return card
  })

  const round = new Round(cards, ballSequence, random)
  round.process(stake) // processes first 30 balls

  // x2 is useless without payout — nullify if base 30 has no payout AND no extras available
  if (round.slotBonus.prize === 'x' && round.totalPayout === 0 && !round.extraAvailable) {
    round.slotBonus.prize = null
  }

  // If slot triggered Fruit Bomb, process it (same RNG → deterministic positions)
  if (round.slotBonus.prize === 'F') {
    const bombSession = new FruitBombBonusSession()
    bombSession.selectPositions(round.cards, random)
    bombSession.process(round, stake)
    round.evaluateExtraLatch()
  }

  // Replay any extra draws beyond the initial 30
  for (let i = DEFAULT_BALLS; i < drawCount; i++) {
    round.drawNext(stake)
  }

  return round
}
