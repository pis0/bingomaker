package com.assukar.praia.menton.engine.commands
{
	import com.assukar.airong.error.AssukarError;
	import com.assukar.airong.utils.Utils;
	import com.assukar.engine.remoting.domain.RemoteCommand;
	import com.assukar.praia.menton.components.jackpot.JackpotPanel;
	import com.assukar.praia.menton.controllers.JackpotController;
	import com.assukar.praia.menton.domain.MentonJackpot;
	import com.assukar.praia.menton.domain.MentonJackpotSession;

	/**
	 * @author Johnatan
	 */
	public class MentonJackpotCommand
	implements RemoteCommand
	{
		public function execute(object : *) : void
		{
			var pjack : MentonJackpot = MentonJackpotSession.ME.jackpot;
			var jack : MentonJackpot = MentonJackpot(object);
			MentonJackpotSession.ME.jackpot = jack;
			if (JackpotController.ME) JackpotController.ME.update();

//			Utils.print(pjack);
			if (jack.value < MentonJackpot.MIN_VALUE) 
			{
				Utils.logError(new AssukarError("jack < MIN_VALUE"), false);
			}
			
			if (pjack && pjack.value > jack.value)
			{
				if (JackpotPanel.ME) JackpotPanel.ME.someoneWon();
				if (JackpotController.ME) JackpotController.ME.someoneWon();
			}
		}
	}
}
