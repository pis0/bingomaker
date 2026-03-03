package com.assukar.praia.menton.components.payouts
{
	import com.assukar.praia.menton.domain.Pattern;
	import com.assukar.view.starling.Component;

	import flash.utils.Dictionary;

	public class PayoutTable
	extends Component
	{
		static public const PATTERNS : Vector.<Pattern> = new <Pattern>[//Pattern.LINE_2, // Pattern.DOUBLE_COLUMN_1, Pattern.TRIPLE_COLUMN_1, Pattern.DOUBLE_LINE_2, Pattern.QUAD_COLUMN_3,// Pattern.QUAD_COLUMN_1,// Pattern.FULL// ,
		
		];
		private var patternsCardsList : Vector.<Array>;
		static private var PATTERNS_MAPPING : Dictionary;
		// singleton
		static public var ME : PayoutTable;

		public function PayoutTable()
		{
			ME = singleton(ME);
			if (!PATTERNS_MAPPING)
			{
				PATTERNS_MAPPING = new Dictionary();

				PATTERNS_MAPPING[Pattern.LINE_1] = 0;
				PATTERNS_MAPPING[Pattern.LINE_2] = 0;
				PATTERNS_MAPPING[Pattern.LINE_3] = 0;

				PATTERNS_MAPPING[Pattern.DOUBLE_COLUMN_1] = 1;
				PATTERNS_MAPPING[Pattern.DOUBLE_COLUMN_2] = 1;
				PATTERNS_MAPPING[Pattern.DOUBLE_COLUMN_3] = 1;
				PATTERNS_MAPPING[Pattern.DOUBLE_COLUMN_4] = 1;

				PATTERNS_MAPPING[Pattern.TRIPLE_COLUMN_1] = 2;
				PATTERNS_MAPPING[Pattern.TRIPLE_COLUMN_2] = 2;
				PATTERNS_MAPPING[Pattern.TRIPLE_COLUMN_3] = 2;

				PATTERNS_MAPPING[Pattern.DOUBLE_LINE_1] = 3;
				PATTERNS_MAPPING[Pattern.DOUBLE_LINE_2] = 3;
				PATTERNS_MAPPING[Pattern.DOUBLE_LINE_3] = 3;

				PATTERNS_MAPPING[Pattern.QUAD_COLUMN_1] = 4;
				PATTERNS_MAPPING[Pattern.QUAD_COLUMN_2] = 4;

				PATTERNS_MAPPING[Pattern.QUAD_COLUMN_3] = 5;

				PATTERNS_MAPPING[Pattern.FULL] = 6;
			}

			patternsCardsList = new Vector.<Array>();
			patternsCardsList.push([Pattern.LINE_1, Pattern.LINE_2, Pattern.LINE_3]);
			patternsCardsList.push([Pattern.DOUBLE_COLUMN_1, Pattern.DOUBLE_COLUMN_2, Pattern.DOUBLE_COLUMN_3, Pattern.DOUBLE_COLUMN_4]);
			patternsCardsList.push([Pattern.TRIPLE_COLUMN_1, Pattern.TRIPLE_COLUMN_2, Pattern.TRIPLE_COLUMN_3]);
			patternsCardsList.push([Pattern.DOUBLE_LINE_1, Pattern.DOUBLE_LINE_2, Pattern.DOUBLE_LINE_3]);
			patternsCardsList.push([Pattern.QUAD_COLUMN_1, Pattern.QUAD_COLUMN_2]);
			patternsCardsList.push([Pattern.QUAD_COLUMN_3]);
			patternsCardsList.push([Pattern.FULL]);
		}

		private var cardIndex : Dictionary = new Dictionary();

		public function overlayPattern(index : int, pattern : Pattern) : void
		{
			if (!cardIndex[index]) return;

			cardIndex[index] = pattern;
		}

		override public function dispose() : void
		{
			super.dispose();
			ME = null;
		}

		// object vars
		private var cards : Vector.<PayoutCard>;

		public function getPayoutCard(p : Pattern) : PayoutCard
		{
			return cards[PATTERNS_MAPPING[p]];
		}

		override protected function draww() : void
		{
			cards = new <PayoutCard>[];

			for (var i : int = 0; i < patternsCardsList.length; i++) // 12
			{
				cards[i] = addComp(new PayoutCard(i, patternsCardsList[i]), {x:i * 73, y:0});
			}
		}

		public function setStake(stake : int) : void
		{
			for (var i : int = 0; i < cards.length; i++)
			{
				cards[i].setPrize(Pattern(cards[i].patternsList[0]).group.getStraightPayout(stake));
			}
		}

		public function clear(animate : Boolean = true, restart:Boolean = true) : void
		{
			for (var i : int = 0; i < cards.length; i++)
			{
				cards[i].reset(animate, restart);
			}
		}

		public function stopAll() : void
		{
			for (var i : int = 0; i < cards.length; i++)
			{
				cards[i].stopAnima();
			}
		}
		
		public function hightlightCard(p : Pattern) : void
		{
			clear();
			getPayoutCard(p).highlightCard();
		}
		
		
	}
}