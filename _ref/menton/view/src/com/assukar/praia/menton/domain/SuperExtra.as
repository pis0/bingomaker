package com.assukar.praia.menton.domain
{
	public class SuperExtra
	{
		public var round: Round;
		public var ball: int;

		public function SuperExtra(newSuperExtra: NewSuperExtra)
		{
			round = Round(newSuperExtra.round);
			ball = round.balls.get(round.ballIndex);
		}

		public function process(): void
		{
			round.draw(ball);
			round.ballIndex++;
			round.evaluateSuperExtra();
			round.calculateExtraStakes();
		}
	}
}
