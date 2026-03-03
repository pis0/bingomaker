package com.assukar.praia.menton.domain 
{
	import com.assukar.airong.ds.Cursor;
	import com.assukar.airong.ds.LinkedList;
	import com.assukar.airong.ds.NumberLinkedList;
	import com.assukar.engine.utils.AntiCheatInt;

	public class Card
	{
		public var index: int;
		// list of balls (int)
		public var numbersList: NumberLinkedList = new NumberLinkedList();
		// is active?
		private var active: Boolean = true;
		
		// list of numbers
		internal var numbers: Vector.<Vector.<int>>;
		
		// 1: match, 0, not matched
		internal var matches: Vector.<Vector.<Boolean>>;

		// list of expectations
		internal var expectations: Vector.<Vector.<MissingPatternsHolder>>;
		
		// list of numbers that belongs to at least 1 pattern
		internal var patternMatches: Vector.<Vector.<Boolean>>;
		
		internal var lines: Vector.<int>;
		internal var columns: Vector.<int>;
		
		internal var lastMatchLine: int;
		internal var lastMatchColumn: int;
		
		private const missingOnePatterns: LinkedList = new LinkedList();
		public const patterns: LinkedList = new LinkedList();
		private var newPatterns: LinkedList = new LinkedList();
		private var newMissingPatterns: LinkedList = new LinkedList();
		
		private var _baseAdditionalPayout: AntiCheatInt = AntiCheatInt.ZERO;
		
		private var newRound: NewRound;
		
		public function getExpectation(i: int, j: int): MissingPatternsHolder
		{
			return expectations[i][j];
		}
		
		public function patternsToString(): String
		{
			var str: String = "";
			var c: Cursor = Pattern.patterns;
			while (c.next)
			{
				var p: Pattern = c.current;
				if (patterns.contains(p))
				{
					str += p;
					if (newPatterns.contains(p)) str += "!";
					str + "\n";
				}
				if (missingOnePatterns.contains(p))
				{
					str += "[" + p + "]";
					if (newMissingPatterns.contains(p)) str += "!";
					str + "\n";
				}
			}
			return str;
		}
		
		public function simplePatternsToString(): String
		{
			var str: String = "";
			var c: Cursor;
			c = patterns.cursor;
			while (c.next) str += Pattern(c.current).id + " ";
			c = missingOnePatterns.cursor;
			while (c.next) str += "%" + Pattern(c.current).id + "% ";
			return str;
		}		
		
		function Card(newRound: NewRound, index: int)
		{
			this.newRound = newRound;	
			this.index = index;
		}
		
		public function setNumbers(nlist: LinkedList, from: int, to: int): void
		{
			numbersList.clear();
			numbersList.addAllFrom(nlist, from, to);
			numbersList.sort();
		}
		
		public function isActive(): Boolean
		{
			return active;
		}

		public function swapActive(): Boolean	
		{
			active = !active;
			return active;
		}

		internal function reset(cardsByBalls: Vector.<Card>): void
		{
			numbers = new Vector.<Vector.<int>>(3);
			matches = new Vector.<Vector.<Boolean>>(3);
			expectations = new Vector.<Vector.<MissingPatternsHolder>>(3);
			patternMatches = new Vector.<Vector.<Boolean>>(3);
			
			lines = new Vector.<int>(91);
			columns = new Vector.<int>(91);
			
			lastMatchLine = -1;
			lastMatchColumn = -1;
			
//			Utils.printStackTrace();
			missingOnePatterns.clear();
			patterns.clear();
			
			var i: int;
			
			for (i = 0; i < 3; i++)
			{
				numbers[i] = new Vector.<int>(5);
				matches[i] = new Vector.<Boolean>(5);
				expectations[i] = new Vector.<MissingPatternsHolder>(5);
				patternMatches[i] = new Vector.<Boolean>(5);
			}
			
			var xx: int;
			var yy: int;
			var c: Cursor = numbersList.cursor;
			i = 0;
			while (c.next)
			{
				var number: int = c.current;
				if (cardsByBalls) cardsByBalls[number] = this;
				xx = i%3;
				yy = int(i/3);
				numbers[xx][yy] = number;
				lines[number] = xx;
				columns[number] = yy;
				i++;
			}
		}
		
		public function toString(): String
		{
			var str: String = "Card[" + index + (active?"":" OFF") + "]";
			
			for (var i: int = 0; i < 3; i++)
			{
				str += "\n";
				for (var j: int = 0; j < 5; j++)
				{
					str += numbers[i][j];
					if (matches[i][j]) str += "X"; else str += " ";
					str += " ";
				}
			}
			
			str += "\n" + simplePatternsToString();
			
			return str;
		}
		
		private var vv: Vector.<Boolean>;
		private var r: Vector.<Vector.<Boolean>>;
		private var rr: Vector.<Boolean>;
		
		private function copyVec(vec: Vector.<Vector.<Boolean>>): Vector.<Vector.<Boolean>>	
		{
			r = new Vector.<Vector.<Boolean>>(3);
			for (var i: int = 0; i < 3; i++)
			{
				vv = vec[i];
				r[i] = rr = new Vector.<Boolean>(5);
				for (var j: int = 0; j < 5; j++) rr[j] = vv[j];
			}
			return r;			
		}
		
		private var h: MissingPatternsHolder;
		private var xp: Vector.<MissingPatternsHolder>;
		private var exp: Vector.<MissingPatternsHolder>;
		private function copyExpectations(): Vector.<Vector.<MissingPatternsHolder>>
		{
			var xpz: Vector.<Vector.<MissingPatternsHolder>> = new Vector.<Vector.<MissingPatternsHolder>>(3);
			for (var i: int = 0; i < 3; i++)
			{
				xp = xpz[i] = new Vector.<MissingPatternsHolder>(5);
				exp = expectations[i];
				for (var j: int = 0; j < 5; j++)
				{
					if (exp[j]) xp[j] = exp[j].clone();
				}
			}
			return xpz;
		}
		
		internal function produceCardMatches(): CardMatches
		{
			return new CardMatches(
				this,
				missingOnePatterns?LinkedList(missingOnePatterns.clone()):null, 
				patterns?LinkedList(patterns.clone()):null,
				newPatterns?LinkedList(newPatterns.clone()):null,  
				newMissingPatterns?LinkedList(newMissingPatterns.clone()):null,  
				copyVec(matches),
				copyVec(patternMatches), 
				copyExpectations(),
				lastMatchLine, 
				lastMatchColumn,
				baseAdditionalPayout);
		}
		
		internal function setMatch(ball: int): void
		{
			baseAdditionalPayout = 0;
			
			lastMatchLine = lines[ball]; 
			lastMatchColumn = columns[ball]; 
			
			matches[lastMatchLine][lastMatchColumn] = true;
			expectations[lastMatchLine][lastMatchColumn] = null;
		}
		
		internal function resetNewPatterns(): void
		{
			newPatterns.clear();
			newMissingPatterns.clear();
		}
		
		internal function setPattern(pattern: Pattern, round: Round): void
		{
			if (patterns.contains(pattern)) return;
			
			for (var i: int = 0; i < 15; i++)
			{
				if (pattern.matchArray[i] == "X") patternMatches[int(i/5)][i%5] = true; 
			}
			
			baseAdditionalPayout += pattern.group.getPayout(newRound.unitaryStake) - pattern.removeChildren(patterns, newRound.unitaryStake);
			
			patterns.push(pattern);
			newPatterns.push(pattern);
			
			missingOnePatterns.removeObject(pattern);
			
			pattern.activate(round);
		}
		
		internal function setMissingOnePattern(pattern: Pattern): void
		{
			if (missingOnePatterns.contains(pattern)) return;
			
			var i: int = 0;
			var len: int = pattern.matchArray.length;
			var xx: int;
			var yy: int;
			for (i; i < len; i++)
			{
				if (pattern.matchArray[i] == "X")
				{
					xx = int(i/5);
					yy = i%5;
					
					if (!matches[xx][yy])
					{
						h = expectations[xx][yy];
						if (!h) expectations[xx][yy] = h = new MissingPatternsHolder(newRound.unitaryStake, patterns);
						h.addPattern(pattern);
						
						break;
					}
				}
			}
			
			pattern.removeChildren(missingOnePatterns, newRound.unitaryStake);
			
			newMissingPatterns.push(pattern);
			missingOnePatterns.push(pattern);
		}
		
		public function hasExtraMissingPattern(): Boolean	
		{
			var c: Cursor = missingOnePatterns.cursor;
			
			while (c.next)
			{
				var pattern: Pattern = c.current;
				if (pattern.group.extra) return true;
			}
			
			return false;			
		}
		
		public function hasExtraEnablingPattern(): Boolean	
		{
			var c: Cursor;
			
			c = missingOnePatterns.cursor;
			while (c.next)
			{
				if (Pattern(c.current).group.extra) return true;
			}
			c = patterns.cursor;
			while (c.next)
			{
				if (Pattern(c.current).group.extra) return true;
			}
			
			return false;			
		}		
		
		public function hasSuperExtraEnablingPattern(): Boolean	
		{
			var c: Cursor;
			
			c = missingOnePatterns.cursor;
			while (c.next)
			{
				if (Pattern(c.current).group.superExtra) return true;
			}
			c = patterns.cursor;
			while (c.next)
			{
				if (Pattern(c.current).group.superExtra) return true;
			}
			
			return false;			
		}		
		
		
//		public function calculateMissingOnePayout(): Number	
//		{
//			var coins: Number = 0;
//			var c: Cursor = missingOnePatterns.cursor;
//			while (c.next)
//			{
//				coins += Pattern(c.current).group.getPayoutExpectation(newRound.unitaryStake);
//			}
//			return coins;
//		}
		
		public function calculateXp(): Number
		{
			var coins: Number = 0;
			var xps: Vector.<MissingPatternsHolder>;
			for (var i: int = 0; i < 3; i++)
			{
				xps = expectations[i];
				for (var j: int = 0; j < 5; j++) if (xps[j]) coins += xps[j].expectation;
			}			
			return coins;
		}		
				
		public function getPayout(baseStake: int): int
		{
			var payout: int = 0;
			var c: Cursor = patterns.cursor;
			while (c.next)
			{
				payout += Pattern(c.current).group.getPayout(baseStake);
			}
			return payout;
		}
		
		public function get baseAdditionalPayout():int {
			return _baseAdditionalPayout.value;
		}
		
		public function set baseAdditionalPayout(value:int):void {
			_baseAdditionalPayout.value = value;
		}
	}
}
