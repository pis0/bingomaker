package com.assukar.praia.menton.domain
{

	public class Draw
	{
		public var ix: int;
		// triggered ball
		public var ball: int;
		// null if no cards were affected
		public var cardMatches: CardMatches;
		// affected card
		public var affectedCard: Card;
		// previous draw
		public var previousDraw: Draw;
		// previous card matches for the same affected card
		public var previousCardMatches : CardMatches;
		// slot triggered by this draw
		public var slotTriggered : Boolean = false;

		public function get additionalPayout() : int
		{
			if (cardMatches) return cardMatches.additionalPayout;
			else return 0;
		}
		
		public function dispose(): void
		{
			cardMatches.dispose();
		}		

		public function toString(): String
		{
			var str: String = "Draw[";

			str += "b:"+ball;

			if (affectedCard!=null)
			{
				str += "\naffected:\n"+affectedCard;
				str += "\nmatches:\n"+cardMatches;
			}

			return str+"]";
		}

		private function getPreviousAffectedCardMatches(card: Card): CardMatches
		{
			if (card==affectedCard) return cardMatches;
			else if (previousDraw) return previousDraw.getPreviousAffectedCardMatches(card);
			else return null;
		}

		public var round: Round;
		
		public function Draw(round: Round, ix: int, ball: int, affectedCard: Card, previousDraw: Draw)
		{
			this.round = round;
			this.ix = ix;
			this.ball = ball;
			this.affectedCard = affectedCard;
			this.previousDraw = previousDraw;

			if (affectedCard)
			{
				cardMatches = affectedCard.produceCardMatches();

				if (previousDraw)
				{
					previousCardMatches = previousDraw.getPreviousAffectedCardMatches(affectedCard);
				}
			}
		}
	}
}
