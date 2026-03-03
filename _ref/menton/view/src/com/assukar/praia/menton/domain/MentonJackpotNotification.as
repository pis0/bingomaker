package com.assukar.praia.menton.domain
{
	import flash.utils.IDataOutput;
	/**
	 * @author Johnatan
	 */
	public class MentonJackpotNotification
	extends MentonRequest	
	{
		private var percentage: int;
		private var value: int;
		
		public function MentonJackpotNotification(value: int = 0, percentage: int = 0)
		{
			this.value = value;
			this.percentage = percentage;
		}
		
		override public function writeExternal(output: IDataOutput): void
		{
			super.writeExternal(output);
//			output.writeObject(PraiaPlayerInfo.ME.locale);
			output.writeInt(value);
			output.writeInt(percentage);
		}		
	}
}