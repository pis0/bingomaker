package com.assukar.praia.menton.components.cards 
{
	import com.assukar.airong.utils.Singleton;
    import com.assukar.praia.components.howtoplay.HowToPlayBox;
    import com.assukar.praia.menton.components.Menton;
	import com.assukar.praia.menton.components.payouts.PayoutTable;
	import com.assukar.praia.menton.domain.Pattern;
	
	/**
	 * ...
	 * @author Caian Seiki Murakawa
	 * @date 12/02/2016
	 */
	public class IntervalCardPatternController 
	{
		// Singleton //
		static public var ME : IntervalCardPatternController;
		
		// Statics //
		static private const PATTERNS : Vector.<Pattern> = new <Pattern>
		[
		Pattern.LINE_1,
		Pattern.LINE_2,
		Pattern.LINE_3,
		Pattern.DOUBLE_COLUMN_1,
		Pattern.DOUBLE_COLUMN_2,
		Pattern.DOUBLE_COLUMN_3,
		Pattern.DOUBLE_COLUMN_4,
		Pattern.TRIPLE_COLUMN_1,
		Pattern.TRIPLE_COLUMN_2,
		Pattern.TRIPLE_COLUMN_3,
		Pattern.DOUBLE_LINE_1,
		Pattern.DOUBLE_LINE_2,
		Pattern.DOUBLE_LINE_3,
		Pattern.QUAD_COLUMN_1,
		Pattern.QUAD_COLUMN_2,
		Pattern.QUAD_COLUMN_3
		//Pattern.FULL
		];
		
		// Dev Vars //
		private var mCurrentAnimIndex : int;
		
		public function IntervalCardPatternController() 
		{
			Singleton.enforce(ME);
		}
		
		public function dispose() : void
		{
			ME = null;
		}
		
		public function playIntervalAnimation() : void
		{
			mCurrentAnimIndex = 0;
			animPattern();
            HowToPlayBox.ME.enable();
		}
		
		private function animPattern() : void
		{
			var i : int = 0;
			var len : int = CardPanel.ME.cards.length;
			for (; i < len; ++i)
			{
				CardPanel.ME.getCard(i).setIntervalPattern(PATTERNS[mCurrentAnimIndex]);
			}
			
			PayoutTable.ME.hightlightCard(PATTERNS[mCurrentAnimIndex]);
			//PayoutTable.ME.prizeCard(PATTERNS[mCurrentAnimIndex]);
			
			mCurrentAnimIndex++;
			if (mCurrentAnimIndex >= PATTERNS.length) mCurrentAnimIndex = 0;
			Menton.ME.delayCall("IntervalCardPattern.animPattern", juggler.delayCall(animPattern, 1.5));
		}
		
		public function stopIntervalAnimation() : void
		{
			Menton.ME.destroyCall("IntervalCardPattern.animPattern");
			CardPanel.ME.clear();
			PayoutTable.ME.clear(true, false);
            HowToPlayBox.ME.disable();
		}
	}
}