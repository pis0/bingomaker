import { Card } from '../../../src/engine/Card'
import { distributeCards } from '../../../src/engine/CardDistributor'
import { Round } from '../../../src/engine/Round'
import { FruitBombBonusSession } from '../../../src/engine/FruitBombBonusSession'
import { DEFAULT_BALLS, NUM_CARDS } from '../../../src/engine/constants'
import { makeSeededRandom } from './rng'

export function replayRound(seed: number, stake: number, drawCount: number): Round {
  const random = makeSeededRandom(seed)
  const dist = distributeCards(random)

  const cards: Card[] = []
  for (let i = 0; i < NUM_CARDS; i++) {
    const card = new Card(i)
    card.setNumbers(dist.cardNumbers[i])
    cards.push(card)
  }

  const round = new Round(cards, dist.ballSequence, random)
  round.process(stake) // processes first 30 balls

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
