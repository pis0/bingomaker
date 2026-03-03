package com.assukar.praia.menton.components.buttons.payout
{
	import com.assukar.praia.menton.assets.MentonAssets;
	import com.assukar.view.starling.Component;
	import starling.display.Image;
	
	public class BgPayout extends Component
	{
		public static var ON:int = 0;
		public static var OFF:int = 1;
		
		private var bgOff:Image;
		private var bgOn:Image;
		private var bgWin:Image;
		
		override protected function draww():void
		{
			bgOff = addImage(MentonAssets.ME.texture("payout"));
			bgOn = addImage(MentonAssets.ME.texture("payout_on"), { visible: false});
			bgWin = addImage(MentonAssets.ME.texture("payout_glow"), { visible: false});
		}
		
		public function setMode(value:int):void
		{
			switch (value)
			{
			case ON: 
			{
				bgOn.visible = true;
				hide(bgOff, bgWin);
				break;
			}
			case OFF: 
			{
				bgOff.visible = true;
				hide(bgOn, bgWin);
				break;
			}
			default://do nothing
			}
		}
		
		public function blinkWonMoney():void
		{
			stopBlink(ON);
			blinkCollectMoney(true, .2);
			
			delayCall("stopBlink", juggler.delayCall(stopBlink, .4, ON));
		}
		
		public function blinkCollectMoney(blink:Boolean = true, time:Number = .1):void
		{
			bgWin.visible = blink;
			bgOn.visible = !blink;
			
			delayCall("blink", juggler.delayCall(blinkCollectMoney, time, !blink, time));
		}
		
		public function stopBlink(mode:int):void
		{
			destroyCall("blink");
			destroyCall("stopBlink");
			setMode(mode);
		}
	}
}
