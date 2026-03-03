package com.assukar.praia.menton.domain
{
	import com.assukar.airong.ds.LinkedList;
	import com.assukar.airong.utils.Statics;
	import com.assukar.engine.remoting.IgnoreCommandFailure;
	import com.assukar.engine.remoting.RemotingUtils;
	import com.assukar.engine.remoting.domain.ReplyDto;
import com.assukar.engine.utils.AntiCheatInt;
import com.assukar.praia.menton.main.MentonEngine;

	import flash.utils.IDataInput;
	
	/**
	 * @author Johnatan
	 */
	public class MentonJackpot
	extends ReplyDto
	implements IgnoreCommandFailure
	{
		// consts
		static public const MIN_VALUE: int = 5000;
		static public const BALL_KICK_THRESHOLDS: Vector.<int> = new <int>[20000,30000,40000,50000,60000];
		static private const PERCENTAGES_BY_STAKE_INDEX: Vector.<int> =
//			new <int>[10, 20, 40, 60, 100, 250, 500, 1000];
			new <int>[10, 20, 40, 60, 100, 250, 350, 500];
		
		static public function getPercentage(): int
		{
			return PERCENTAGES_BY_STAKE_INDEX[MentonEngine.ME.newRound.stakeIndex];
		}
		
//		static public function getBallKickThresholds(): int
//		{
//			return BALL_KICK_THRESHOLDS[MentonEngine.ME.newRound.stakeIndex];
//		}
		
		// value in coins
		public var valuee: AntiCheatInt = new AntiCheatInt(0);
		// list of MentonJackpotWinner
		public var winners: LinkedList = new LinkedList();
		private var lastUpdate: Date;

		public function get value():int { return valuee.value; }
		public function set value(value:int):void { valuee.value = value; }

		public function get validUpdate(): Boolean
		{
			if (lastUpdate) return new Date().time - lastUpdate.time < Statics.HOUR;
			else return false;
		}
		
		override public function readExternal(input: IDataInput):void
		{
			value = int(input.readFloat());
			RemotingUtils.readCollection(input, winners);
			while (winners.size > 3) winners.removeLast();
			
			lastUpdate = new Date();
		}
	}
}
