package com.assukar.praia.menton.domain
{
	import flash.utils.IDataOutput;
	/**
	 * @author Johnatan
	 */
	public class MentonJackpotRequest
	extends MentonRequest	
	{
		override public function writeExternal(output: IDataOutput): void
		{
			super.writeExternal(output);
//			output.writeObject(PraiaPlayerInfo.ME.locale);
			output.writeInt(MentonJackpotSession.ME.consumeJuice());
		}		
	}
}