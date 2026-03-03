package com.assukar.praia.menton.main
{
	import com.assukar.airong.utils.Singleton;
	import com.assukar.domain.domain.games.GameWelcome;
	import com.assukar.domain.services.controllers.AssukarRemoteConnector;
	import com.assukar.domain.services.controllers.View;
	import com.assukar.praia.domain.RemoteClassRegistry;
	import com.assukar.praia.main.PraiaContext;
	import com.assukar.praia.menton.domain.Config;
	import com.assukar.praia.menton.domain.MentonHello;
	import com.assukar.praia.menton.domain.MentonJackpot;
	import com.assukar.praia.menton.domain.MentonRemoteClassRegistry;
	import com.assukar.praia.menton.engine.commands.BonusCommand;
	import com.assukar.praia.menton.engine.commands.ExtraControlCommand;
	import com.assukar.praia.menton.engine.commands.GameWelcomeCommand;
	import com.assukar.praia.menton.engine.commands.MentonJackpotCommand;
	import com.assukar.praia.menton.engine.commands.NewRoundControlCommand;
	import com.assukar.praia.services.controllers.PraiaController;
	import com.assukar.domain.services.controllers.AssukarRemoteConnector;

	public class MentonController 
	extends PraiaController
	{
		static public const ME: MentonController = new MentonController();
		
		function MentonController()
		{
			super(MentonEngine.ME);
			Singleton.enforce(ME);
		}

		override public function setView(view: View): void
		{
			super.setView(view);
		}
		
		override public function startInner(): void
		{
			if (innerStart && startupMode) return;
			innerStart = true;
			
			initiateProfile();
			
			MentonRemoteClassRegistry.registerAllClasses();
			
			PraiaContext.ME.engineDataHandler
				.register(GameWelcome, new GameWelcomeCommand())
				.register(MentonJackpot, new MentonJackpotCommand());
		}
		
		override public function start(mainCallback: Function = null): void
		{
			super.start(mainCallback);
			startInner();
			AssukarRemoteConnector.ME.connect(AssukarRemoteConnector.ENGINE, initiate);
		}

		override protected function initiate(): void
		{
			super.initiate();
			PraiaContext.ME.engineDataSource.send(new MentonHello());
		}

		override public function dispose(): void
		{
			super.dispose();
			
			PraiaContext.ME.engineDataHandler
				.unregister(GameWelcome)
				.unregister(MentonJackpot);

			Context.gameWelcome = null;

			MentonEngine.ME.dispose();
			NewRoundControlCommand.ME.dispose();
			ExtraControlCommand.ME.dispose();
			BonusCommand.ME.dispose();
			Config.ME.dispose();
		}
	}
}
