package com.assukar.praia.menton.components.cards.movies
{
	import starling.textures.TextureSmoothing;
	import starling.display.Image;

	import com.assukar.praia.menton.assets.MentonAssets;
	import com.assukar.view.starling.AssukarMovieClip;
	import com.assukar.view.starling.Component;

	import flash.geom.Point;

	/**
	 * @author Diogo
	 */
	public class CoinsPrize extends Component
	{
		private var coin:Image;
		private var splash:AssukarMovieClip;
		private var initPos:Point;
		
		override protected function draww() : void
		{
			splash = addMovie(MentonAssets.ME.textures("waterSPLpadrao"),{centerPivots:true});
			coin = addImage(MentonAssets.ME.texture("ficha"),{centerPivots:true, smoothing:TextureSmoothing.BILINEAR, scaleX:.6, scaleY:.6});
			
			
			
		}
		
		public function start(delay:Number):void
		{
			initPos = new Point(coin.x, coin.y);

			delayCall("startCoin", juggler.delayCall(movieCoin, delay));			
		}

		private function movieCoin() : void
		{
			var timer:Number = .2;
			
			juggler.tween(coin, .05+timer, {x:initPos.x - Math.random()*2, y:initPos.y - Math.random()*2, rotation:Math.random()*.2});
			juggler.tween(coin, .05+timer, {delay:.05+timer, x:initPos.x + Math.random()*4, y:initPos.y + Math.random()*4, rotation:Math.random()*-.2});
			juggler.tween(coin, .05+timer, {delay:.1+timer, x:initPos.x - Math.random()*2, y:initPos.y + Math.random()*2, rotation:Math.random()*.4});
			juggler.tween(coin, .05+timer, {delay:.17+timer, x:initPos.x+ Math.random()*4, y:initPos.y+ Math.random()*4, rotation:Math.random()*-.4, onComplete:movieCoin});
		}
		
		public function playSplash(delay:Number):void
		{
			juggler.removeTweens(coin);	
			
			juggler.delayCall(function():void
			{
				juggler.tween(coin, .1, {alpha:.5, scaleX:.3, scaleY:.3});
				juggler.tween(coin, .2, {delay:+.1, alpha:1, scaleX:1, scaleY:1, onComplete:function():void
				{
					juggler.tween(coin, .2, {alpha:0, scaleX:.5, scaleY:.5});
				
				}});
				
				playAnima(splash,1,null,.25);				
			
			},delay);			
		}		
	}
}