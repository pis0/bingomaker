package com.assukar.praia.menton.components.leds
{
	/**
	 * @author Assukar
	 */
	public class AllLitColorfulLedDance
	extends LedDance
	{
		private var bigcount : int = 0;
		private var color : int = 0;
		private var frames : int = 0;
		private var i : int;

		override public function enterFrame() : void
		{
			for (i = 0; i < panel.len; i++)
			{
				bigcount++;
				if (bigcount % 99 == 0)
				{
					panel.leds[i].setState(2 + color * 2);
					color = (color + 1) % 3;
				}
			}

			frames++;

			if (frames % 600 == 0)
			{
				panel.setAll(0);
			}
		}
	}
}
