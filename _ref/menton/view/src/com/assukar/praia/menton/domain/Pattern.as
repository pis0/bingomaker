package com.assukar.praia.menton.domain 
{
	import com.assukar.airong.ds.Cursor;
	import com.assukar.airong.ds.LinkedList;
	import com.assukar.airong.utils.Utils;
	
	public class Pattern
	{
		static private var patternsStarted: Boolean = false;
		static public const sortedPatterns: LinkedList = new LinkedList();	
		
		static public function resetPatterns(): void
		{
			var c: Cursor = sortedPatterns.cursor;
			var p: Pattern;
			while (c.next)
			{
				p = Pattern(c.current); 
				p.markedFullMatch = false;
				p.markedMissingMatch = false;
			}
		}
		
		static public function get patterns(): Cursor
		{
			return sortedPatterns.cursor;
		}
			
		static public function start(): void
		{
			if (patternsStarted) return;
			patternsStarted = true;
			
			sortedPatterns.addArray([ //
				FULL, //
				QUAD_COLUMN_1, //
				QUAD_COLUMN_2, //
				QUAD_COLUMN_3, //
				DOUBLE_LINE_1, //
				DOUBLE_LINE_2, //
				DOUBLE_LINE_3, //
				TRIPLE_COLUMN_1, //
				TRIPLE_COLUMN_2, //
				TRIPLE_COLUMN_3, //
				DOUBLE_COLUMN_1,
				DOUBLE_COLUMN_2,
				DOUBLE_COLUMN_3,
				DOUBLE_COLUMN_4,
				LINE_1, //
				LINE_2, //
				LINE_3]);
				
			QUAD_COLUMN_1.setParents(FULL);
			QUAD_COLUMN_2.setParents(FULL);
			QUAD_COLUMN_3.setParents(FULL);
			
			DOUBLE_LINE_1.setParents(FULL);
			DOUBLE_LINE_2.setParents(FULL);
			DOUBLE_LINE_3.setParents(FULL);
			
			TRIPLE_COLUMN_1.setParents(QUAD_COLUMN_1);
			TRIPLE_COLUMN_2.setParents(QUAD_COLUMN_1, QUAD_COLUMN_2);
			TRIPLE_COLUMN_3.setParents(QUAD_COLUMN_2);

			DOUBLE_COLUMN_1.setParents(TRIPLE_COLUMN_1, QUAD_COLUMN_3);
			DOUBLE_COLUMN_2.setParents(TRIPLE_COLUMN_1, TRIPLE_COLUMN_2);
			DOUBLE_COLUMN_3.setParents(TRIPLE_COLUMN_2, TRIPLE_COLUMN_3);
			DOUBLE_COLUMN_4.setParents(TRIPLE_COLUMN_3, QUAD_COLUMN_3);
			
			LINE_1.setParents(DOUBLE_LINE_1, DOUBLE_LINE_2);
			LINE_2.setParents(DOUBLE_LINE_1, DOUBLE_LINE_3);
			LINE_3.setParents(DOUBLE_LINE_2, DOUBLE_LINE_3);
		}
		
		static public const FULL: Pattern = new Pattern("FULL", PatternGroup.FULL, //
			"XXXXX" + //
			"XXXXX" + //
			"XXXXX");
			
		static public const QUAD_COLUMN_1: Pattern = new Pattern("QUAD_COLUMN_1", PatternGroup.QUAD_COLUMN, // 
			"XXXX_" + //
			"XXXX_" + //
			"XXXX_");
		static public const QUAD_COLUMN_2: Pattern = new Pattern("QUAD_COLUMN_2", PatternGroup.QUAD_COLUMN, // 
			"_XXXX" + //
			"_XXXX" + //
			"_XXXX");
			
		static public const QUAD_COLUMN_3: Pattern = new Pattern("QUAD_COLUMN_3", PatternGroup.QUAD_COLUMN_3, // 
			"XX_XX" + //
			"XX_XX" + //
			"XX_XX");
			
		static public const DOUBLE_LINE_1: Pattern = new Pattern("DOUBLE_LINE_1", PatternGroup.DOUBLE_LINE, // 
			"XXXXX" + //
			"XXXXX" + //
			"_____");
		static public const DOUBLE_LINE_2: Pattern = new Pattern("DOUBLE_LINE_2", PatternGroup.DOUBLE_LINE, // 
			"XXXXX" + //
			"_____" + //
			"XXXXX");
		static public const DOUBLE_LINE_3: Pattern = new Pattern("DOUBLE_LINE_3", PatternGroup.DOUBLE_LINE, // 
			"_____" + //
			"XXXXX" + //
			"XXXXX");
			
		static public const TRIPLE_COLUMN_1: Pattern = new Pattern("TRIPLE_COLUMN_1", PatternGroup.TRIPLE_COLUMN, // 
			"XXX__" + //
			"XXX__" + //
			"XXX__");
		static public const TRIPLE_COLUMN_2: Pattern = new Pattern("TRIPLE_COLUMN_2", PatternGroup.TRIPLE_COLUMN, // 
			"_XXX_" + //
			"_XXX_" + //
			"_XXX_");
		static public const TRIPLE_COLUMN_3: Pattern = new Pattern("TRIPLE_COLUMN_3", PatternGroup.TRIPLE_COLUMN, // 
			"__XXX" + //
			"__XXX" + //
			"__XXX");

		static public const DOUBLE_COLUMN_1: Pattern = new Pattern("DOUBLE_COLUMN_1", PatternGroup.DOUBLE_COLUMN, // 
			"XX___" + //
			"XX___" + //
			"XX___");
		static public const DOUBLE_COLUMN_2: Pattern = new Pattern("DOUBLE_COLUMN_2", PatternGroup.DOUBLE_COLUMN, // 
			"_XX__" + //
			"_XX__" + //
			"_XX__");
		static public const DOUBLE_COLUMN_3: Pattern = new Pattern("DOUBLE_COLUMN_3", PatternGroup.DOUBLE_COLUMN, // 
			"__XX_" + //
			"__XX_" + //
			"__XX_");
		static public const DOUBLE_COLUMN_4: Pattern = new Pattern("DOUBLE_COLUMN_4", PatternGroup.DOUBLE_COLUMN, // 
			"___XX" + //
			"___XX" + //
			"___XX");
			
		static public const LINE_1: Pattern = new Pattern("LINE_1", PatternGroup.LINE, // 
			"XXXXX" + //
			"_____" + //
			"_____");
		static public const LINE_2: Pattern = new Pattern("LINE_2", PatternGroup.LINE, // 
			"_____" + //
			"XXXXX" + //
			"_____");
		static public const LINE_3: Pattern = new Pattern("LINE_3", PatternGroup.LINE, // 
			"_____" + //
			"_____" + //
			"XXXXX");
		
		public var group: PatternGroup;
		
		public var matchArray: Array;
		internal var children: LinkedList = new LinkedList();
		internal var markedFullMatch: Boolean;
		internal var markedMissingMatch: Boolean;
		
		public var id: String;
		
		public var stats_fullMatches: int = 0;
		public function printStats(samples: int): void
		{
			Utils.print(id + ":" + stats_fullMatches + " (" + ((100*stats_fullMatches)/samples) + "%) $" + stats_fullMatches*group.getPayout(1));
		}
		
		public function toString(): String
		{
			return "<" + id + ">";
		}
		
		public function activate(round: Round): void
		{
			group.activate(round);
		}		
		
		function Pattern(id: String, group: PatternGroup, matchString: String)
		{
			this.id = id;
			this.group = group;
			
			matchArray = matchString.split("");
		}		
		
		private function setParents(...parents: *): void
		{
			for each (var parent: Pattern in parents)
			{
				parent.children.push(this);
			}
		}
		
		internal function simulateRemoveChildren(list: LinkedList, stake: int): int
		{
			var invalidatedPayout: int = 0;
			var sublist: LinkedList = new LinkedList();

			var c: Cursor = children.cursor;
			while (c.next)
			{
				var p: Pattern = Pattern(c.current);
				if (list.contains(p))
				{
					invalidatedPayout += p.group.getPayout(stake);
					sublist.push(p);
				}
				else
				{
					invalidatedPayout += p.simulateRemoveChildren(list, stake);
				}
			}
			
			list.removeAll(sublist);
			return invalidatedPayout;
		}
		
		// returns the sum of payouts of the invalidated children
		internal function removeChildren(list: LinkedList, stake: int): int
		{
			var invalidatedPayout: int = 0;
			var sublist: LinkedList = new LinkedList();	

			var c: Cursor = children.cursor;
			while (c.next)
			{
				var p: Pattern = Pattern(c.current);
				if (list.contains(p))
				{
					invalidatedPayout += p.group.getPayout(stake);
					sublist.push(p);
				}
				else
				{
					invalidatedPayout += p.removeChildren(list, stake);
				}
			}
			
			list.removeAll(sublist);
			return invalidatedPayout;
		}
		
		internal function markFullMatch(): void
		{
			if (markedFullMatch) return;
			markedFullMatch = true;
			
			var c: Cursor = children.cursor;
			while (c.next) Pattern(c.current).markFullMatch();
		}
		
		internal function markMissingMatch(): void
		{
			if (markedMissingMatch) return;
			markedMissingMatch = true;
			
			var c: Cursor = children.cursor;
			while (c.next) Pattern(c.current).markMissingMatch();
		}
		
		internal function mark(): void
		{
			markedFullMatch = true;
			markedMissingMatch = true;
		}
				
		/**
		 * returns 0 if it is a match
		 * returns 1 if it is a one-ball-missing pattern
		 */
		internal function check(card: Card): int
		{
			var distance: int = 0;
//			var m: String;
			
			for (var i: int = 0; i < 15; i++)
			{
				if (matchArray[i] == "X")
				{
					if (!card.matches[int(i/5)][i%5]) distance++; 
					if (distance > 1) return distance; 
				}
			}
			return distance;
		}

		public function match(i: int, j: int): Boolean
		{
			return matchArray[i*5+j]=="X";
		}
	}
}
