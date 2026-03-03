package com.assukar.praia.menton.components.buttons 
{
	import com.assukar.airong.error.AssukarError;
	import com.assukar.domain.services.dictio.Dictio;
	import com.assukar.praia.assets.Fonts;
	import com.assukar.praia.components.FontResolver;
	import com.assukar.praia.controllers.AutoPlayController;
	import com.assukar.praia.controllers.AutoPlaySubordinateButton;
	import com.assukar.praia.main.PraiaContext;
	import com.assukar.praia.menton.assets.MentonAssets;
	import com.assukar.praia.menton.controllers.ButtonsController;
	import com.assukar.praia.menton.domain.SlotBonusSession;
	import com.assukar.view.sounds.Sounds;
	import com.assukar.view.starling.Component;
	import com.assukar.view.starling.StarlingUtils;
	import com.assukar.view.starling.buttons.ButtonComponent;
	import com.assukar.view.starling.effects.actioncalls.ActionEffectable;
	import com.assukar.view.starling.effects.actioncalls.BumpingEffect;
	
	import flash.geom.Rectangle;
	import flash.text.TextFormatAlign;
	
	
	import starling.display.DisplayObject;
	import starling.display.Image;
	import starling.events.Touch;
	import com.assukar.view.starling.AssukarTextField;
	
	public class ExtraButton
	extends MentonButton
	implements ActionEffectable, AutoPlaySubordinateButton
	{
		
		override final protected function dispatchPress(touch: Touch): void
		{
			if (!AutoPlayController.ME.running) _PRESS.dispatch(this, touch);
		}

		override final protected function dispatchRelease(touch: Touch): void
		{
			if (!AutoPlayController.ME.running) _RELEASE.dispatch(this, touch);
		}
		
		final public function dispatchAutoPress(): void
		{
			_PRESS.dispatch(this, null);
		}
		
		final public function dispatchAutoRelease(): void
		{
			_RELEASE.dispatch(this, null);
		}
		
		override public function dispose(): void
		{
			BumpingEffect.ME.unregister(this);
			juggler.removeByID(volumeDelay);
			juggler.removeTweens(label1Fx[0]);
			super.dispose();	
		}
		
		public function shouldEffect(): Boolean
		{
			return enabled && visible;
		}
				
		public function ExtraButton()
		{
			BumpingEffect.ME.register(this, 8);
		}
				
		private var phasee: int;

		public function get phase(): int
		{
			return this.phasee;
		}
		
		private var isExtra:Boolean = false;
		private var lastPhase:int = -1;
		public function set phase(phasee: int): void
		{
			this.phasee = phasee;
		
			var txt: String;
			
			isExtra = false;
			
			switch (phasee)
			{
				case ButtonsController.PLAY:
					txt = Dictio.upper("Play");
					break;
				case ButtonsController.PEEL:
					txt = Dictio.upper("Peel");
					break;
				case ButtonsController.HALT:
					txt = Dictio.upper("Next");
					break;
				case ButtonsController.EXTRA:
					isExtra = true;
					txt = Dictio.upper("Extra");
					break;
				case ButtonsController.SUPER:
					txt = Dictio.upper("Super");
					break;
				case ButtonsController.BONUS:
					txt = Dictio.upper("BONUS");
					break;
				default:
					throw new AssukarError();
			}

			label1.text = label2.text = label3.text = txt;
			
			var step1:int = 6;
			var step2:int = 2;
			if(PraiaContext.ME.oneHandDevice) step1 = 20;
			if (PraiaContext.ME.oneHandExtended) step1 = 10; step2 = 0;
			
			var bgTemp:DisplayObject;
			
			bgTemp =  c1.getChildAt(c1.getChildAt(0).visible ? 0 : 1);
			label1.x = ((bgTemp.width-label1.width) >> 1);
			
			label1.y = ((bgTemp.height-label1.height) >> 1)-step1;
			
			bgTemp =  c2.getChildAt(c2.getChildAt(0).visible ? 0 : 1);
			label2.x = ((bgTemp.width-label2.width) >> 1);
			
			label2.y = ((bgTemp.height-label2.height) >> 1)-step2;

			bgTemp =  c3.getChildAt(c3.getChildAt(0).visible ? 0 : 1);
			label3.x = ((bgTemp.width-label3.width) >> 1);
			
			label3.y = ((bgTemp.height-label3.height) >> 1)-step1;
			
			
			if (PraiaContext.ME.oneHandDevice)
			{
				label1.y = ((bgTemp.height - label1.height) >> 1) - 3;
				label2.y = ((bgTemp.height - label2.height) >> 1) - 3;
				label3.y = ((bgTemp.height-label3.height) >> 1)   - 3;
			}
			
			var label1FxTemp:AssukarTextField;
			for(var i:int=0; i<label1Fx.length; i++)
			{
				label1FxTemp = label1Fx[i];
				label1FxTemp.text = txt;
				label1FxTemp.x = ((bgTemp.width-label1FxTemp.width) >> 1) - 2;
				label1FxTemp.y = ((bgTemp.height-label1FxTemp.height) >> 1)-step1;
			}
			
			this.clipRect = bgTemp.bounds;
			
			
			BumpingEffect.ME.resetTimer(this);
		}
		
		
		private var label1: AssukarTextField;
		private var label1Fx:Vector.<AssukarTextField>;
		private var bgFX:Vector.<Image>;
		
		private var label2: AssukarTextField;
		private var label3: AssukarTextField;
		private var c1: Component;
		private var c2: Component;
		private var c3: Component;
		
		private var fontSize:int;
		private var recText	:Rectangle;
		
		override protected function draww(): void
		{
			fontSize = 45;
			recText = new Rectangle(8,0,281,70);
			
			super.draww();
			
			phase = ButtonsController.EXTRA;
			
		}
		
		override protected function defaultComp(): Component
		{
			c1 = new Component(); 
			var bg:Image = c1.addImage(MentonAssets.ME.texture("btextra_idle"), {}); //btjogar1
			label1Fx = new <AssukarTextField>[];
			bgFX = new <Image>[];
			
			label1 = c1.addText(recText.width, recText.height, "", FontResolver.ME.resolveFontName(Fonts.CLARENDON_BLKBT), {fontSize:fontSize, color:0xffffff,  x:recText.x, resizeOffset:true});
			label1Fx[0] = c1.addText(recText.width, recText.height, "", FontResolver.ME.resolveFontName(Fonts.CLARENDON_BLKBT), {fontSize:fontSize, color:0xffffff, x:recText.x, resizeOffset:true});
			bgFX[0] = c1.addImage(MentonAssets.ME.texture("btplay_idle"), {});
			
			StarlingUtils.centerXRelativeTo(label1, bg);
			StarlingUtils.centerXRelativeTo(label1Fx[0], bg);
			
			label1Fx[0].alpha = 0;
			label1Fx[0].visible = true;
			bgFX[0].alpha = 0;
			bgFX[0].visible = false;
			return c1;
		}

		override protected function pressedComp(): Component
		{
			c2 = new Component();
			
			var bg:Image = c2.addImage(MentonAssets.ME.texture("btextra_hit"), { } );//btjogar2
			
			label2 = c2.addText(recText.width, recText.height, "", FontResolver.ME.resolveFontName(Fonts.CLARENDON_BLKBT), {fontSize:fontSize, resizeOffset:true, color:0xffffff},{hAlign:TextFormatAlign.CENTER});
			
			StarlingUtils.centerXRelativeTo(label2, bg);
			
			return c2;
		}

		override protected function disabledComp(): Component
		{
			c3 = new Component();
			
			var bg:Image = c3.addImage(MentonAssets.ME.texture("btextra_off"), { } );//btjogar3
				
			label3 = c3.addText(recText.width, recText.height, "", FontResolver.ME.resolveFontName(Fonts.CLARENDON_BLKBT), {fontSize:fontSize, resizeOffset:true, color:0xffffff},{hAlign:TextFormatAlign.CENTER});
			
			StarlingUtils.centerXRelativeTo(label3, bg);
			return c3;
		}

		override protected function pressHandler(button: ButtonComponent, touch: Touch): void
		{
			super.pressHandler(button, touch);
		}

		private var volumeDelay: uint;
		override public function turn(on: Boolean): void
		{
			super.turn(on);
		
			juggler.removeByID(volumeDelay);
			if (on)
			{
				if (phase == ButtonsController.PLAY)
				{
					
					volumeDelay = juggler.delayCall(function ():void
					{
						if(!SlotBonusSession.ME.feteDuCitroinBonus)
						{
							Sounds.ME.setMusicVolume(.6, 1);
						}
					}, 4);
					
				}
			}
			else
			{
				Sounds.ME.setMusicVolume(0, .7);
			}
			
			if(lastPhase!=phase )
			{
				if(phase != ButtonsController.PLAY && phase != ButtonsController.PEEL) playLabelFx();
				lastPhase = phase;
			}
		}
		
		
		
//		private var labelFxDelay:Vector.<uint>;
		private function playLabelFx():void
		{
			stopLabelFx();		
			var times:int = 1;	
			function blink():void {
				juggler.tween(bgFX[0], .1, {alpha:1});
				juggler.tween(label1Fx[0], .1, {alpha:1, onComplete:function():void{
					juggler.tween(bgFX[0], .1, {alpha:0});
					juggler.tween(label1Fx[0], .1, {alpha:0, onComplete:function():void{
						if(times--) blink();
					}});
				}});
			}
			blink();
		}
		
		private function stopLabelFx():void
		{
			
			juggler.removeTweens(label1Fx[0]);
			juggler.removeTweens(bgFX[0]);
			label1Fx[0].alpha = 0;
			label1Fx[0].visible = true;
			
			bgFX[0].alpha = 0;
			bgFX[0].visible = true;
		}
	}
}