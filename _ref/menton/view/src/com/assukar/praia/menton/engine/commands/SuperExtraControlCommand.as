package com.assukar.praia.menton.engine.commands
{
	import com.assukar.airong.utils.Singleton;
	import com.assukar.praia.domain.games.PraiaControlInfo;
	import com.assukar.praia.menton.domain.NewSuperExtra;
	import com.assukar.praia.menton.domain.Round;
	import com.assukar.praia.menton.domain.SlotBonusSession;
	import com.assukar.praia.menton.domain.SuperExtra;

	public class SuperExtraControlCommand
	{
		static public const ME: SuperExtraControlCommand = new SuperExtraControlCommand();

		function SuperExtraControlCommand()
		{
			Singleton.enforce(ME);
		}

		public function dispose(): void
		{
		}

		// delocalization of variables
		private var 
			float: Number,
			condition: Boolean,
			round: Round,
			missingBalls: Vector.<int>,
			ball: int,
			matchBall: Boolean,
			len: int,
			i: int,
			superExtra: SuperExtra;
		
		public function execute(newSuperExtra: NewSuperExtra): SuperExtra
		{
			float = PraiaControlInfo.ME.elasticity;
			condition = Math.random()<Math.abs(float);
			round = newSuperExtra.round;
			
			if (condition)
			{
				missingBalls = round.retrieveMissingBalls();

				ball = round.balls.get(round.ballIndex);

				matchBall = false;

				len = missingBalls.length;
				for (i = 0; i<len; i++)
				{
					if (missingBalls[i]==ball)
					{
						matchBall = true;
						break;
					}
				}

				if ((matchBall && float<0) || (!matchBall && float>0))
				{
					round.balls.swapIndexes(round.ballIndex, round.ballIndex+1+Math.max(0, int(Math.random()*(round.balls.size-round.ballIndex-2))));
				}
			}

			superExtra = new SuperExtra(newSuperExtra);
			superExtra.process();
			
			{
				SlotBonusSession.ME.process(round.lastDraw);
			}			
			
			return superExtra;
		}
	}
}
