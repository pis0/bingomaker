package com.assukar.praia.menton.components.buttons.payout
{
	import starling.display.Image;
	import com.assukar.view.starling.AssukarTextField;
	import starling.text.TextFieldAutoSize;
	import starling.utils.Align;

	import com.assukar.airong.text.TextUtils;
	import com.assukar.domain.domain.StatsMoney;
	import com.assukar.praia.assets.Fonts;
	import com.assukar.praia.assets.PraiaCommonAssets;
	import com.assukar.praia.main.PraiaContext;
	import com.assukar.praia.menton.components.jackpot.JackpotPanel;
	import com.assukar.praia.menton.controllers.ButtonsController;
	import com.assukar.view.starling.Component;

	import flash.geom.Rectangle;
	
	public class Payout extends Component
	{
		// singleton
		static public var ME:Payout;
		
		// label colors
		static private const LABEL_COLORS:Vector.<uint> = new <uint>[0xffffff, 0xfdfaa6];
		
		private const AREA:Rectangle = new Rectangle(13, 13, 157, 66);
		
		public function Payout()
		{
			ME = singleton(ME);
		}
		
		override public function dispose():void
		{
			juggler.removeTweens(label);
			clearMessage();
			super.dispose();
			ME = null;
		}
		
		// object vars
		private var container:Component;
		private var coinIcon:Image;
		private var cashIcon:Image;
		private var label:AssukarTextField;
		private var message:AssukarTextField;
		private var bg:BgPayout;
		
		override protected function draww():void
		{
			var fontSize:int = 45;
			if(PraiaContext.ME.oneHandDevice) fontSize = 56;
			
			bg = addComp(BgPayout); //{ x: -17, y: -17 }
			container = addComp();
			coinIcon = container.addImage(PraiaCommonAssets.ME.texture("ficha78_sk"), {scale:0.75}); //{x:-8,y:13}
			cashIcon = container.addImage(PraiaCommonAssets.ME.texture("dindin77_sk"),{scale:0.75}); //{x:-5, y:18}
			
			label = container.addText(60, 60, "", Fonts.MYRIADPRO_SEMIBOLD, {color: LABEL_COLORS[0], x: (coinIcon.x + coinIcon.width) + 3, y: coinIcon.y - 15, fontSize:fontSize, name: "label", autoSize: TextFieldAutoSize.HORIZONTAL}); //{resizeOffset:true} //y:coinIcon.y - 23
			
			message = addText(AREA.width, AREA.height, "", Fonts.MYRIADPRO_SEMIBOLD, {x: AREA.x, y: AREA.y}, {color: LABEL_COLORS[0], fontSize: 14, hAlign: Align.CENTER, name: "message"});
			
			clear();
		}
		
		public function setLed(on:Boolean):void
		{
			if (!on)
			{
				JackpotPanel.ME.deactivate();
				bg.setMode(BgPayout.OFF);
			}
			
			flattenMe();
		}
		
		public function blinkWonMoney():void
		{
			bg.blinkWonMoney();
		}
		
		public function collectingLeds(loops:int):void
		{
			bg.stopBlink(BgPayout.ON);
			bg.blinkCollectMoney();			
		}
		
		public function stopBlink(mode:int):void
		{
			bg.stopBlink(mode);
		}
		
		private function flattenMe():void
		{
			//			if (isFlattened) flatten();
		}
		
		private function writeMessage(msg:String):void
		{
			if (msg)
			{
				message.text = msg;
				hide(label, coinIcon, cashIcon);
			}
			else if (lastMoney)
			{
				update(lastMoney, false);
			}
			
			message.visible = PraiaContext.ME.oneHandDevice ? false : (msg != null);
			
			// fix
			while (message.bounds.height > AREA.height) message.fontSize--;
			
			flattenMe();
		}
		
		private function writeMessageFuture(msg:String):void
		{
			if (label.visible && label.text != "")
			{
				delayCall("messageDisplayCall", juggler.delayCall(writeMessage, 3, null));
			}
			writeMessage(msg);
		}
		
		public function setMessage(msg:String, delay:Number):void
		{
			clearMessage();
			if (delay)
			{
				delayCall("messageCall", juggler.delayCall(writeMessageFuture, delay, msg));
			}
			else
			{
				writeMessageFuture(msg);
			}
		}
		
		public function clearMessage():void
		{
			destroyCall("messageDisplayCall");
			destroyCall("messageCall");
			writeMessage(null);
			
			flattenMe();
		}
		
		private var lastMoney:StatsMoney;
		
		public function update(money:StatsMoney, tween:Boolean, flatMode:Boolean = true):void
		{
			
			//			label.fontSize = 48;
			lastMoney = null;
			if (message.visible) clearMessage();
			lastMoney = money;
			
			var value:int = money.cash > 0 ? money.cash : money.coins;
			clear();
			
			if (value)
			{
				coinIcon.visible = !(cashIcon.visible = (money.cash > 0));
				show(label);
				label.text = TextUtils.formatNumber(value);
				align();
				//while (label.bounds.width > 115) label.fontSize--;
				//coinIcon.x = AREA.x + (AREA.width - (coinIcon.width + 5 + label.bounds.width) >> 1);
				//coinIcon.y = AREA.y + (AREA.height - coinIcon.height >> 1) + 3;
				//cashIcon.x = coinIcon.x;
				//cashIcon.y = coinIcon.y + 6;
				//label.x = int(coinIcon.x + coinIcon.width)+10;
				//label.y = int(coinIcon.y);
				
				if (tween)
				{
					unflatten();
					coinIcon.alpha = cashIcon.alpha = label.alpha = 0;
					juggler.tween(label, 0.8, {alpha: 1, onUpdate: function():void
					{
						coinIcon.alpha = cashIcon.alpha = label.alpha;
					}, onComplete: flattenMe});
				}
			}
			else
			{
				bg.stopBlink(BgPayout.OFF);
			}
			
			if (ButtonsController.ME) label.color = LABEL_COLORS[(tween ? 1 : 0)];
			if (flatMode) flattenMe();
		}
		
		private function align():void
		{
			container.x = int(bg.x + bg.width * .5 - container.width * .5);
			container.y = int((bg.y + bg.height * .5 - container.height * .5) + 12);
		}
		
		public function clear():void
		{
			label.text = message.text = "";
			hide(label, coinIcon, cashIcon, message);
			
			flattenMe();
		}
	}
}