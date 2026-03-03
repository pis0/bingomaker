package com.assukar.praia.menton.domain
{
	import com.assukar.airong.ds.Cursor;
	import com.assukar.airong.ds.LinkedList;
	import com.assukar.engine.utils.AntiCheatInt;
	/**
	 * @author Johnatan
	 */
	public class MissingPatternsHolder
	{
		public var list: LinkedList = new LinkedList();
		private var xp: int = -1;
		private var patterns: LinkedList;
		public var maxPriority: int;
		public var doubleLinePattern: Pattern;
		private var _stake: AntiCheatInt = AntiCheatInt.ZERO;
		public function get stake():int {
			return _stake.value;
		}
		public function set stake(value:int):void {
			_stake.value = value;
		}
		
		public function dispose(): void
		{
			list.clear();
			if (patterns) patterns.clear();
		}
		
		public function clone(): MissingPatternsHolder
		{
			var clone: MissingPatternsHolder = new MissingPatternsHolder(stake, null);
			clone.list = list.clone() as LinkedList;
			clone.xp = expectation;
			clone.maxPriority = maxPriority;
			clone.doubleLinePattern = doubleLinePattern;
			return clone;
		}
		
		public function MissingPatternsHolder(stake: int, patterns: LinkedList)
		{
			this.stake = stake;
			this.patterns = patterns;
		}
		
		public function addPattern(p: Pattern): void
		{
			p.removeChildren(list, stake);
			list.push(p);
			xp = -1;
		}
		
		public function get expectation(): int
		{
			if (xp == -1)
			{
				xp = 0;
				maxPriority = 0;
				doubleLinePattern = null;
				
				var pattsCopy: LinkedList = LinkedList(patterns.clone());
				var c: Cursor = list.cursor;
				var p: Pattern;
				while (c.next)
				{
					p = Pattern(c.current);
					
					xp -= p.simulateRemoveChildren(pattsCopy, stake);
					xp += p.group.getPayoutExpectation(stake);
					maxPriority = Math.max(maxPriority, p.group.priority);
					
					if (p.group == PatternGroup.DOUBLE_LINE) doubleLinePattern = p;
				}
			}
			
			return xp;
		}
	}
}
