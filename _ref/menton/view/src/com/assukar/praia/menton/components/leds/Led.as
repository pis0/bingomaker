package com.assukar.praia.menton.components.leds
{
	import starling.display.Image;
	import starling.textures.TextureSmoothing;

	import com.assukar.praia.menton.assets.MentonAssets;
	import com.assukar.view.starling.Component;

	/**
	 * @author Johnatan
	 */
	public class Led 
	extends Component
	{
		static public const STATE_OFF:int = 0;
		static public const STATE_YELLOW:int = 1;
		static public const STATE_YELLOW_HI:int = 2;
		static public const STATE_GREEN:int = 3;
//		static public const STATE_GREEN_HI:int = 4;
//		static public const STATE_BLUE:int = 5;
//		static public const STATE_BLUE_HI:int = 6;
		
		private var cs : Vector.<Image> = new <Image>[];
		private var state : int = 1;
		private var ledScale: Number;
		
		public function Led(ledScale: Number)
		{
			this.ledScale = ledScale;
		}

		public function setState(state : int) : void
		{
			if (this.state == state) return;
			cs[this.state].visible = false;
			cs[state].visible = true;
			this.state = state;
		}

		override protected function draww() : void
		{
			
			for (var i : int = 0; i < 4; i++)
			{
				cs.push(addImage(MentonAssets.ME.texture("payoutled" + (i + 1)), {scaleX:ledScale, scaleY:ledScale, smoothing:TextureSmoothing.TRILINEAR, visible:false}));				
			}			

			setState(0);
		}
	}
}
