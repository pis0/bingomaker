package com.assukar.praia.menton.components.leds
{
	/**
	 * @author Assukar
	 */
	public class BlinkingLedDance
	extends LedDance
	{
		public function BlinkingLedDance(blinkingColor: int, onFrames: int, offFrames: int)
		{
			this.blinkingColor = blinkingColor;
			this.onFrames = onFrames;
			this.offFrames = offFrames;
		}		
		
		private var blinkingColor: int;
		private var frames: int = 0;
		private var colorState: int = 0;
		private var offFrames: int;
		private var onFrames: int;
		
		override public function enterFrame() : void
		{
			frames++;
			
			switch (colorState)
			{
				case 0:
					if (frames == offFrames)
					{
						panel.setAll(blinkingColor);
						colorState = blinkingColor;
						frames = 0;
					}
					break;
					
				case blinkingColor:
					if (frames == onFrames)
					{
						panel.setAll(blinkingColor+1);
						colorState = blinkingColor+1;
						frames = 0;
					}
					break;
				 
				default:
					if (frames == onFrames)
					{
						panel.setAll(0);
						colorState = 0;
						frames = 0;
					}
					break;
					
			}
		}
	}
}
