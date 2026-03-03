package com.assukar.praia.menton.components.cards.movies 
{
	import starling.display.Image;

	import com.assukar.praia.menton.assets.MentonAssets;
	import com.assukar.praia.menton.components.cards.Cardd;
	import com.assukar.praia.menton.components.particles.MentonParticle;
	import com.assukar.view.starling.AssukarMovieClip;
	import com.assukar.view.starling.Component;

	import flash.geom.Point;
	import flash.geom.Rectangle;

	/**
	 * ...
	 * @author Igor Henrique Santos
	 */
	public class DoubleLinePattern extends Component 
	{
		private var initPosLine: Point;
		private var cardd: Cardd;
		private var movieWaterA  :AssukarMovieClip;
		private var movieWaterB  :AssukarMovieClip;
		private var container	:Component;
		
		private var frameMovie:Image;
		
//		private var pattern:Pattern;
		
		private var bubbles:MentonParticle;
		
		public function DoubleLinePattern(card: Cardd, p1: Point)
		{
			cardd = card;
			initPosLine = new Point(0, p1.y+8);//27
		}
		
		override public function dispose():void 
		{
			bubbles.stop();
			bubbles = null;
			super.dispose();
		}
		
		override protected function draww(): void
		{
			container = addComp(Component,{x:15, y:31, alpha:.9});			
			
			var textureName:String = "MolduraPadraoB";
			
			var posXPattern:int = 10;
			
			movieWaterA = container.addMovie(MentonAssets.ME.textures("liqu_horizontal"));
			movieWaterB = container.addMovie(MentonAssets.ME.textures("liqu_horizontal"),{y:80});
			
			frameMovie = addImage(MentonAssets.ME.texture(textureName),{x:posXPattern, y:23});
			
			bubbles = new MentonParticle("BolhaAgua", container,frameMovie.width*.5,100);			
			
			container.clipRect = new Rectangle(posXPattern - 10, 0, frameMovie.width - 9, frameMovie.height);
			
		}
		
		public function startAnimation(callBack:Function):void
		{
//			Utils.wraplog("Double Line Start Animation");
			
			var coins:CoinsPrize = addComp(CoinsPrize,{x:frameMovie.width*.5, y:frameMovie.height*.5});
				coins.start(1);
			
			bubbles.start();
			
			playAnima(movieWaterA,1,function():void
			{
				movieWaterA.moveToLastFrame();
				
				coins.playSplash(1);
				
				juggler.delayCall(callBack, 1);
			});
			
			
			playAnima(movieWaterB,1,function():void
			{
				movieWaterB.moveToLastFrame();
			});
			
		}

//		override public function play(...animas): void
//		{
//			
//			movieWater.play();
//			
////			particle.start(.5);
//			hideAnimating();
//		}

		public function hideAnimating(): void
		{
			//juggler.tween(line, .4, {x:322});			
			//juggler.tween(line, .2, {delay:.4,alpha:0,onComplete:removeFromParent});
		}
		
	}

}