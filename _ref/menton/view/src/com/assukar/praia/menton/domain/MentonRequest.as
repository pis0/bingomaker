package com.assukar.praia.menton.domain
{
	import com.assukar.domain.domain.games.GameRequest;
	import com.assukar.domain.singles.SinglesInterceptable;
	import com.assukar.praia.domain.games.vbs.MentonVBB;
	import com.assukar.praia.menton.main.Context;
	/**
	 * @author Johnatan
	 */
	public class MentonRequest
	extends GameRequest
	implements SinglesInterceptable
	{
		function MentonRequest()
		{
			super(MentonVBB.ME, Context.gameWelcome?Context.gameWelcome.gameSessionId:null);
		}
	}
}
