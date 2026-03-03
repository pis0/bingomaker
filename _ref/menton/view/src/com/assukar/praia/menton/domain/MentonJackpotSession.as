package com.assukar.praia.menton.domain
{
	import com.assukar.airong.utils.Singleton;
	import com.assukar.domain.domain.StatsMoney;
import com.assukar.engine.utils.AntiCheatInt;
import com.assukar.praia.domain.jackpots.JackpotMarkupController;
	import com.assukar.praia.menton.main.MentonEngine;
	import com.assukar.praia.main.PraiaContext;
	/**
	 * @author Johnatan
	 */
	public class MentonJackpotSession
	implements PatternLinkage
	{
		static private const START_VALUE: int = 5000;
		
		// singleton
		static public const ME: MentonJackpotSession = new MentonJackpotSession();
		function MentonJackpotSession()
		{
			Singleton.enforce(ME);
			jackpot = new MentonJackpot();
			jackpot.value = START_VALUE;
		}
		
		public function get ballsToJackpot(): int
		{
			if (jackpot.value > MentonJackpot.BALL_KICK_THRESHOLDS[3]) return 38;
			else if (jackpot.value > MentonJackpot.BALL_KICK_THRESHOLDS[2]) return 36;
			else if (jackpot.value > MentonJackpot.BALL_KICK_THRESHOLDS[1]) return 34;
			else if (jackpot.value > MentonJackpot.BALL_KICK_THRESHOLDS[0]) return 32;
			else return 30;
		}
		public function get nextBallsToJackpot(): int
		{
			if (jackpot.value >= MentonJackpot.BALL_KICK_THRESHOLDS[3]) return -1;//38;
			else if (jackpot.value >= MentonJackpot.BALL_KICK_THRESHOLDS[2]) return 38;//36;
			else if (jackpot.value >= MentonJackpot.BALL_KICK_THRESHOLDS[1]) return 36;//;34;
			else if (jackpot.value >= MentonJackpot.BALL_KICK_THRESHOLDS[0]) return 34;//32;
			else return 32;//30;
		}
		
		public function get nextValueToJackpot(): int
		{
			if (jackpot.value >= MentonJackpot.BALL_KICK_THRESHOLDS[3]) return -1;//36;
			else if (jackpot.value >= MentonJackpot.BALL_KICK_THRESHOLDS[2]) return MentonJackpot.BALL_KICK_THRESHOLDS[3];//;34;
			else if (jackpot.value >= MentonJackpot.BALL_KICK_THRESHOLDS[1]) return MentonJackpot.BALL_KICK_THRESHOLDS[2];//32;
			else return MentonJackpot.BALL_KICK_THRESHOLDS[0];//30;
		}
		
		private var juicee: AntiCheatInt = new AntiCheatInt(0);

		private function get juice():int { return juicee.value; }
		private function set juice(value:int):void { juicee.value = value; }


		public function consumeJuice(): int
		{
			var j: int = juice;
			juice = 0;
			return j;
		}
		
		public function addJuice(j: int): void
		{
			if (juice < int.MAX_VALUE - 10000) juice += Math.abs(j);
		}
		
		// object vars
		public var jackpot: MentonJackpot;
		
		private function get payout(): int
		{
			return Math.ceil((getPercentage()/100) * jackpot.value);
		}
		
		public function getPayout(): StatsMoney
		{
			return new StatsMoney(0, payout);
		}
		
		public function getFinalPayout(): int
		{
			return Math.ceil(payout * (1 + 0.01 * JackpotMarkupController.ME.myPercentageMarkup));
		}
		
		public function activate(round: Round): void
		{
			if (PraiaContext.ME.engineDataSource)
			{
				PraiaContext.ME.engineDataSource.send(new MentonJackpotNotification(payout, MentonJackpot.getPercentage()));
			}
			
			round.end();
			round.jackpot = true;
		}

		public function request(): void
		{
			PraiaContext.ME.engineDataSource.send(new MentonJackpotRequest());
		}
		
		public function isValid(round: Round): Boolean
		{
			return !round || round.ballsDrawn <= ballsToJackpot;
		}

		public function getPercentage() : int
		{
			return MentonJackpot.getPercentage();
		}

		public function reset() : void
		{
		}

		public function getExpectation() : int
		{
			return Math.ceil((getPercentage()/100) * START_VALUE);
		}
	}
}
