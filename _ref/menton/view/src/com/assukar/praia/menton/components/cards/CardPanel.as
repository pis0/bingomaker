package com.assukar.praia.menton.components.cards
{
	import com.assukar.praia.menton.assets.MentonAssets;
	import com.assukar.praia.menton.assets.SoundID;
	import com.assukar.praia.menton.components.cards.movies.BingoMovie;
	import com.assukar.praia.menton.controllers.ButtonsController;
	import com.assukar.praia.menton.controllers.RoundMotion;
	import com.assukar.praia.menton.domain.SlotPosition;
	import com.assukar.view.sounds.Sounds;
	import com.assukar.view.starling.AssukarJuggler;
	import com.assukar.view.starling.AssukarMovieClip;
	import com.assukar.view.starling.Component;
	import starling.display.Image;
	import starling.textures.TextureSmoothing;

	
	public class CardPanel extends Component
	{
		// singleton
		static public var ME:CardPanel;
		
		public var cards:Vector.<Cardd> = new Vector.<Cardd>(4);
		
		//bel
		private var bellAnima:AssukarMovieClip;
		private var bellImage:Image;
		public var bingoAnima:BingoMovie;
		
		public function CardPanel()
		{
			ME = singleton(ME);
		}
		
		override public function dispose():void
		{
			cards = null;
			AssukarJuggler.ME.removeTweens(bellImage);

			super.dispose();
			ME = null;
		}
		
		override protected function draww():void
		{
			cards[3] = addComp(new Cardd(3));
			cards[2] = addComp(new Cardd(2));
			cards[1] = addComp(new Cardd(1));
			cards[0] = addComp(new Cardd(0));

			//bell
			bellAnima = addMovie(MentonAssets.ME.textures("sino_brilho"), {x: 256, y: 96, visible:false});
			bellImage = addImage(MentonAssets.ME.texture("Sino"), {x: 320, y: 130, rotation: 0.4, smoothing: TextureSmoothing.BILINEAR, visible:false});
			
			bingoAnima = addComp(BingoMovie, {name:"bingo", touchable:false, visible:false});
			setPositions();
		}
		
		public function getCard(x:int):Cardd
		{
			return cards[x];
		}
		
		public function setTitleColor(stakeIndex:int):void
		{
			for each (var c:Cardd in cards) c.setTitleColor(stakeIndex);
		}
		
//		public function oneToJackpot(cardIndex:int):void
//		{
//			getCard(cardIndex).showBingoParticle();
//		}
		
//		public function resetCardsPositions():void
//		{
////			for each (var c:Cardd in cards) c.hideBingoParticle();
//			setPositions();
//		}
		
		private var callBackBonus:Function;
		
		public function callBellAnimation(callBackBonus:Function):void
		{
			this.callBackBonus = callBackBonus;
			bellAnima.visible = true;
			Sounds.ME.playFx(SoundID.BELL_RINGING, null, 1, Sounds.SOUND_TRANSFORM_VOLUME_60);
			playAnima(bellAnima, 5, onCompleteBell);
		}
		
		private function onCompleteBell(obj:Object):void
		{
			bellAnima.visible = false;
			bellImage.visible = true;
			AssukarJuggler.ME.tween(bellImage, 0.6, {x: 550, y: -200, onComplete: resetBell});
		}
		
		private function resetBell():void
		{
			this.callBackBonus();
			bellAnima.visible = bellImage.visible = false;
			bellImage.x = 320;
			bellImage.y = 130;
		}
		
//		public function resetCards(cardd:Cardd = null):void
//		{
//			clear();
//			setPositions();
////			for each (var c:Cardd in cards)
////			{
////				c.show();
////				c.hideBingoParticle();
////			}
//		}
		
		public function setPositions():void
		{
			var i:uint = 0, //
			ctemp:Cardd;
			for (; i < 4; i++)
			{
				ctemp = cards[i];
				ctemp.pos(//
				(332 + 5) * (i % 2), //
				(168 + 5) * int(i / 2) // 
				);
				ctemp.scale = 1.0;
				ctemp.setInitPos();
			}	
		}
		
		
		public function resetJackpotMissing():void
		{
			for each (var c:Cardd in cards) c.cleanJackpotText();
		}
		
		private var lastClearFrameCount: int = 0;
		public function clear():void
		{
			if (frameCount == lastClearFrameCount) return;
			lastClearFrameCount = frameCount; 
			for each (var c:Cardd in cards){
				c.clear();
				c.show();
//				c.hideBingoParticle();
			}
			AssukarJuggler.ME.removeTweenVector(cards);
			Slot.missingMotion.clearAndStop();
		}
		
		public function turn(on:Boolean):void
		{
			for each (var c:Cardd in cards)
			{
				on ? c.enable() : c.disable();
			}
		}
		
		public function callFruitBonus(bombPositions:Vector.<SlotPosition>, callback:Function):void 
		{
			var counter:uint = 0;
			Sounds.ME.playFx(SoundID.BOMB_FALL, null, 1, Sounds.SOUND_TRANSFORM_VOLUME_60);
			for each(var sp:SlotPosition in bombPositions)
			{
				getCard(sp.cardIndex).fruitBonusFire(sp, function():void
				{
					if (++counter >= bombPositions.length){ 
						Sounds.ME.playFx(SoundID.BOMB_EXPLODE, null, 1, Sounds.SOUND_TRANSFORM_VOLUME_60);
						callback();
					}
				});
			}
		}
		
		public function animaBingo(cardIndex:int):void{
			bingoAnima.stopAnimation();
			switch(cardIndex){
				case 0:
					bingoAnima.x = -209;
					bingoAnima.y = -340;
					break;
				case 1:
					bingoAnima.x = 128;
					bingoAnima.y = -340;
					break;
				case 2:
					bingoAnima.x = -209;
					bingoAnima.y = -167;
					break;
				case 3:
					bingoAnima.x = 128;
					bingoAnima.y = -167;
					break;
				default:
					break;
			}
			
			bingoAnima.isRunning = true;
			juggler.delayCall(function():void{
				show(bingoAnima);
				bingoAnima.initBingo();
				for(var i:int = 0; i < cards.length; i++)
					hide(cards[i]);
				
				juggler.tween(bingoAnima, 1, {x:-70, y:-247, onComplete:bingoAnima.startAnimation, onCompleteArgs:[endBingoAnima]});
				ButtonsController.ME.setState(ButtonsController.PLAY, false);
			}, 1);
			ButtonsController.ME.setState(ButtonsController.PLAY, false);
		}
		
		private function endBingoAnima():void{
			bingoAnima.stopAnimation();
			bingoAnima.visible = true;
			for(var i:int = 0; i < cards.length; i++)
				show(cards[i]);
			RoundMotion.ME.processEndOfDraws();
		}
	}
}