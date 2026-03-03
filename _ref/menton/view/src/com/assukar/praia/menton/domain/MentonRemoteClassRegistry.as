package com.assukar.praia.menton.domain
{
	import com.assukar.engine.net.ClassRegistry;

	public class MentonRemoteClassRegistry
	{
		static private var registered: Boolean = false;

		static public function registerAllClasses(): void
		{
			if (registered) return;
			registered = true;

			ClassRegistry.get()
			
			// dtos
				.register("meh", MentonHello)
				.register("mej", MentonJackpot)
				.register("mejr", MentonJackpotRequest)
				.register("mejw", MentonJackpotWinner)
				.register("mejn", MentonJackpotNotification)	
			;
		}
	}
}
