package com.assukar.praia.menton.components.prizes
{
	import starling.display.Quad;

	import com.assukar.airong.utils.Statics;
	import com.assukar.praia.menton.domain.Pattern;
	import com.assukar.view.starling.AssukarJuggler;
	import com.assukar.view.starling.Component;
	import com.assukar.view.starling.TouchableComponent;
	
	public class PrizePanel extends TouchableComponent
	{
		
		// singleton
		static public var ME:PrizePanel;
		
		public function PrizePanel()
		{
			ME = singleton(ME);
		}
		
		override public function dispose():void
		{
			
			AssukarJuggler.ME.removeTweens(bg);
			
			super.dispose();
			ME = null;
		}
		
		private var bg:Component;
		//private var bgParticle:MentonParticle;	
		//private var bgParticleContainer:Component;	
		private var movieContainer:Component;
		
		override protected function draww():void
		{
			
			bg = addComp();
			bg.addQuad(Statics.TOTAL_W, 380, 0x000000, {alpha: 0.9});
			var quad0:Quad = bg.addQuad(Statics.TOTAL_W, 20, 0x000000, {y: 380});
			quad0.setVertexAlpha(0, 0.9);
			quad0.setVertexAlpha(1, 0.9);
			quad0.setVertexAlpha(2, 0);
			quad0.setVertexAlpha(3, 0);
			
			//bgParticleContainer = addComp();
			//bgParticle = new MentonParticle("PremioBg", bgParticleContainer);
			
			movieContainer = addComp();
			
			reset();
			this.enable();
		}
		
		private var complete:Function;
		
//		private var doubleMovie:DoubleLineMovie;
//		private var bingoMovie:BingoMovie;
		
		public function playMovie(pattern:Pattern, callback:Function = null):void
		{
			
			complete = function():void
			{
				hideBg();
				callback();
			};
			reset();
			//showBg();
			
			switch (pattern)
			{
			case Pattern.DOUBLE_LINE_1: 
			case Pattern.DOUBLE_LINE_2: 
			case Pattern.DOUBLE_LINE_3:
			case Pattern.TRIPLE_COLUMN_1: 
			case Pattern.TRIPLE_COLUMN_2: 
			case Pattern.TRIPLE_COLUMN_3:
			case Pattern.QUAD_COLUMN_1: 
			case Pattern.QUAD_COLUMN_2: 
			case Pattern.QUAD_COLUMN_3:
				//doubleMovie = movieContainer.addComp(DoubleLineMovie);
				//doubleMovie.playMovie(0.0, 5.0, complete);
				complete();
				break;
			case Pattern.FULL: 
				//bingoMovie = movieContainer.addObject( new BingoMovie( MentonJackpotSession.ME.isValid( MentonEngine.ME.round ) ).draw());
				//bingoMovie.playMovie(0.0, 0.0, complete);
				complete();
				break;
			default: 
				if (callback != null) callback();
			}
		
		}
		
		public function reset():void
		{
			hideBg();
			movieContainer.removeChildren(0, -1, true);
		}
		
		private function hideBg():void
		{
			if (bg.visible)
			{
				AssukarJuggler.ME.removeTweens(bg);
				AssukarJuggler.ME.tween(bg, .3, {alpha: 0.0, //
					onComplete: function():void
					{
						hide(bg);
					}//
				});
					//bgParticle.stop();
			}
		}
		
//		private function showBg():void
//		{
//			show(bg);
//			bg.alpha = 0;
//			AssukarJuggler.ME.removeTweens(bg);
//			AssukarJuggler.ME.tween(bg, .3, {alpha: 1.0});
//			//bgParticle.start();
//		}
	
	}
}