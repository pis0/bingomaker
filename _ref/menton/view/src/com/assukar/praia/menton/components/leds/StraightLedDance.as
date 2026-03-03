package com.assukar.praia.menton.components.leds
{
	/**
	 * @author Assukar
	 */
	public class StraightLedDance
	extends LedDance
	{
		private var led : int = 0;
		private var frames : int = 0;
		private var color : int = 1;

		override public function enterFrame() : void
		{
			frames++;
			if (frames % 4 == 0)
			{
				panel.leds[led].setState(color);
				led++;
				if (led == panel.len)
				{
					led = 0;
					color += 2;
					color = color % 7;
					if (color == 0) color = 2;
				}
			}
		}
	}
}
