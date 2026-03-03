package com.assukar.praia.menton.components.buttons
{
    import com.assukar.praia.components.FontResolver;
    
    import starling.events.Touch;

	import com.assukar.domain.services.dictio.Dictio;
	import com.assukar.praia.assets.Fonts;
	import com.assukar.praia.controllers.AutoPlayController;
	import com.assukar.praia.controllers.AutoPlaySubordinateButton;
	import com.assukar.praia.main.PraiaContext;
	import com.assukar.praia.menton.assets.MentonAssets;
	import com.assukar.praia.menton.assets.SoundID;
	import com.assukar.view.sounds.Sounds;
	import com.assukar.view.starling.AssukarTextField;
	import com.assukar.view.starling.Component;
	import com.assukar.view.starling.buttons.ButtonComponent;

	import flash.geom.Rectangle;

	public class EndButton 
	extends MentonButton
	implements AutoPlaySubordinateButton
	{
		override final protected function dispatchPress(touch: Touch): void
		{
//			Utils.print("SUB PRESS AUTO:" + AutoPlayController.ME.running);
			if (!AutoPlayController.ME.running) _PRESS.dispatch(this, touch);
		}

		override final protected function dispatchRelease(touch: Touch): void
		{
//			Utils.print("SUB RELEASE AUTO:" + AutoPlayController.ME.running);
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
			
		private var fontSize:int;
		private var rect	:Rectangle;
		private var step	:int;

		override protected function draww(): void
		{
			fontSize= 35;
			rect = new Rectangle(8,0,163,100);
			step = 5;
			
			if(PraiaContext.ME.oneHandDevice)
			{
				fontSize = 35;
				rect.setTo(0, 0, 120, 80);	
				step = 15;
			}
			if(PraiaContext.ME.oneHandExtended)
			{
				step = 10;
			}
			
			super.draww();
			
//			assignKeys([Keyboard.UP]);
			
			//return this;
		}

		override protected function defaultComp(): Component
		{
			var comp: Component = new Component();
			comp.addImage(MentonAssets.ME.texture("btend_idle"), {});
			
			var label: AssukarTextField = comp.addText(rect.width, rect.height, Dictio.get("END"), FontResolver.ME.resolveFontName(Fonts.CLARENDON_BLKBT), {
				fontSize:fontSize,
				color:0xffffff,
				x:rect.x
				},
			{resizeOffset: true});
			label.x = (comp.width-label.width >> 1);
			label.y = (comp.height-label.height >> 1)-step;			
			
			if (PraiaContext.ME.oneHandDevice)
			{
				label.y = (comp.height-label.height >> 1)-3;
			}
			
			return comp;
		}

		override protected function pressedComp(): Component
		{
			var comp: Component = new Component();
			comp.addImage(MentonAssets.ME.texture("btend_hit"), {});
			
			var label: AssukarTextField = comp.addText(rect.width, rect.height, Dictio.get("END"), FontResolver.ME.resolveFontName(Fonts.CLARENDON_BLKBT), {
				fontSize:fontSize, 
				color:0xffffff,
				x:rect.x + 5
			},
			{resizeOffset: true});
			label.x = (comp.width-label.width >> 1);
			label.y = (comp.height-label.height >> 1);
			return comp;
		}

		override protected function disabledComp(): Component	
		{
			var comp: Component = new Component();
			comp.addImage(MentonAssets.ME.texture("btend_off"), {});
			
			var label: AssukarTextField = comp.addText(rect.width, rect.height, Dictio.get("END"), FontResolver.ME.resolveFontName(Fonts.CLARENDON_BLKBT), {
				fontSize:fontSize, 
				color:0xbbbbbb,
				x:rect.x
			},
			{resizeOffset: true});
			label.x = (comp.width-label.width >> 1);
			label.y = (comp.height-label.height >> 1)-step;
			
			if (PraiaContext.ME.oneHandDevice)
			{
				label.y = (comp.height-label.height >> 1)-3;
			}
			
			return comp;
		}
		
//		override protected function releaseHandler(button: ButtonComponent, touch: Touch): void
//		{
//			super.releaseHandler(button, touch);
//			
//		}
		
		override protected function pressHandler(button : ButtonComponent, touch : Touch) : void
		{
			super.pressHandler(button, touch);
			
			Sounds.ME.playFx(SoundID.BUTTON_CLICK);//, null, 1);
//			Sounds.ME.setMusicVolume(0, 2);
		}
	}
}