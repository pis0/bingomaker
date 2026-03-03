package com.assukar.praia.menton.domain
{
	import com.assukar.airong.ds.Cursor;
	import com.assukar.airong.utils.Singleton;

	
	public class PatternResolver
	{
		static public const ME: PatternResolver = new PatternResolver();

		function PatternResolver()
		{
			Singleton.enforce(ME);
		}

		private function checkPattern(card: Card, p: Pattern, r: Round): void
		{
			var check: int = p.check(card);

			switch (check)
			{
				case 0:
					card.setPattern(p, r);
					p.markFullMatch();
					break;
				case 1:
					if (!p.markedMissingMatch)
					{
						card.setMissingOnePattern(p);
						p.markMissingMatch();
					}
					break;
			}

			p.mark();
		}

		internal function checkForPattern(card: Card, r: Round): void
		{
			card.resetNewPatterns();
				
			Pattern.resetPatterns();

			var c: Cursor = Pattern.patterns;
			while (c.next)
			{
				var p: Pattern = Pattern(c.current);
				
				if (!p.markedFullMatch)
				{
					checkPattern(card, p, r);
				}
			}
		}
	}
}
