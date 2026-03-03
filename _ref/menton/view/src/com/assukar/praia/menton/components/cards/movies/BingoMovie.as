package com.assukar.praia.menton.components.cards.movies {
	import com.assukar.praia.menton.components.particles.MentonParticle;
	import starling.textures.TextureSmoothing;
	import com.assukar.praia.menton.assets.MentonAssets;
	import com.assukar.view.starling.AssukarMovieBytes;

	/**
	 * @author User
	 */
	public class BingoMovie extends MoviePattern {
		
		private var bingoAnima:AssukarMovieBytes;
		private var chipExplosionParticle:MentonParticle;
		private var lemonExplosionParticle:MentonParticle;
		private var bubblesParticle:MentonParticle;
		
		public function BingoMovie() 
		{
			super();
		}
		
		override public function dispose():void
		{
			//bubblesParticle.stop(); 
			//bubblesParticle = null;
			//
			//chipExplosionParticle.stop(); 
			//chipExplosionParticle = null; 
			//
			//lemonExplosionParticle.stop(); 
			//lemonExplosionParticle = null; 
			
			super.dispose();
		}
		
		override protected function draww(): void
		{
			bingoAnima = addObject(new AssukarMovieBytes(MentonAssets.ME.getBytes("bingo"),MentonAssets.ME.texture,null,0,null,0,"",true));
			bingoAnima.repeatCount = 1;
			bingoAnima.fps = 30;
			bingoAnima.smoothing = TextureSmoothing.BILINEAR;
			
			bubblesParticle = new MentonParticle("menton_pipoqueira_bbl", this, 377, 460);
			chipExplosionParticle = new MentonParticle("menton_chip_xplosion", this, 380, 180);
			lemonExplosionParticle = new MentonParticle("menton_lemon_xplosion", this, 367, 200);
		}
		
		public function initBingo():void{
			bingoAnima.gotoFrame(1);
			show(bingoAnima);
		}
		
		public function startAnimation(callBack:Function):void
		{
			isRunning = true;
			bingoAnima.callbackk = callBack;
			bingoAnima.play();
			
			juggler.delayCall(function():void{
				bubblesParticle.start();
				bubblesParticle.particle.emitterXVariance = 170;
				bubblesParticle.particle.lifespan = 0.7;
				bubblesParticle.particle.lifespanVariance = 0.5;
				bubblesParticle.particle.emitterYVariance = 50;
				
				chipExplosionParticle.start();
				lemonExplosionParticle.start();
				chipExplosionParticle.particle.emitterXVariance = 250;
				lemonExplosionParticle.particle.emitterXVariance = 250;
				
			}, 1.85);
		}
		
		public function stopAnimation():void{
			isRunning = false;
			bingoAnima.stop();
			hide(bingoAnima);
			bingoAnima.callbackk = null;
			
			chipExplosionParticle.stop();
			lemonExplosionParticle.stop();
			bubblesParticle.stop();
		}
		
	}
}
