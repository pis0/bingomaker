package com.assukar.praia.menton.domain
{
	public class Extra
	{
		public var round: Round;
		public var ball: int;

		public function Extra(newExtra: NewExtra)
		{
			round = Round(newExtra.round);
			ball = round.balls.get(round.ballIndex);
		}

		public function process(): void
		{
			round.draw(ball);
			round.ballIndex++;
			if (!round.evaluateExtra()) round.evaluateSuperExtra();
			round.calculateExtraStakes();
		}
	}
}
