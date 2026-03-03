package com.assukar.praia.menton.engine.commands
{
	import com.assukar.airong.utils.Singleton;
	import com.assukar.praia.menton.domain.BonusSession;
	import com.assukar.praia.menton.domain.Round;

	/**
	 * @author Johnatan
	 */
	public class BonusCommand
	{
		static public const ME: BonusCommand = new BonusCommand();

		function BonusCommand()
		{
			Singleton.enforce(ME);
		}

		public function dispose(): void
		{
		}
		
		public function execute(round: Round): BonusSession
		{
			return null;
//			BonusSession.ME.activate(round); 
//			return BonusSession.ME;
		}
	}
}
