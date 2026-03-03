package com.assukar.praia.menton.components.bonus.boxGame 
{
	import com.assukar.airong.error.AssukarError;
	import com.assukar.praia.domain.gameevents.PraiaGameEvents;
	import com.assukar.praia.menton.assets.MentonAssets;
	import com.assukar.praia.menton.assets.SoundID;
	import com.assukar.praia.menton.components.particles.MentonParticle;
	import com.assukar.praia.menton.domain.FeteDuCitroinBonusSession;
	import com.assukar.view.sounds.Sounds;
	import com.assukar.view.starling.AssukarJuggler;
	import com.assukar.view.starling.AssukarMovieBytes;
	import com.assukar.view.starling.Component;
	import com.assukar.view.starling.TouchableComponent;
	import flash.geom.Point;

	import starling.display.Image;
	import starling.textures.TextureSmoothing;
	/**
	 * ...
	 * @author Igor Henrique Santos
	 */
	public class BoxM extends TouchableComponent
	{
		private static const FPSANIMA:int = 30;
		public var index:int;
		private var staticBox:Component;
		private var animateBox:AssukarMovieBytes;
		private var boxFront:Image;
		private var boxBack:Image;
		private var amountLemons1:AssukarMovieBytes;
		private var amountLemons2:AssukarMovieBytes;
		private var amountLemons3:AssukarMovieBytes;
		private var blinkImage:Image;
        private var onBlink:Boolean = false;
        private var delayCall:uint;
		private var crownbar:AssukarMovieBytes;
		private var hammer:AssukarMovieBytes;
		private var sledgeHammer:AssukarMovieBytes;
		private var particlesLemons:MentonParticle;
		//controle se a caixa ja foi selecionada
		public var isChoiced:Boolean = false;
		
		public function BoxM(p_index:int) 
		{
			this.index = p_index;
		} 
		
		override public function dispose():void 
		{
			particlesLemons.stop();
			particlesLemons = null;
			super.dispose();
		}
		
		override protected function draww():void 
		{
			super.draww();
			
			staticBox = addComp();
			staticBox.addImage(MentonAssets.ME.texture("box_back"));
			
			var lemonPos:Point = new Point(65,75);
			
			animateBox = addObject(new AssukarMovieBytes(MentonAssets.ME.getBytes("boxExplosion"),
						MentonAssets.ME.texture).draw(),{x:100,y:100,smoothing:TextureSmoothing.BILINEAR});
						
			amountLemons1 = addObject(new AssukarMovieBytes(MentonAssets.ME.getBytes("lemonpile1"),
						MentonAssets.ME.texture).draw(), { x:lemonPos.x, y:lemonPos.y,visible:false, smoothing:TextureSmoothing.BILINEAR } );
						
			amountLemons2 = addObject(new AssukarMovieBytes(MentonAssets.ME.getBytes("lemonpile2"),
						MentonAssets.ME.texture).draw(), { x:lemonPos.x, y:lemonPos.y,visible:false, smoothing:TextureSmoothing.BILINEAR } );
						
			amountLemons3 = addObject(new AssukarMovieBytes(MentonAssets.ME.getBytes("lemonpile3"),
						MentonAssets.ME.texture).draw(), { x:lemonPos.x, y:lemonPos.y, visible:false, smoothing:TextureSmoothing.BILINEAR } );
						
			
			boxBack = addImage(MentonAssets.ME.texture("box_top"));	
			boxFront = addImage(MentonAssets.ME.texture("box_front"));
			
			blinkImage = addImage(MentonAssets.ME.texture("box_selection"), {x:-7, y:-5} );
			
			crownbar = addObject(new AssukarMovieBytes(MentonAssets.ME.getBytes("crownbar"),
						MentonAssets.ME.texture).draw(), { x:180, y: 0, visible:false, smoothing:TextureSmoothing.BILINEAR } );
			
			hammer = addObject(new AssukarMovieBytes(MentonAssets.ME.getBytes("hammer2"),
						MentonAssets.ME.texture).draw(), { x:150, y: -30, visible:false, smoothing:TextureSmoothing.BILINEAR } );
						
			sledgeHammer = addObject(new AssukarMovieBytes(MentonAssets.ME.getBytes("hammer1"),
						MentonAssets.ME.texture).draw(), { x:150, y:-30,visible:false,smoothing:TextureSmoothing.BILINEAR} );
			
			hide(blinkImage);
			
			particlesLemons = new MentonParticle("bonuslemon", this,100,50);
			
			show(staticBox);
			hide(animateBox);
		}
		
		public function useCrownBar():void
		{
			show(crownbar);
			crownbar.play();
			crownbar.repeatCount = 1;
			crownbar.fps = FPSANIMA;
		}
		
		public function showFront(idLemons:int):void
		{
			configureLemons(idLemons,true);
			AssukarJuggler.ME.tween(boxFront, 0.2, {delay:0.3,x:boxFront.x+20, y:boxFront.y+40,rotation:0.6 } );
		}
		
		public function useHammer():void
		{
			show(hammer);
			hammer.play();
			hammer.repeatCount = 1;
			hammer.fps = FPSANIMA;
		}
		
		public function useSledgeHammer():void
		{
			show(sledgeHammer);
			sledgeHammer.play();
			sledgeHammer.repeatCount = 1;
			sledgeHammer.fps = FPSANIMA;
		}
		
		public function explodeBox():void
		{
			isChoiced = true;
			stopBlink();
			hide(staticBox,boxFront,boxBack);
			show(animateBox);
			animateBox.play();
			animateBox.repeatCount = 1;
			animateBox.fps = FPSANIMA;
			Sounds.ME.playFx(SoundID.BONUS_BOX_BREAKING, null, 1, Sounds.SOUND_TRANSFORM_VOLUME_60);
			PraiaGameEvents.MENTON_BONUS_BOX.dispatch();
		}
		
		public function configureLemons(lemonId:int,isXray:Boolean = false):void
		{
			var currentMovieByte:AssukarMovieBytes;
			switch (lemonId) 
			{
				case FeteDuCitroinBonusSession.LEMON_BOX_SMALL:
					amountLemons1.visible = true;
					currentMovieByte = amountLemons1;
				break;
				case FeteDuCitroinBonusSession.LEMON_BOX_MEDIUM:
					amountLemons2.visible = true;
					currentMovieByte = amountLemons2;
				break;
				case FeteDuCitroinBonusSession.LEMON_BOX_LARGE:
					amountLemons3.visible = true;
					currentMovieByte = amountLemons3;
				break;
				default:
					throw AssukarError("WRONG ID LEMON: " + lemonId);
				break;
			}
			
			if (currentMovieByte && !isXray)
			{
				currentMovieByte.play();
				currentMovieByte.fps = FPSANIMA;
				currentMovieByte.repeatCount = 1;
				
				particlesLemons.start(0.7, 0.2);
				particlesLemons.particle.speed = 700;
				particlesLemons.particle.gravityY = 700;
				
				switch (index) 
				{
					case 0:
						particlesLemons.particle.emitAngle = 4.9;
					break;
					case 1:
						particlesLemons.particle.emitAngle = 4.7;
					break;
					case 2:
						particlesLemons.particle.emitAngle = 4.4;
					break;
					
				}
			}
		}
		
		public function blinkIndication():void
		{
			if (!isChoiced)
			{
				if (!onBlink)
				{
					onBlink = true;
					show(blinkImage);
				}
				else
				{
					onBlink = false;
					hide(blinkImage);
				}
				
				delayCall = AssukarJuggler.ME.delayCall(blinkIndication, 0.8);
			}
		}
		
		public function stopBlink():void
		{
			AssukarJuggler.ME.removeByID(delayCall);
			onBlink = false;
			hide(blinkImage);
		}
		
		public function showXray(idLemon:int):void
		{
			configureLemons(idLemon,true);
			AssukarJuggler.ME.tween(boxFront,0.6,{alpha:0.5});
		}
		
	}

}