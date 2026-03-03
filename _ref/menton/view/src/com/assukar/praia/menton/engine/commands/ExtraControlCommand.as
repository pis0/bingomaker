package com.assukar.praia.menton.engine.commands
{
	import com.assukar.airong.utils.Singleton;
	import com.assukar.praia.domain.games.PraiaControlInfo;
	import com.assukar.praia.menton.domain.Extra;
	import com.assukar.praia.menton.domain.NewExtra;
	import com.assukar.praia.menton.domain.Round;
	import com.assukar.praia.menton.domain.SlotBonusSession;

	public class ExtraControlCommand
	{
		static public const ME: ExtraControlCommand = new ExtraControlCommand();

		function ExtraControlCommand()
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
			extra: Extra;
		
		public function execute(newExtra: NewExtra): Extra
		{
			float = PraiaControlInfo.ME.elasticity;
			condition = Math.random()<Math.abs(float);
			round = newExtra.round;

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

			extra = new Extra(newExtra);
			extra.process();
			
			{
				SlotBonusSession.ME.process(round.lastDraw);
			}
			
			return extra;
		}
	}
}
