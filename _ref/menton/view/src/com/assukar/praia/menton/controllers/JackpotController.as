package com.assukar.praia.menton.controllers
{
	import com.assukar.airong.timer.UTimer;
	import com.assukar.airong.utils.Singleton;
	import com.assukar.airong.utils.Statics;
	import com.assukar.engine.utils.AntiCheatInt;
	import com.assukar.praia.menton.components.balls.BallPanelMenton;
	import com.assukar.praia.menton.components.jackpot.JackpotPanel;
	import com.assukar.praia.menton.domain.MentonJackpot;
	import com.assukar.praia.menton.domain.MentonJackpotSession;

	import flash.events.TimerEvent;
	/**
	 * @author Johnatan
	 */
	public class JackpotController
	{
		// singleton
		static public var ME: JackpotController;

		public function dispose(): void
		{
			timer.dispose();
			ticker.dispose();
			ME = null;
		}

		public function JackpotController()
		{
			Singleton.enforce(ME);
		}
		
		// object
		
		private var timer: UTimer = new UTimer("JackpotController");
		private var ticker: UTimer = new UTimer("JackpotController.Ticker");
		private var displayValue : Number = MentonJackpot.MIN_VALUE;
		private var _finalValue : AntiCheatInt = AntiCheatInt.ZERO;
		private var secondIncrement: Number = 0;
		
		public function initiate(): void
		{
			updateJackpot();
			timer.setMultipleNonStop(Statics.MINUTE, minuteUpdate);
			ticker.setMultipleNonStop(Statics.SECOND, secondUpdate);
		}
		
		private function updateJackpot(t: TimerEvent = null): void
		{
			MentonJackpotSession.ME.request();
		}
		
		private var previousIntDisplayValue: int = 0;
		private function secondUpdate(): void
		{
			if (!ME) return;
			displayValue += secondIncrement;
			if (displayValue > finalValue) displayValue = finalValue;
			
			if (JackpotPanel.ME && int(displayValue) > previousIntDisplayValue)
			{
				previousIntDisplayValue = int(displayValue);
				JackpotPanel.ME.update(previousIntDisplayValue);
			}
		}
		
		private function minuteUpdate(): void
		{
			if (!ME) return;
			update();
			updateJackpot();
		}
		
		public function update(): void
		{
			if (displayValue == MentonJackpot.MIN_VALUE) displayValue = Math.max(MentonJackpot.MIN_VALUE, MentonJackpotSession.ME.jackpot.value-25);
			finalValue = MentonJackpotSession.ME.jackpot.value;
			
			previousIntDisplayValue = 0;
			secondIncrement = (finalValue - displayValue)/60;
			
			if (JackpotPanel.ME)
			{
				JackpotPanel.ME.update(MentonJackpotSession.ME.jackpot.value);
				JackpotPanel.ME.updatePercentage(MentonJackpotSession.ME.getPercentage());
			}
			BallPanelMenton.ME.updateJackpotMarkPos();
		}

		public function someoneWon() : void
		{
			displayValue = finalValue = MentonJackpotSession.ME.jackpot.value;
			update();
		}
		
		public function get finalValue():int {
			return _finalValue.value;
		}
		
		public function set finalValue(value:int):void {
			_finalValue.value = value;
		}
	}
}
