package com.assukar.praia.menton.components.buttons
{
    import com.assukar.praia.components.FontResolver;


	import starling.animation.Transitions;
	import starling.events.Touch;
	import com.assukar.view.starling.AssukarTextField;
	import starling.utils.Align;

	import com.assukar.airong.text.TextUtils;
	import com.assukar.domain.services.dictio.Dictio;
	import com.assukar.praia.assets.Fonts;
	import com.assukar.praia.menton.assets.MentonAssets;
	import com.assukar.praia.menton.assets.SoundID;
	import com.assukar.praia.menton.controllers.ButtonsController;
	import com.assukar.praia.menton.main.MentonEngine;
	import com.assukar.view.assets.CommonAssets;
	import com.assukar.view.sounds.Sounds;
	import com.assukar.view.starling.AssukarTextField;
	import com.assukar.view.starling.Component;
	import com.assukar.view.starling.buttons.ButtonComponent;

	import flash.display.BitmapData;
	import flash.display.Shape;
	import flash.display.Sprite;
	import flash.geom.Point;
	import flash.geom.Rectangle;
	
	public class StakesButton extends MentonButton
	{
		private var value:AssukarTextField;
		private var mCompTotalPayout:Component;
		private var mTextTotalPrice:AssukarTextField;
		private var fontSize:int;
		private var rect:Rectangle;
		private var step:int;
		
		private var posNum:Point;
		private var bmpData:BitmapData;
		
		override public function dispose():void
		{
			bmpData.dispose();
			
			juggler.removeByID(volumeDelay);
			super.dispose();
		}
		
		override protected function draww():void
		{
			fontSize = 26;
			rect = new Rectangle(7, 0, 164, 46);
			step = 5;
			
			var fontSizeNum:int = 28;
			posNum = new Point(62, -1);
			
			super.draww();
			
			mCompTotalPayout = addCompAt(0, Component, {x: 20});
			var nativeContainer:Sprite = new Sprite();
			
			var roundRect:Shape = new Shape();
			roundRect.graphics.beginFill(0x471043, 1);
			roundRect.graphics.drawRoundRect(0, 0, 135, 50, 15, 15);
			roundRect.graphics.endFill();
			
			nativeContainer.addChild(roundRect);
			
			bmpData = new BitmapData(135, 40, true, 0x0);
			bmpData.draw(nativeContainer);
			mCompTotalPayout.addDisposableImage("StakesButtonMenton", bmpData);
			roundRect.graphics.clear();
			
			mCompTotalPayout.addImage(CommonAssets.ME.texture("ficha43_sk"), {x: 32, y: 2});
			mTextTotalPrice = mCompTotalPayout.addText(70, 40, "", Fonts.IOWAN_BLACK, { x: 60,y:-8 }, { color: 0xffffff, fontSize: 26 } );

			value = addText(55, 55, "1", Fonts.IOWAN_BLACK, {color: ButtonPanel.STAKE_COLORS[0], fontSize: fontSizeNum, resizeOffset: true, hAlign: Align.CENTER}, {x: posNum.x, y: posNum.y});
		}
		
		override protected function defaultComp():Component
		{
			var comp:Component = new Component();
			comp.addImage(MentonAssets.ME.texture("btbet_idle"), {});
			
			var label:AssukarTextField = comp.addText(rect.width, rect.height, Dictio.upper("Stake"), FontResolver.ME.resolveFontName(Fonts.CLARENDON_BLKBT), {x: rect.x, fontSize: fontSize, color: 0xffffff}, {resizeOffset: true});
			
			label.y = 35;
			return comp;
		}
		
		override protected function pressedComp():Component
		{
			var comp:Component = new Component();
			comp.addImage(MentonAssets.ME.texture("btbet_hit"), {});
			
			var label:AssukarTextField = comp.addText(rect.width, rect.height, Dictio.upper("Stake"), FontResolver.ME.resolveFontName(Fonts.CLARENDON_BLKBT), {x: rect.x, fontSize: fontSize, color: 0xffffff}, {resizeOffset: true});
			
			label.y = 35 + 5;
			
			return comp;
		}
		
		override protected function disabledComp():Component
		{
			var comp:Component = new Component();
			comp.addImage(MentonAssets.ME.texture("btbet_off"), {});
			
			var label:AssukarTextField = comp.addText(rect.width, rect.height, Dictio.upper("Stake"), FontResolver.ME.resolveFontName(Fonts.CLARENDON_BLKBT), {x: rect.x, fontSize: fontSize, color: 0xbbbbbb}, {resizeOffset: true});
			
			label.y = 35;
			
			return comp;
		}
		
		override protected function pressHandler(button:ButtonComponent, touch:Touch):void
		{
			super.pressHandler(button, touch);
			
			value.y = posNum.y + 5;
			
			Sounds.ME.playFx(SoundID.BUTTON_STAKE + value.text, null, 1);
			
			juggler.removeByID(volumeDelay);
			Sounds.ME.setMusicVolume(0, .6);
		
		}
		
		private var volumeDelay:uint;
		
		override protected function releaseHandler(button:ButtonComponent, touch:Touch):void
		{
			super.releaseHandler(button, touch);
			
			value.y = posNum.y;
			
			juggler.removeByID(volumeDelay);
			if (ButtonPanel.ME.playButton.phase == ButtonsController.PLAY)
			{
				volumeDelay = juggler.delayCall(Sounds.ME.setMusicVolume, 8, .8, .6);
			}
		
		}
		
		public function resetStakes():void
		{
			value.text = TextUtils.formatNumber(MentonEngine.ME.newRound.unitaryStake) + "";
			value.color = color;
		}
		
		public function get color():uint
		{
			return ButtonPanel.STAKE_COLORS[MentonEngine.ME.newRound ? MentonEngine.ME.newRound.stakeIndex : 0];
		}
		
		override public function turn(on:Boolean):void
		{
			super.turn(on);
			if (!on)
			{
				juggler.removeByID(volumeDelay);
			}
		}
		
		public function openTotalPrice():void
		{
			mTextTotalPrice.text = TextUtils.formatNumber(MentonEngine.ME.newRound.totalStake);
			juggler.tween(mCompTotalPayout, .5, {y: -25, transition: Transitions.EASE_OUT_CUBIC});
		}
		
		public function closeTotalPrice():void
		{
			juggler.tween(mCompTotalPayout, .5, {y: 0, transition: Transitions.EASE_IN_CUBIC});
		}
	
	}
}
