package com.assukar.praia.menton.components.buttons
{

	import starling.events.Touch;

	import com.assukar.domain.services.dictio.Dictio;
	import com.assukar.praia.assets.Fonts;
	import com.assukar.praia.menton.assets.MentonAssets;
	import com.assukar.praia.menton.assets.SoundID;
	import com.assukar.praia.menton.controllers.ButtonsController;
	import com.assukar.praia.main.PraiaContext;
	import com.assukar.view.sounds.Sounds;
	import com.assukar.view.starling.AssukarTextField;
	import com.assukar.view.starling.Component;
	import com.assukar.view.starling.buttons.ButtonComponent;

	import flash.geom.Rectangle;

	public class ShuffleButton extends MentonButton
	{
//		function ShuffleButton()
//		{
//			super(true, true, false, false);
//		}

		private var fontSize:int;
		private var rect	:Rectangle;
		private var step	:int;
		
		override public function dispose() : void
		{
			super.dispose();
			juggler.removeByID(volumeDelay);
		}

		override protected function draww(): void
		{
			fontSize= 23;
			rect = new Rectangle(0,0,74,49);
			step = 5;
			
			if(PraiaContext.ME.oneHandDevice)
			{
				fontSize = 40;
				rect.setTo(0, 0, 120, 80);	
				step = 15;
			}
			
			super.draww();
//			assignKeys([Keyboard.RIGHT]);
		}

		override protected function defaultComp(): Component
		{
			var comp: Component = new Component();
			comp.addImage(MentonAssets.ME.texture("bttrocar1"), {});
						
			var label: AssukarTextField = comp.addText(rect.width, rect.height, Dictio.upper("Swap"), Fonts.RUMPELSTILTSKIN, {fontSize:fontSize, color:0x722a06, resizeOffset:true});
			
			label.x = comp.width-label.width >> 1;
			label.y = (comp.height-label.height >> 1)-step;

			return comp;
		}

		override protected function pressedComp(): Component
		{
			var comp: Component = new Component();
			comp.addImage(MentonAssets.ME.texture("bttrocar2"), {});
			
			var label: AssukarTextField = comp.addText(rect.width, rect.height, Dictio.upper("Swap"), Fonts.RUMPELSTILTSKIN, {fontSize:fontSize, color:0xd47611},{resizeOffset:true});
			
			label.x = comp.width-label.width >> 1;
			label.y = (comp.height-label.height >> 1)+2;
			
//			label.x = 13;
//			label.y = 5+7;

			return comp;
		}

		override protected function disabledComp(): Component
		{
			var comp: Component = new Component();
			comp.addImage(MentonAssets.ME.texture("bttrocar3"), {});
			
			var label: AssukarTextField = comp.addText(rect.width, rect.height, Dictio.upper("Swap"), Fonts.RUMPELSTILTSKIN, {fontSize:fontSize, color:0x722a06},{resizeOffset: true});
			
			label.x = comp.width-label.width >> 1;
			label.y = (comp.height-label.height >> 1)-step;
			
			return comp;
		}

		// override protected function pressHandler(button : ButtonComponent, touch : Touch) : void{
		// super.pressHandler(button, touch);
		// }
		
		
		private var volumeDelay : uint;
		override protected function releaseHandler(button: ButtonComponent, touch: Touch): void
		{
			super.releaseHandler(button, touch);
				juggler.removeByID(volumeDelay);
				if (ButtonPanel.ME.playButton.phase == ButtonsController.PLAY) {
					volumeDelay = juggler.delayCall(Sounds.ME.setMusicVolume, 8, .8, .6);
				}
		}

		
		
		override protected function pressHandler(button : ButtonComponent, touch : Touch) : void {
			super.pressHandler(button, touch);
			
//			Sounds.ME.playFx(SoundID.BUTTON_CLICK, null, 1);
			Sounds.ME.playFx(SoundID.BUTTON_SHUFFLE, null, 1);
			juggler.removeByID(volumeDelay);
			Sounds.ME.setMusicVolume(0, .6);
		}
		
		
		override public function turn(on : Boolean) : void {
			super.turn(on);
			if(!on){
				juggler.removeByID(volumeDelay);
			}
		}		
	}
}
