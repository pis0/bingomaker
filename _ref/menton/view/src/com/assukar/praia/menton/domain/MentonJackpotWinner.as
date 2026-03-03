
package com.assukar.praia.menton.domain
{
	import com.assukar.airong.utils.Statics;
	import com.assukar.domain.domain.UserInfo;
	import com.assukar.engine.remoting.domain.ReplyDto;
import com.assukar.engine.utils.AntiCheatInt;

import flash.utils.IDataInput;
	/**
	 * @author Johnatan
	 */
	public class MentonJackpotWinner
	extends ReplyDto
	{
    	public var valuee: AntiCheatInt = new AntiCheatInt(0);
    	private var millisAgo: int;
		public var percentage: int;
		public var uinfo: UserInfo;

		private function get value():int { return valuee.value; }
		private function set value(value:int):void { valuee.value = value; }

		public function get minutes(): int
		{
			return int((millisAgo%Statics.HOUR)/Statics.MINUTE);
		}
		
		public function get hours(): int
		{
			return int(millisAgo/Statics.HOUR);
		}
		
		override public function readExternal(input: IDataInput):void
		{
			valuee.value = input.readInt();
			percentage = input.readInt();
			millisAgo = input.readInt();
			uinfo = input.readObject();
		}
	}
}
