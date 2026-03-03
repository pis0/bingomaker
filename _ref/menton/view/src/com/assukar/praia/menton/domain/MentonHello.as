package com.assukar.praia.menton.domain
{
	import com.assukar.domain.domain.games.GameHello;
	import com.assukar.engine.remoting.domain.RemoteCommand;
	import com.assukar.praia.domain.games.PraiaGameHello;
	import com.assukar.praia.domain.games.vbs.MentonVBB;
	import com.assukar.praia.menton.engine.commands.GameWelcomeCommand;

	
	public class MentonHello 
	extends PraiaGameHello
	{
		public function MentonHello()
		{
			super(MentonVBB.ME);
		}
		
		override public function getGameWelcomeCommand(): RemoteCommand
		{
			return new GameWelcomeCommand();
		}		
	}
}