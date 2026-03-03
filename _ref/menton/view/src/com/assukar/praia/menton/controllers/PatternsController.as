package com.assukar.praia.menton.controllers {
	import com.assukar.airong.ds.Cursor;
	import com.assukar.airong.utils.Singleton;
	import com.assukar.praia.menton.components.payouts.PayoutTable;
	import com.assukar.praia.menton.domain.CardMatches;
	import com.assukar.praia.menton.domain.MissingPatternsHolder;
	import com.assukar.praia.menton.domain.Pattern;
	import com.assukar.praia.menton.domain.PatternGroup;

	import flash.geom.Point;
	import flash.utils.Dictionary;


	/**
	 * @author Johnatan
	 */
	public class PatternsController
	{
		// singleton
		static public var ME: PatternsController;

		public function dispose(): void
		{
			ME = null;
			
//			FULL_COUNTER_DATA.clear();
//			FULL_COUNTER_LIST = null;
		}

		public function PatternsController()
		{
			Singleton.enforce(ME);
			clearFullCounter();
			
//			while (FULL_COUNTER_LIST.length)
//			{
//				FULL_COUNTER_DATA.writeUnsignedInt(FULL_COUNTER_LIST.shift());
//				FULL_COUNTER_DATA.writeUnsignedInt(FULL_COUNTER_LIST.shift());
//			}
		}

		// object vars		
//		public var maxPriority: int = 1;
//		public var maxMissingPriority: int = 1;

		public function clear(animate:Boolean = true, restart:Boolean = true): void
		{
			PayoutTable.ME.clear(animate, restart);
//			if (BonusSession.ME.active) PayoutTable.ME.setStake(stake);
//			PayoutTable.ME.setStake(stake);
//			PayoutTable.ME.setBonusSpins(Bonus.ME.getSpins());
//			PayoutTable.ME.setJackpotPercentage(MentonJackpot.getPercentage());
		}
		
		public function stopAnimas():void{
			PayoutTable.ME.stopAll();
		}

		private var stake: int;
		public function updateStakes(stake: int): void
		{
			this.stake = stake;
			//clear();
			PayoutTable.ME.setStake(stake);
//			PayoutTable.ME.setStake(stake);
		}

		private var c: Cursor;
		private var p: Pattern;
		private var len: int;
		private var xps: Vector.<MissingPatternsHolder>;
		private var xp: MissingPatternsHolder;
		
		public function updateMissingPatterns(lastCardMatches: Vector.<CardMatches>): void
		{
			len = lastCardMatches.length;
			for (var i: int = 0; i < len; i++)
			{
				var match: CardMatches = lastCardMatches[i];
				if (match)
				{
					for (var x: int = 0; x < 3; x++)
					{
						xps = match.xpectations[x];
						for (var y: int = 0; y < 5; y++)
						{
							xp = xps[y];
							if (xp)
							{
								c = xp.list.cursor;
								while (c.next)
								{
									p = c.current;
									PayoutTable.ME.getPayoutCard(p).missing(i, new Point(x, y),p);
								}
							}
						}
					}
				}
			}
		}

		public function updateFullPatterns(lastCardMatches: Vector.<CardMatches>): void
		{
			clearFullCounter();
			len = lastCardMatches.length;
			
			var pattern:Pattern;
			
			for (var i: int = 0; i < len; i++)
			{
				var match: CardMatches = lastCardMatches[i];
				if (match)
				{
					c = match.patterns.cursor;
					while (c.next)
					{
						pattern = c.current as Pattern;
						setFullCounter(pattern.group, getFullCounter(pattern.group) + 1);
						
						PayoutTable.ME.overlayPattern(i, pattern);
						PayoutTable.ME.getPayoutCard(pattern).full(i, pattern.matchArray);
						PayoutTable.ME.getPayoutCard(pattern).ammount = getFullCounter(pattern.group);
						
						
					}
				}
			}
		}
		
		
//		private const FULL_COUNTER_DATA : ByteArray = new ByteArray();
		private var FULL_COUNTER_DICTIONARY : Dictionary = new Dictionary();
//		private var FULL_COUNTER_LIST : Array = [//
//		PatternGroup.LINE.priority, 0,
//		PatternGroup.DOUBLE_COLUMN.priority, 0,
//		PatternGroup.TRIPLE_COLUMN.priority, 0,
//		PatternGroup.DOUBLE_LINE.priority, 0,
//		PatternGroup.QUAD_COLUMN.priority, 0,
//		PatternGroup.QUAD_COLUMN_3.priority, 0,
//		PatternGroup.FULL.priority, 0
//		];
		
		public function getFullCounter(patternGroup:PatternGroup) : int
		{
			return FULL_COUNTER_DICTIONARY[patternGroup];
			
//			var priorityTemp: uint;
//			FULL_COUNTER_DATA.position = 0;
//			while (FULL_COUNTER_DATA.bytesAvailable)
//			{
//				priorityTemp = FULL_COUNTER_DATA.readUnsignedInt();
//				if (priorityTemp==priority)
//				{
//					return FULL_COUNTER_DATA.readUnsignedInt();
//				}
//				FULL_COUNTER_DATA.readUnsignedInt();
//			}
//			
//			return 0x0;
		}
		
		private function setFullCounter(patternGroup:PatternGroup, newValue:uint):void
		{
			FULL_COUNTER_DICTIONARY[patternGroup] = newValue;
			
//			var priorityTemp: uint;
//			FULL_COUNTER_DATA.position = 0;
//			while (FULL_COUNTER_DATA.bytesAvailable)
//			{
//				priorityTemp = FULL_COUNTER_DATA.readUnsignedInt();
//				if (priorityTemp==priority)
//				{
//					FULL_COUNTER_DATA.writeUnsignedInt(newValue);
//					return;
//				}
//				FULL_COUNTER_DATA.readUnsignedInt();
//			}
		}
		
		public function clearFullCounter(): void
		{
			FULL_COUNTER_DICTIONARY[PatternGroup.LINE] = 0;
			FULL_COUNTER_DICTIONARY[PatternGroup.DOUBLE_COLUMN] = 0;
			FULL_COUNTER_DICTIONARY[PatternGroup.TRIPLE_COLUMN] = 0;
			FULL_COUNTER_DICTIONARY[PatternGroup.DOUBLE_LINE] = 0;
			FULL_COUNTER_DICTIONARY[PatternGroup.QUAD_COLUMN] = 0;
			FULL_COUNTER_DICTIONARY[PatternGroup.QUAD_COLUMN_3] = 0;
			FULL_COUNTER_DICTIONARY[PatternGroup.FULL] = 0;
			
//			FULL_COUNTER_DATA.position = 0;
//			while (FULL_COUNTER_DATA.bytesAvailable)
//			{
//				FULL_COUNTER_DATA.readUnsignedInt();
//				FULL_COUNTER_DATA.writeUnsignedInt(0x0);
//			}
		}
	}
}
