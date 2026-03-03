package com.assukar.praia.menton.components.cards
{
	import com.assukar.airong.error.AssukarError;
	import com.assukar.praia.menton.assets.MentonAssets;
	import com.assukar.view.starling.AssukarMovieBytes;
	import com.assukar.view.starling.Component;
	import flash.geom.Point;
	import starling.animation.Transitions;
	import starling.textures.TextureSmoothing;
	
	public class FruitBonus extends Component
	{
		
		override public function dispose():void
		{
			
			juggler.removeTweens(container);
			super.dispose();
		}
		
		private var grapes:AssukarMovieBytes;
		private var apple:AssukarMovieBytes;
		private var strawberry:AssukarMovieBytes;
		private var pineapple:AssukarMovieBytes;
		
		private var container:Component;
		
		override protected function draww():void
		{
			container = addComp();
			grapes = container.addComp(new AssukarMovieBytes(MentonAssets.ME.getBytes("grapes"), MentonAssets.ME.texture, null, 0, null, 30, "", true), {smoothing: TextureSmoothing.BILINEAR}, {x: -84, y: -66});
			apple = container.addComp(new AssukarMovieBytes(MentonAssets.ME.getBytes("apple"), MentonAssets.ME.texture, null, 0, null, 30, "", true), {smoothing: TextureSmoothing.BILINEAR}, {x: -91, y: -86});
			strawberry = container.addComp(new AssukarMovieBytes(MentonAssets.ME.getBytes("strawberry"), MentonAssets.ME.texture, null, 0, null, 30, "", true), {smoothing: TextureSmoothing.BILINEAR}, {x: -99, y: -80});
			pineapple = container.addComp(new AssukarMovieBytes(MentonAssets.ME.getBytes("pineapple"), MentonAssets.ME.texture, null, 0, null, 30, "", true), {smoothing: TextureSmoothing.BILINEAR}, {x: -98, y: -69});
		
		}
		
		static public const GRAPES:uint = 1 << 0;
		static public const APPLE:uint = 1 << 1;
		static public const STRAWBERRY:uint = 1 << 2;
		static public const PINEAPPLE:uint = 1 << 3;
		
		public function fire(fruit:uint, pos:Point, callback:Function = null):void
		{
			
			reset();
			var currentFruit:AssukarMovieBytes;
			
			if (fruit & GRAPES)
			{
				currentFruit = grapes;
			}
			else if (fruit & APPLE)
			{
				currentFruit = apple;
			}
			else if (fruit & STRAWBERRY)
			{
				currentFruit = strawberry;
			}
			else if (fruit & PINEAPPLE)
			{
				currentFruit = pineapple;
			}
			else throw new AssukarError(fruit + " is an invalid fruit");
			
			show(currentFruit);
			currentFruit.repeatCount = 1;
			container.pos(400 * Math.random(), 100 * Math.random());
			container.alpha = 0;
			container.scale = 3;
			
			juggler.removeTweens(container);
			juggler.tween(container, .3, { //
				alpha: 1, //
				scaleX: 1, scaleY: 1, //
				x: 64 * pos.y, //
				y: 48 * pos.x, //				
				transition: Transitions.EASE_IN_EXPO, //
				onComplete: function():void
				{
					currentFruit.play();
					if (callback) callback();
				} //
			});
		
		}
		
		public function reset():void
		{
			grapes.stop();
			apple.stop();
			strawberry.stop();
			pineapple.stop();
			
			container.pos(0, 0);
			container.scale = 1.0;
			
			hide(grapes, apple, strawberry, pineapple);
		}
		
		
		public function randomFruit():uint
		{
			return 8 / (Math.pow(2, Math.floor(4 * Math.random())));			
		}
	
	}

}