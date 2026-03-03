package com.assukar.praia.menton.domain
{
	import com.assukar.airong.ds.Cursor;
	import com.assukar.airong.ds.LinkedList;
	import com.assukar.airong.error.AssukarError;
	import com.assukar.airong.utils.Utils;

	public class CardMatches	
	{
		static public const NO_MATCH: int = 0;
		static public const OLD_MATCH: int = 1;
		static public const OLD_MATCH_IN_PATTERN: int = 2;
		static public const NEW_MATCH: int = 3;
		static public const NEW_MATCH_IN_PATTERN: int = 4;
		static public const MISSING_BALL: int = 5;

		private function getStringMatchType(match: int): String
		{
			switch (match)
			{
				case NO_MATCH:
					return " . ";
					break;
				case OLD_MATCH:
					return " X ";
					break;
				case OLD_MATCH_IN_PATTERN:
					return " % ";
					break;
				case NEW_MATCH:
					return "(X)";
					break;
				case NEW_MATCH_IN_PATTERN:
					return "(%)";
					break;
				case MISSING_BALL:
					return "[#]";
					break;
				default:
					throw new AssukarError(match);
			}
		}

		public function toString(): String
		{
			var i: int;
			var j: int;
			var str: String = "\n";
			for (i = 0; i<3; i++)
			{
				for (j = 0; j<5; j++) str += getStringMatchType(matchTypes[i][j]);
				str += "\n";
			}
			
			for (i = 0; i<3; i++)
			{
				for (j = 0; j<5; j++)
				{
					if (xpectations[i][j]) str += (i+1) + ":" + (j+1) + "=" + xpectations[i][j].expectation;  
				}
			}			

			var c: Cursor;

			var fstr: String = "";
			c = patterns.cursor;
			while (c.next)
			{
				if (fstr=="") fstr += "full:";
				fstr += " "+Utils.toString(c.current);
			}
			str += fstr;

			if (missingOnePatterns)
			{
				fstr = "";
				c = missingOnePatterns.cursor;
				while (c.next)
				{
					if (fstr=="") fstr += "\nmissing:";
					fstr += " "+Utils.toString(c.current);
				}
				str += fstr;
			}

			str += "\n"+Utils.toString(additionalPayout);

			return str+"\n";
		}

		public var matchTypes: Vector.<Vector.<int>> = new Vector.<Vector.<int>>(3);
		public var xpectations: Vector.<Vector.<MissingPatternsHolder>>;
		// Last ball line and column
		private var lastMatchLine: int;
		private var lastMatchColumn: int;
		// completed Pattern
		public var patterns: LinkedList;
		// missing-one Pattern
		public var missingOnePatterns: LinkedList;
		// new completed Pattern
		public var newPatterns: LinkedList;
		public var newMissingPatterns: LinkedList;
		public var additionalPayout: int;
		// peel-candidate numbers
		public var colorPeelNumbers: Vector.<int> = new <int>[];
		
		public function dispose(): void
		{
			patterns.clear();
			missingOnePatterns.clear();
			missingOnePatterns.clear();
			newMissingPatterns.clear();
			for (var i: int = xpectations.length-1; i>=0; i--)
			{
				for (var j: int = xpectations[i].length-1; j>=0; j--)
				{
					if (xpectations[i][j]) xpectations[i][j].dispose();
				}
			}
		}		

		function CardMatches(
		card: Card,
		missingOnePatterns: LinkedList, //
		patterns: LinkedList, //
		newPatterns: LinkedList,// 
		newMissingPatterns: LinkedList,// 
		matches: Vector.<Vector.<Boolean>>,// 
		patternMatches: Vector.<Vector.<Boolean>>,//
		xpectations: Vector.<Vector.<MissingPatternsHolder>>,// 
		lastMatchLine: int, //
		lastMatchColumn: int, //
		additionalPayout: int)//
		{
			this.missingOnePatterns = missingOnePatterns;
			this.patterns = patterns;
			this.newPatterns = newPatterns;
			this.newMissingPatterns = newMissingPatterns;
			
			this.xpectations = xpectations;

			this.lastMatchLine = lastMatchLine;
			this.lastMatchColumn = lastMatchColumn;

			this.additionalPayout = additionalPayout;

			var r: int;

			var mt: Vector.<int>;
			var pm: Vector.<Boolean>;
			var mm: Vector.<Boolean>;
			var xps: Vector.<MissingPatternsHolder>;
			var xpp: MissingPatternsHolder;

			for (var line: int = 0; line<3; line++)
			{
				matchTypes[line] = mt = new Vector.<int>(5);

				pm = patternMatches[line];
				mm = matches[line];
				xps = xpectations[line];

				for (var column: int = 0; column<5; column++)
				{
					if ((lastMatchLine==line) && (lastMatchColumn==column))
					{
						if (pm[column]) r = NEW_MATCH_IN_PATTERN;
						else r = NEW_MATCH;
					}
					else
					{
						if (pm[column])
						{
							r = OLD_MATCH_IN_PATTERN;
						}
						else if (mm[column])
						{
							r = OLD_MATCH;
						}
						else if ((xpp = xps[column]) != null)
						{
							r = MISSING_BALL;
							if (xpp.maxPriority >= PatternGroup.MIN_PEELING_COLOR_PRIORITY)
							{
								colorPeelNumbers.push(card.numbers[line][column]);
							}
						}
						else
						{
							r = NO_MATCH;
						}
					}

					mt[column] = r;
				}
			}
		}

		public function get bestNewPattern(): Pattern
		{
			return getMaxPriorityFrom(newPatterns);
		}
		
		public function get maxPriority(): uint
		{
			var p: Pattern = getMaxPriorityFrom(newPatterns);
			return p?p.group.priority:0;
		}

		public function get maxMissingPriority(): uint
		{
			var p: Pattern = getMaxPriorityFrom(newMissingPatterns);
			return p?p.group.priority:0;
		}

		public function getMaxPriorityFrom(llist: LinkedList): Pattern
		{
			if (llist.empty) return null;
			var bestPattern: Pattern = null;
			var c: Cursor = llist.cursor;
			var p: Pattern;
			while (c.next)
			{
				p = c.current as Pattern;
				if (!bestPattern || p.group.priority > bestPattern.group.priority) bestPattern = p;				
			}
			return bestPattern;
		}
	}
}
