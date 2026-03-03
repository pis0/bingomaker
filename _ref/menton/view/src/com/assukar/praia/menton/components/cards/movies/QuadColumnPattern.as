package com.assukar.praia.menton.components.cards.movies
{
	import com.assukar.airong.error.AssukarError;
	import com.assukar.praia.menton.assets.MentonAssets;
	import com.assukar.praia.menton.components.cards.Cardd;
	import com.assukar.praia.menton.components.particles.MentonParticle;
	import com.assukar.praia.menton.domain.Pattern;
	import com.assukar.praia.menton.domain.PatternGroup;
	import com.assukar.view.starling.AssukarMovieClip;
	import com.assukar.view.starling.Component;
	import flash.geom.Point;
	import flash.geom.Rectangle;
	import starling.display.Image;
	import starling.display.Quad;

	/**
	 * @author Diogo
	 */
	public class QuadColumnPattern 
	extends Component 
//	implements IAnimatable
	{
		private var initPosLine: Point;
//		private var line: Image;
		private var cardd: Cardd;
//		private var particle: MentonParticle;

		private var movieWater  :AssukarMovieClip;
		private var container	:Component;
		
		private var frameMovie:Image;
		
		private var pattern:Pattern;
		
		private var bubbles:MentonParticle;
		
		private var containerCoins:Component;
		
		private var listCoins:Vector.<CoinsPrize>;

		override public function dispose(): void
		{
			bubbles.stop();
			bubbles = null;
//			particle.stop();
			super.dispose();
		}
		
		public function position(p: Point): void
		{
//			initPosLine.x = line.x = -27;
//			initPosLine.y = line.y = p.y-10;
		}

		public function QuadColumnPattern(card: Cardd, p:Pattern)
		{
			cardd = card;

//			initPosLine = new Point(-12, p1.y+8);//27
			initPosLine = new Point(0, 0);//27
			pattern = p;
		}

		override protected function draww(): void
		{
			container = addComp(Component,{x:15, y:31, alpha:.9});		
			
			listCoins = new <CoinsPrize>[];	
			
			var textureName:String = "";
			
			var posXPattern:int = 10;
			
			switch(pattern.group)
			{
				case PatternGroup.DOUBLE_COLUMN:
				{
					textureName = "MolduraPadraoF";
					break;					
				}
				case PatternGroup.TRIPLE_COLUMN:
				{
					textureName = "MolduraPadraoE";
					break;					
				}
				case PatternGroup.QUAD_COLUMN:
				{
					textureName = "MolduraPadraoD";
					break;					
				}
				case PatternGroup.QUAD_COLUMN_3:				
				case PatternGroup.FULL:
				{
					textureName = "MolduraPadraoA";
					break;					
				}
				default:
					throw new AssukarError("Invalid PatternGroup: "+pattern.group);				
			}
			
			
			switch(pattern)
			{
				case Pattern.DOUBLE_COLUMN_2:
				case Pattern.TRIPLE_COLUMN_2:
				case Pattern.QUAD_COLUMN_2:
				{
					posXPattern = 72;
					break;					
				}				
				case Pattern.DOUBLE_COLUMN_3:
				case Pattern.TRIPLE_COLUMN_3:
				{
					posXPattern = 137;
					break;					
				}				
				case Pattern.DOUBLE_COLUMN_4:				
				{
					posXPattern = 200;
					break;					
				}				
				
				{
					posXPattern = 200;
					break;					
				}				
				default:			
					posXPattern = 10;				
			}
			
			movieWater = container.addMovie(MentonAssets.ME.textures("liquido_vertical"));
			
			
			containerCoins = addComp(Component,{y:120});
			
			frameMovie = addImage(MentonAssets.ME.texture(textureName),{x:posXPattern, y:23});
			
			bubbles = new MentonParticle("BolhaAgua", container,frameMovie.width*.5,100);			
			
			container.clipRect = new Rectangle(posXPattern-10,0,frameMovie.width-9, frameMovie.height);
			
			var quad:Quad = addQuad(frameMovie.width-9, frameMovie.height, 0xff00ff,{alpha:.5});
			quad.x = frameMovie.x+5;
			quad.y = frameMovie.y;
			
			containerCoins.mask = quad;
			
			
			//3 column  / MolduraPadraoE
			
			//4 column  / MolduraPadraoD
			
			//2 column  / MolduraPadraoF
			
			//full column  / MolduraPadraoA
			
			
//			var scale:Number = 1;
//			if(PraiaContext.ME.oneHandDevice){
//				scale = .88;
//				initPosLine.x = -12;
//				initPosLine.y = initPosLine.y+4;
//			}

			 
			
			//line = addImage(MentonAssets.ME.texture("patternline2"), {x:initPosLine.x, y:initPosLine.y, scaleX:scale, scaleY:scale, smoothing:TextureSmoothing.TRILINEAR});
//			particle = new MentonParticle("Spark", cardd, 161, initPosLine.y);
		}
		
		public function addCoins(total:int):void
		{
			var totalByLine:int;
			switch(pattern.group)
			{
				case PatternGroup.DOUBLE_COLUMN:
				{
					totalByLine = 2;
					break;					
				}
				case PatternGroup.TRIPLE_COLUMN:
				case PatternGroup.QUAD_COLUMN:
				{
					totalByLine = 3;
					break;					
				}				
				case PatternGroup.QUAD_COLUMN_3:				
				case PatternGroup.FULL:
				{
					totalByLine = 4;
					break;					
				}
				default:
					throw new AssukarError("Invalid PatternGroup: "+pattern.group);				
			}
			
			var div:int = total>totalByLine?totalByLine:total;
			
			var spaceX:int = Math.round(frameMovie.width/div);
			var spaceY:int = 60;
			
			var i:int;		
			
			for(i=0;i<total;i++)
			{
				listCoins.push(containerCoins.addComp(CoinsPrize,{x:spaceX*i, y:spaceY}));
				
				if(i>=div) spaceY = 120;
			}
			
			containerCoins.x = frameMovie.x+34;//+(frameMovie.width-containerCoins.width)*.5;		
		}
		
		public function startAnimation(callBack:Function):void
		{
			var i:int;
			var len:int = listCoins.length;
			for (i=0;i<len;i++)
			{
				listCoins[i].start(i/2);
			}
			
			bubbles.start();
			juggler.tween(containerCoins, .9, {y:0});
			
			
			playAnima(movieWater,1,function():void
			{
				movieWater.moveToLastFrame();
				
				
				juggler.delayCall(function():void
				{
					for (i=0;i<len;i++)
					{
						listCoins[i].playSplash(i/2);
					}
					
					juggler.delayCall(callBack, 1);	
				}, 2);
				
				
//				
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

//		public function advanceTime(time: Number): void
//		{
//		}
	}
}
