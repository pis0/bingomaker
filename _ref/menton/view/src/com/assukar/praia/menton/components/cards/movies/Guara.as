package com.assukar.praia.menton.components.cards.movies
{
	import starling.display.Image;

	import com.assukar.praia.menton.assets.MentonAssets;
	import com.assukar.view.starling.AssukarMovieClip;
	import com.assukar.view.starling.Component;

	/**
	 * @author User
	 */
	public class Guara extends Component {
		
		// extra balls
		static public const GUARA_ANIMA_FLY_IN:int = 0;
		static public const GUARA_ANIMA_IDLE:int = 1;
		static public const GUARA_ANIMA_SUSPENSE:int = 2;
		static public const GUARA_ANIMA_BINGO:int = 3;
		static public const GUARA_ANIMA_FLY_OUT:int = 4;
		
		private var guaraFloor:Image;
		private var guaraFly:AssukarMovieClip;
		private var guaraIdle:AssukarMovieClip;
		private var guaraSuspense:AssukarMovieClip;
		private var guaraBingo:AssukarMovieClip;
		
		public function Guara() {
			super();
		}
		
		override protected function draww() : void{
			guaraFloor = addImage(MentonAssets.ME.texture("guara_floor"), {name:"floor"});
			guaraFly = addMovie(MentonAssets.ME.textures("guara_fly"), {x:160, y:-150, name:"fly"});
			guaraIdle = addMovie(MentonAssets.ME.textures("guara_idle"), {x:-25, y:-100, name:"idle"});
			guaraSuspense = addMovie(MentonAssets.ME.textures("guara_suspense"), {x:-45, y:-100, name:"suspense"});
			guaraBingo = addMovie(MentonAssets.ME.textures("guara_bingo"), {x:-45, y:-145, name:"bingo"});
			hide(guaraFloor, guaraFly, guaraIdle, guaraSuspense, guaraBingo);
		}
		
		public function runAnima(animaType:int):void{
			if(!guaraFloor.visible && animaType != GUARA_ANIMA_FLY_IN)
				return;

			reset(false);
			switch(animaType){
				case GUARA_ANIMA_FLY_IN:
					show(guaraFloor);
					playAnima(guaraFly);
					guaraFly.x = 160;
					guaraFly.y = -150;
					juggler.tween(guaraFly, 0.4, {x:-40, y:-95, onComplete:runAnima, onCompleteArgs:[GUARA_ANIMA_IDLE]});	
					break;
				case GUARA_ANIMA_IDLE:
					playAnima(guaraIdle);
					break;
				case GUARA_ANIMA_SUSPENSE:
					playAnima(guaraSuspense);
					break;
				case GUARA_ANIMA_BINGO:
					playAnima(guaraBingo);
					break;
				case GUARA_ANIMA_FLY_OUT:
					guaraFly.x = 160;
					guaraFly.y = -95;
					guaraFly..scaleX = -1;
					playAnima(guaraFly);
					juggler.tween(guaraFly, 0.4, {x:320, y:-140, onComplete:reset, onCompleteArgs:[true]});
					break;
				default:
					break;
			}
		}
		
		public function reset(all:Boolean = true):void{
			stop(guaraFly, guaraIdle, guaraSuspense, guaraBingo);
			hide(guaraFly, guaraIdle, guaraSuspense, guaraBingo);
			guaraFly..scaleX = 1;
			guaraFly.x = 160;
			guaraFly.y = -150;
			
			if(all)
				hide(guaraFloor);
		}


	}
}
