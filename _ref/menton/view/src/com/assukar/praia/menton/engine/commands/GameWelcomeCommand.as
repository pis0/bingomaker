package com.assukar.praia.menton.engine.commands
{
	import com.assukar.domain.domain.games.GameWelcome;
	import com.assukar.engine.remoting.domain.RemoteCommand;
	import com.assukar.praia.domain.PraiaPlayerInfo;
	import com.assukar.praia.menton.main.Context;
	import com.assukar.praia.menton.main.MentonController;

	public class GameWelcomeCommand
	implements RemoteCommand
	{
		public function execute(object: *): void
		{
			Context.gameWelcome = GameWelcome(object);
			PraiaPlayerInfo.ME.gameSessionId = Context.gameWelcome.gameSessionId;

			MentonController.ME.doMainCallback();
		}
	}
}