package com.assukar.praia.menton.components.leds
{
	/**
	 * @author Assukar
	 */
	public class WaveLedDance
	extends LedDance
	{
		public function WaveLedDance(size : int, group : Boolean, speed:int = 10)
		{
			this.size = size;
			this.group = group;
			this.speedFrames = speed;
		}

		private var frames : int = 0;
		private var speedFrames : int = 0;
		private var i : int;
		private var startColor : int = 0;
		private var size : int;
		private var group : Boolean;
		private var led : Led;

		override public function enterFrame() : void
		{
			frames++;
			if (frames % speedFrames == 0)
			{
				for (i = 0; i < panel.len; i++)
				{
					led = panel.leds[i];
					
//						 if (led.x < size / 6) led.setState(1 + startColor % 6);
//					else if (led.x < (2 * size) / 6) led.setState(1 + (startColor + 1) % 6);
//					else if (led.x < (3 * size) / 6) led.setState(1 + (startColor + 2) % 6);
//					else if (led.x < (4 * size) / 6) led.setState(1 + (startColor + 3) % 6);
//					else if (led.x < (5 * size) / 6) led.setState(1 + (startColor + 4) % 6);
//					else if (led.x < (6 * size) / 6) led.setState(1 + (startColor + 5) % 6);
//					else led.setState(1 + (startColor + 6) % 6);

//					led.setState( startColor % 11);
//					led.setState((startColor + 1) % 11);
//					led.setState((startColor + 2) % 11);
//					led.setState((startColor + 3) % 11);
//					led.setState((startColor + 5) % 11);
//					led.setState((startColor + 6) % 11);
//					led.setState((startColor + 7) % 11);
//					led.setState((startColor + 8) % 11);
//					led.setState((startColor + 9) % 11);
//					led.setState((startColor + 10)  % 11);
					led.setState((startColor +3) % 3);//4

					if (!group) startColor++;
				}

				if (group) startColor++;
			}
		}
	}
}
