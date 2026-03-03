package com.assukar.praia.menton.components.bellPanel
{
	import com.assukar.airong.ds.LinkedList;
	import com.assukar.airong.error.AssukarError;
	import com.assukar.airong.utils.Utils;
	import com.assukar.praia.domain.gameevents.PraiaGameEvents;
	import com.assukar.praia.main.PraiaContext;
	import com.assukar.praia.menton.assets.MentonAssets;
	import com.assukar.praia.menton.assets.SoundID;
	import com.assukar.praia.menton.components.Menton;
	import com.assukar.praia.menton.domain.SlotBonusSession;
	import com.assukar.view.sounds.Sounds;
	import com.assukar.view.starling.Component;
	import flash.geom.Rectangle;
	import starling.animation.Transitions;
	import starling.display.Image;
	
	/**
	 * ...
	 * @author Igor Henrique Santos
	 */
	public class BellPanel extends Component
	{
		// Singleton //
		static public var ME:BellPanel;
		
		// Dev Vars //
		private var countPieces:int = 0;
		
		// Display Vars //
		private var stripe1:Component;
		private var stripe2:Component;
		private var stripe3:Component;
		private var bellList:Vector.<Image>;
		private var maskPanel:Image;
		private var slotsContainer:Component;
		private var winBlink:Image;
		
		public function BellPanel()
		{
			ME = singleton(ME);
		}
		
		private var x2MovieContainer:Component;
		private var x2MovieImage:Image;
		
		override protected function draww():void
		{
			super.draww();
			
			SlotSymbolPool.ME.reset();
			
			slotsContainer = addComp();
			
			bellList = new Vector.<Image>();
			
			stripe1 = slotsContainer.addComp(null, {y: 0});
			stripe2 = slotsContainer.addComp(null, {y: 32});
			stripe3 = slotsContainer.addComp(null, {y: 58});
			
			var initBellX:int = 0;
			
			// FRONT 
			bellList.push(slotsContainer.addImage(MentonAssets.ME.texture("bell1"), {x: initBellX, y: 0}));
			bellList.push(slotsContainer.addImage(MentonAssets.ME.texture("bell2"), {x: initBellX, y: 32}));
			bellList.push(slotsContainer.addImage(MentonAssets.ME.texture("bell3"), {x: initBellX, y: 58}));
			bellList.push(addImage(MentonAssets.ME.texture("slotmask3"), {x: -5, visible: false, alpha: 0}));
			
			maskPanel = slotsContainer.addImage(MentonAssets.ME.texture("slotmask1"), {x: -5});
			
			slotsContainer.addImage(MentonAssets.ME.texture("slotmask2"), {x: -5, y: -5});
			
			slotsContainer.clipRect = new Rectangle(-5, 0, 200, 150);
			
			winBlink = addImage(MentonAssets.ME.texture("slotmask3"), {x: -5});
			
			x2MovieContainer = addComp(null, {x: 50, y: 11});
			x2MovieImage = x2MovieContainer.addImage(MentonAssets.ME.texture("multiply_anim"));
			hide(x2MovieContainer);
			
			stopBlink();
		}
		
		override public function dispose():void
		{
			
			juggler.removeTweens(x2MovieImage);
			
			juggler.removeTweens(stripe1);
			juggler.removeTweens(stripe2);
			juggler.removeTweens(stripe3);
			
			SlotSymbolPool.ME.dispose();
			
			super.dispose();
			ME = null;
		}
		
		public function animateSlots(symbols:Vector.<String>, callback:Function):void
		{
			if (!symbols)
			{
				callback();
				return;
			}
			
			for (var i:int = 0; i < symbols.length; i++)
			{
				switch (i)
				{
				case SlotSymbol.SLOT_TOP: 
					addRandomSymbols(SlotSymbol.SLOT_TOP, symbols[i], 5);
					stripe1.addComp(SlotSymbolPool.ME.retrieve(symbols[i], SlotSymbol.SLOT_TOP), {x: Math.floor(stripe1.width - 1)});
					addRandomSymbols(SlotSymbol.SLOT_TOP, symbols[i], 1);
					break;
				case SlotSymbol.SLOT_MIDDLE: 
					addRandomSymbols(SlotSymbol.SLOT_MIDDLE, symbols[i], 5);
					stripe2.addComp(SlotSymbolPool.ME.retrieve(symbols[i], SlotSymbol.SLOT_MIDDLE), {x: -stripe2.width + (SlotSymbolPool.ME.getTexture(SlotBonusSession.X2, SlotSymbol.SLOT_MIDDLE).width / 2)});
					addRandomSymbols(SlotSymbol.SLOT_MIDDLE, symbols[i], 1);
					break;
				case SlotSymbol.SLOT_BOTTOM: 
					addRandomSymbols(SlotSymbol.SLOT_BOTTOM, symbols[i], 5);
					stripe3.addComp(SlotSymbolPool.ME.retrieve(symbols[i], SlotSymbol.SLOT_BOTTOM), {x: Math.floor(stripe3.width - 1)});
					addRandomSymbols(SlotSymbol.SLOT_BOTTOM, symbols[i], 1);
					break;
				}
			}
			
			animate(1, callback);
			
			PraiaGameEvents.MENTON_BELL_SLOTS.dispatch();
		}
		
		private function addRandomSymbols(pos:int, borderSymbolsCantBe:String, qtd:int = 1):void
		{
			var i:int = 0;
			var len:int = qtd;
			var symbols:LinkedList = new LinkedList(SlotBonusSession.FRUIT, SlotBonusSession.BONUS, SlotBonusSession.X2);
			var drawnSymbol:String;
			var lastSymbol:String;
			
			for (; i < len; ++i)
			{
				drawnSymbol = symbols.getRandom();
				switch (pos)
				{
				case SlotSymbol.SLOT_TOP: 
					if (stripe1.numChildren > 0)
					{
						lastSymbol = (stripe1.getChildAt(stripe1.numChildren - 1) as SlotSymbol).type;
						while (i == len - 1 ? drawnSymbol == borderSymbolsCantBe : false) drawnSymbol = symbols.getRandom();
					}
					stripe1.addComp(SlotSymbolPool.ME.retrieve(drawnSymbol, SlotSymbol.SLOT_TOP), {x: Math.floor(stripe1.width - 1)});
					break;
				case SlotSymbol.SLOT_MIDDLE: 
					if (stripe2.numChildren > 0)
					{
						lastSymbol = (stripe2.getChildAt(stripe2.numChildren - 1) as SlotSymbol).type;
						while (i == len - 1 ? drawnSymbol == borderSymbolsCantBe : false) drawnSymbol = symbols.getRandom();
					}
					stripe2.addComp(SlotSymbolPool.ME.retrieve(drawnSymbol, SlotSymbol.SLOT_MIDDLE), {x: -stripe2.width + (SlotSymbolPool.ME.getTexture(SlotBonusSession.X2, SlotSymbol.SLOT_MIDDLE).width / 2)});
					break;
				case SlotSymbol.SLOT_BOTTOM: 
					if (stripe3.numChildren > 0)
					{
						lastSymbol = (stripe3.getChildAt(stripe3.numChildren - 1) as SlotSymbol).type;
						while (i == len - 1 ? drawnSymbol == borderSymbolsCantBe : false) drawnSymbol = symbols.getRandom();
					}
					stripe3.addComp(SlotSymbolPool.ME.retrieve(drawnSymbol, SlotSymbol.SLOT_BOTTOM), {x: Math.floor(stripe3.width - 1)});
					break;
				default: 
					throw new AssukarError("Invalid Position.");
				}
			}
		}
		
		private var remainingSpins:int;
		
		private function animate(speed:Number, callback:Function = null):void
		{
			remainingSpins = 3;
			Sounds.ME.playFx(SoundID.SLOT_SPIN, null, 1, Sounds.SOUND_TRANSFORM_VOLUME_60);
			juggler.tween(stripe1, Utils.randomNumber(1, 2.5, false), {x: -stripe1.width + (stripe1.getChildAt(0).width * 1.5) + 2, transition: Transitions.EASE_OUT_QUINT, onComplete: spinCallBack, onCompleteArgs: [callback]});
			juggler.tween(stripe2, Utils.randomNumber(1, 2.5, false), {x: +stripe2.width - (stripe2.getChildAt(0).width * 1.5) + 2, transition: Transitions.EASE_OUT_QUINT, onComplete: spinCallBack, onCompleteArgs: [callback]});
			juggler.tween(stripe3, Utils.randomNumber(1, 2.5, false), {x: -stripe3.width + (stripe3.getChildAt(0).width * 1.5) + 2, transition: Transitions.EASE_OUT_QUINT, onComplete: spinCallBack, onCompleteArgs: [callback]});
		}
		
		private function spinCallBack(callback:Function = null):void
		{
			remainingSpins--;
			if (remainingSpins == 0 && callback)
			{
				callback();
			}
		}
		
		public function resetPanel():void
		{
			juggler.removeTweens(x2MovieImage);
			Menton.ME.addChildAt(BellPanel.ME, 2);  // back to the original index
			hide(x2MovieContainer);
			
			countPieces = 0;
			for (var i:int = 0; i < bellList.length; i++) i == bellList.length - 1 ? hide(bellList[i]) : show(bellList[i]);
			
			while (stripe1.numChildren > 0) SlotSymbolPool.ME.recycle(stripe1.getChildAt(0) as SlotSymbol);
			while (stripe2.numChildren > 0) SlotSymbolPool.ME.recycle(stripe2.getChildAt(0) as SlotSymbol);
			while (stripe3.numChildren > 0) SlotSymbolPool.ME.recycle(stripe3.getChildAt(0) as SlotSymbol);
			
			stripe1.addComp(SlotSymbolPool.ME.retrieve(SlotSymbol.SLOT_BELL, SlotSymbol.SLOT_TOP));
			stripe2.addComp(SlotSymbolPool.ME.retrieve(SlotSymbol.SLOT_BELL, SlotSymbol.SLOT_MIDDLE));
			stripe3.addComp(SlotSymbolPool.ME.retrieve(SlotSymbol.SLOT_BELL, SlotSymbol.SLOT_BOTTOM));
			
			stripe1.x = stripe2.x = stripe3.x = 0;
		}
		
		public function openPiece():void
		{
			if (countPieces >= bellList.length)
			{
				Utils.logError(new AssukarError("countPieces= " + countPieces + " bellList.length= " + bellList.length), false);
				return;
			}
			
			if (countPieces == bellList.length - 1) 
			{
				show(bellList[countPieces]);
			}
			else
			{
				hide(bellList[countPieces]);
			}
			countPieces++;
		}
		
		public function blinkPanel():void
		{
			winBlink.visible = !winBlink.visible;
			delayCall("blinkPanel", juggler.delayCall(blinkPanel, 0.2));
		}
		
		public function stopBlink():void
		{
			destroyCall("blinkPanel");
			winBlink.visible = false;
		}
		
		public function multiplierCollect(callback:Function):void
		{
			show(x2MovieContainer);
			Menton.ME.addChild(BellPanel.ME); // top child
			
			juggler.removeTweens(x2MovieImage);
			x2MovieImage.y = 0;
			juggler.tween(x2MovieImage, 1.3333, {y: 650 + (PraiaContext.ME.oneHandExtended ? 20 : 0), transition: Transitions.EASE_IN_CUBIC, onComplete: function():void
			{
				hide(x2MovieContainer);
				Menton.ME.addChildAt(BellPanel.ME, 2);  // back to the original index
				if (callback) callback();
			}});
		
		}
	}

}