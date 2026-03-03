package com.assukar.praia.menton.domain
{
	import com.assukar.airong.ds.LinkedList;
	import com.assukar.domain.domain.StatsMoney;
	import com.assukar.praia.domain.games.vbs.MentonVBB;
	import com.assukar.praia.domain.viphours.VipHours;
	import com.assukar.praia.menton.main.MentonEngine;

	/**
	 * @author Johnatan
	 */
	public class PatternGroup
	{
		// min extra/super extra priorities
        static public var EXTRA_MIN_PRIORITY: int = 2;//2
        static public var SUPER_EXTRA_MIN_PRIORITY: int = 4;//4;
        static public var HALT_FOR_USER_MIN_PRIORITY: int = 3;//3
        static public var MIN_PEELING_COLOR_PRIORITY: int = 3;//3
		// patterns
		static public const FULL: PatternGroup = new PatternGroup("FULL", 500, 6, MentonJackpotSession.ME);
		static public const QUAD_COLUMN_3: PatternGroup = new PatternGroup("QUAD_COLUMN_3", 250, 5);
		static public const QUAD_COLUMN: PatternGroup = new PatternGroup("QUAD_COLUMN", 120, 4);
		static public const DOUBLE_LINE: PatternGroup = new PatternGroup("DOUBLE_LINE", 80, 3);
		static public const TRIPLE_COLUMN: PatternGroup = new PatternGroup("TRIPLE_COLUMN", 30, 2);
		static public const DOUBLE_COLUMN: PatternGroup = new PatternGroup("DOUBLE_COLUMN", 4, 1);
		static public const LINE: PatternGroup = new PatternGroup("LINE", 4, 1);
		static public const ALL: LinkedList = new LinkedList()
				.addArray([FULL, QUAD_COLUMN_3, QUAD_COLUMN, DOUBLE_LINE, TRIPLE_COLUMN, DOUBLE_COLUMN, LINE]);

		public var id: String;
		internal var extra: Boolean;
		internal var superExtra: Boolean;
		public var priority: int;
		private var linkage: PatternLinkage;
		private var payoutt: StatsMoney = new StatsMoney();
		private var pendingVipHourFullMatches: int = 0;

		public static function fromId(id: String): PatternGroup
		{
			return ALL.findAny(function (pg: PatternGroup): Boolean
			{
				return pg.id == id;
			});
			return null;
		}
		
		public function get basePayout(): StatsMoney
		{
			return payoutt;
		}
		
		public function getStraightPayout(stake: int): int
		{
			return payoutt.coins * stake;
		}
		
		public function toString(): String
		{
			return "{" + id + "}";
		}		
		
		function PatternGroup(id: String, coinPayout: int, priority: int, linkage: PatternLinkage = null, zeroPayout: Boolean = false)
		{
			this.id = id;
			payoutt.coins = coinPayout;
			
			this.priority = priority;
			this.linkage = linkage;
			this.zeroPayout = zeroPayout;
			
			extra = priority>=EXTRA_MIN_PRIORITY;
			superExtra = priority>=SUPER_EXTRA_MIN_PRIORITY;
		}

		public function setTest(enable:Boolean):void {
			extra = enable ? false : priority>=EXTRA_MIN_PRIORITY;
			superExtra = enable ? false : priority>=SUPER_EXTRA_MIN_PRIORITY;
		}
		
		public function activate(round: Round): void
		{
			if (linkage && linkage.isValid(round)) linkage.activate(round);
			
			if (VipHours.ME
			&& VipHours.ME.running(MentonVBB.ME)
			&& (this == fromId(VipHours.ME.getPatternGroupId())))
			{
				pendingVipHourFullMatches++;
			}			
		}

		public function getPayoutExpectation(stake: int): int
		{
			if (linkage && linkage.isValid(MentonEngine.ME.round&&!MentonEngine.ME.round.roundEnded?MentonEngine.ME.round:null))
			{
				return linkage.getExpectation();
			}
			else
			{
				return payoutt.coins * stake;
			}
		}
		
		private var zeroPayout: Boolean = false;
		
		public function getPayout(stake: int): int
		{
			if (zeroPayout)
			{
				return 0;
			}
			else
			{
				if (linkage && linkage.isValid(MentonEngine.ME.round&&!MentonEngine.ME.round.roundEnded?MentonEngine.ME.round:null))
				{
					return linkage.getFinalPayout();
				}
				else
				{
					return payoutt.coins * stake;
				}
			}
		}

		// Vip Hour //
		public function resetVipHoursMatches():void
		{
			pendingVipHourFullMatches = 0;
		}

		public function notifyFullMatchMotion(): void
		{
			if (pendingVipHourFullMatches)
			{
				VipHours.ME.grant(payoutt.coins * MentonEngine.ME.newRound.unitaryStake * pendingVipHourFullMatches);
				pendingVipHourFullMatches = 0;
			}
		}
	}
}
