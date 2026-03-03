package com.assukar.praia.menton.components.prizes.movies
{

	import starling.animation.Transitions;
	import starling.display.Image;
	import starling.textures.TextureSmoothing;

	import com.assukar.airong.error.AssukarError;
	import com.assukar.airong.utils.Statics;
	import com.assukar.praia.assets.Fonts;
	import com.assukar.praia.assets.PraiaCommonAssets;
	import com.assukar.praia.domain.jackpots.JackpotMarkupController;
	import com.assukar.praia.domain.vip.VipStatus2;
	import com.assukar.praia.menton.assets.MentonAssets;
	import com.assukar.praia.menton.components.particles.MentonParticle;
	import com.assukar.view.starling.AssukarJuggler;
	import com.assukar.view.starling.AssukarMovieClip;
	import com.assukar.view.starling.Component;
	
	public class BingoMovie extends Component
	{
		private var isJackpot:Boolean;
		
		function BingoMovie(isJackpot:Boolean = false)
		{
			this.isJackpot = isJackpot;
		}
		
		override public function dispose():void
		{
			
			AssukarJuggler.ME.removeByID(this.inDelay);
			
			var i:uint, j:uint, len:uint, lenj:uint;
			
			i = 0;
			len = lineLedsColorfulList.length;
			for (; i < len; i++)
			{
				AssukarJuggler.ME.removeTweens(lineLedsColorfulList[i]);
			}
			
			AssukarJuggler.ME.removeByID(playLedsDottedMovieStepDelay);
			AssukarJuggler.ME.removeByID(playLedsDottedMovieDelay);
			len = lineLedsDottedDotsList.length;
			for (; i < len; i++)
			{
				j = 0;
				lenj = lineLedsDottedDotsList[i].length;
				for (; j < lenj; j++)
				{
					AssukarJuggler.ME.removeTweens(lineLedsDottedDotsList[i][j]);
				}
			}
			
			AssukarJuggler.ME.removeByID(smallBingosDelay);
			i = 0;
			len = smallBingos.length;
			for (; i < len; i++)
			{
				AssukarJuggler.ME.removeTweens(smallBingos[i]);
			}
			
			AssukarJuggler.ME.removeByID(playStoneMovieDelay);
			AssukarJuggler.ME.removeTweens(stoneContainer);
			
			AssukarJuggler.ME.removeByID(playBigBingoMovieDelay);
			AssukarJuggler.ME.removeTweens(bigBingo);
			
			lineLedsColorfulList.length = 0;
			lineLedsColorfulList = null;
			
			lineLedsDottedList.length = 0;
			lineLedsColorfulList = null;
			
			smallBingos.length = 0;
			smallBingos = null;
			
			i = 0;
			len = lineLedsDottedDotsList.length;
			for (; i < len; i++)
			{
				lineLedsDottedDotsList[i].length = 0;
				lineLedsDottedDotsList[i] = null;
			}
			lineLedsDottedDotsList.length = 0;
			lineLedsDottedDotsList = null;
			
			stopFireworks();
			
			super.dispose();
		}
		
		private var lineLedsColorfulContainer:Component;
		private var lineLedsColorfulList:Vector.<Image>;
		
		private var lineLedsDottedContainer:Component;
		private var lineLedsDottedList:Vector.<Component>;
		private var lineLedsDottedDotsList:Vector.<Vector.<Image>>;
		
		private var stoneContainer:Component;
		private var stoneBlinkMovie:AssukarMovieClip;
		private var stoneLightsMovie:AssukarMovieClip;
		
		private var smallBingos:Vector.<BingoTextComp>;
		
		private var bigBingo:BigBingoTextComp;
		
		private var particleHolder:Component;
		private var fireWorksParticle:Vector.<MentonParticle>;
		
		private var vipComp:Component;
		
		override protected function draww():void
		{
			particleHolder = addComp();
			fireWorksParticle = new Vector.<MentonParticle>();
			var i:int = 0;
			var ax:int = 0;
			var ay:int = 0;
			for (; i < 4; ++i)
			{
				ax = Math.random() * Statics.TOTAL_W;
				ay = Math.random() * 100;
				fireWorksParticle.push(new MentonParticle("MentonFogos", particleHolder, ax, ay));
			}
			
			// line leds colorful
			lineLedsColorfulContainer = addComp(null, {x: 70, y: 140});
			lineLedsColorfulList = new <Image>[];
			const bingobarLetterList:Vector.<String> = new <String>["A", "B", "C", "D", "E", "F", "G", "H"];
			var len:uint = (8 * 3), //
			index:uint, //
			imgTemp:Image;
			while (len--)
			{
				index = (8 * 3) - (len + 1);
				lineLedsColorfulList[index] = imgTemp = lineLedsColorfulContainer.addImage(MentonAssets.ME.texture("bingobarra" + bingobarLetterList[(len % 8)]));
				imgTemp.x = (imgTemp.width + 20) * uint(len / 8);
				imgTemp.y = (imgTemp.height + 8) * (len % 8);
			}
			
			// line leds dotted			
			lineLedsDottedContainer = addComp(null, {x: -8, y: -105});
			lineLedsDottedList = new <Component>[];
			lineLedsDottedDotsList = new <Vector.<Image>>[];
			len = 7;
			const lineLedsDottedPropsList:Vector.<Object> = new <Object>[{x: 273, y: 243}, //					
			{x: 486, y: 243}, //					
			{x: 84, y: 110, rotation: -0.5}, //				
			{x: 228, y: 51, rotation: -0.3}, //
			{x: 382, y: 56}, //					
			{x: 537, y: 51, rotation: 0.3}, //							
			{x: 687, y: 110, rotation: 0.47}	//			
			];
			var dotLen:uint, //
			dotIndex:uint, //
			compTemp:Component;
			while (len--)
			{
				index = 7 - (len + 1);
				lineLedsDottedList[index] = compTemp = lineLedsDottedContainer.addComp(null, {pivotsRatio: .5}, lineLedsDottedPropsList[index]);
				lineLedsDottedDotsList[index] = new <Image>[];
				dotLen = 15;
				while (dotLen--)
				{
					dotIndex = 15 - (dotLen + 1);
					lineLedsDottedDotsList[index][dotIndex] = imgTemp = compTemp.addImage(MentonAssets.ME.texture("bingoLamp"), {smoothing: TextureSmoothing.TRILINEAR});
					imgTemp.y = (imgTemp.height - 2) * dotLen;
				}
			}
			
			// small bingo text
			smallBingos = new <BingoTextComp>[addObject(new BingoTextComp(isJackpot).draw(), {x: 165, y: 235}), //
			addObject(new BingoTextComp(isJackpot).draw(), {x: 380, y: 235}), //
			addObject(new BingoTextComp(isJackpot).draw(), {x: 595, y: 235}) //
			];
			
			// island
			stoneContainer = addComp(null, {x: 60, y: 90 + 50});
			stoneBlinkMovie = stoneContainer.addMovie(MentonAssets.ME.textures("bingoPedraMenton"));
			stoneLightsMovie = stoneContainer.addMovie(MentonAssets.ME.textures("bingoLampsPedra"), {x: 90, y: 30});
			
			// big bingo 
			bigBingo = addObject(new BigBingoTextComp(isJackpot).draw(), {x: 384, y: 225 + 50});
			
			vipComp = addComp(null, {visible: false});
			var vip:int = VipStatus2.ME.stars;
			if (vip > 0)
			{
				var percentage:int = JackpotMarkupController.ME.myPercentageMarkup;
				vipComp.addImage(PraiaCommonAssets.ME.texture("vipjack" + vip + "_sk"), {scale:0.75, smoothing:TextureSmoothing.BILINEAR, name: "vipImg", x: 670, y: 111, centerPivots: true});
				vipComp.addText(103, 51, String("+" + percentage + "%"), Fonts.RUMPELSTILTSKIN, {name: "vip", x: 647, y: 85, fontSize: 45, color: 0xffcdf9});
			}
			
			startProps();
		
		}
		
		private function startFireworks():void
		{
			var ax:int = 0;
			var ay:int = 0;
			var i:int = 0;
			for (; i < fireWorksParticle.length; ++i)
			{
				delayCall("fireWorks" + i, juggler.delayCall(function(index:int):void
				{
					ax = Math.random() * Statics.TOTAL_W;
					ay = Math.random() * 100;
					
					fireWorksParticle[index].start(.1);
					fireWorksParticle[index].particle.emitterX = ax;
					fireWorksParticle[index].particle.emitterY = ay;
				}, 0.5 * i, i));
			}
			
			delayCall("fireWorks", juggler.delayCall(startFireworks, 2));
		}
		
		private function stopFireworks():void
		{
			destroyCall("fireWorks");
			
			var i:int = 0;
			for (; i < fireWorksParticle.length; ++i)
			{
				destroyCall("fireWorks" + i);
				fireWorksParticle[i].stop();
			}
		}
		
		private var playLedsDottedMovieDelay:uint;
		private var playStoneMovieDelay:uint;
		private var playBigBingoMovieDelay:uint;
		
		private var inDelay:uint;
		
		public function playMovie(inDelay:Number, outDelay:Number, complete:Function):void
		{
			
			startProps();
			startFireworks();
			vipComp.visible = true;
			
			AssukarJuggler.ME.removeByID(this.inDelay);
			this.inDelay = AssukarJuggler.ME.delayCall(function():void
			{
				
				show(lineLedsColorfulContainer);
				
				playLedsDottedMovie(LEDS_DOTTED_MODE_0);
				playLedsColorfulMovie(LEDS_COLORFUL_MODE_0);
				playSmallBingosMovie();
				
				AssukarJuggler.ME.removeByID(playStoneMovieDelay);
				playStoneMovieDelay = AssukarJuggler.ME.delayCall(playStoneMovie, 3.0);
				
				AssukarJuggler.ME.removeByID(playBigBingoMovieDelay);
				playBigBingoMovieDelay = AssukarJuggler.ME.delayCall(function():void
				{
					
					playBigBingoMovie();
					playLedsDottedMovie(LEDS_DOTTED_MODE_1);
					
					AssukarJuggler.ME.removeByID(playLedsDottedMovieDelay);
					playLedsDottedMovieDelay = AssukarJuggler.ME.delayCall(function():void
					{
						
						playLedsDottedMovie(LEDS_DOTTED_MODE_0);
						playLedsColorfulMovie(LEDS_COLORFUL_MODE_1);
						
						AssukarJuggler.ME.removeTweens(stoneContainer);
						AssukarJuggler.ME.tween(stoneContainer, 0.3, {alpha: 0, onComplete: function():void
						{
							stop(stoneBlinkMovie, stoneLightsMovie);
							vipComp.visible = false;
						}});
						
						AssukarJuggler.ME.removeTweens(bigBingo);
						AssukarJuggler.ME.tween(bigBingo, 0.3, {alpha: 0, delay: 0.3, onComplete: complete});
						
						stopFireworks();
					}, 5.0 + outDelay);
				
				}, 3.5);
			
			}, inDelay);
		
		}
		
		// big bingo movie
		private function playBigBingoMovie():void
		{
			show(bigBingo);
			bigBingo.playMovie();
		}
		
		// stone (island)
		private function playStoneMovie():void
		{
			
			// reset
			stoneContainer.x = -stoneContainer.width;
			
			show(stoneContainer);
			play(stoneBlinkMovie, stoneLightsMovie);
			
			AssukarJuggler.ME.removeTweens(stoneContainer);
			AssukarJuggler.ME.tween(stoneContainer, 1.0, {x: 60, transition: Transitions.EASE_OUT_EXPO});
		}
		
		// dotted leds movies
		static private const LEDS_DOTTED_MODE_0:uint = (1 << 2);
		static private const LEDS_DOTTED_MODE_1:uint = (1 << 3);
		static private const LEDS_DOTTED_ORDERS:Vector.<Vector.<uint>> = new <Vector.<uint>>[ //
		new <uint>[ //
		0, 0, 0, 1, 0, 2, 0, 3, 1, 0, 0, 4, 1, 1, 0, 5, 1, 2, 0, 6, 1, 3, 0, 7, 1, 4, 0, 8, 1, 5, //
		0, 9, 1, 6, 0, 10, 1, 7, 0, 11, 1, 8, 0, 12, 1, 9, 0, 13, 1, 10, 0, 14, 1, 11, 1, 12, 1, 13, 1, 14 // 				
		], // 
		new <uint>[ //
		2, 0, 3, 0, 4, 0, 5, 0, 6, 0, //
		2, 1, 3, 1, 4, 1, 5, 1, 6, 1, //
		2, 2, 3, 2, 4, 2, 5, 2, 6, 2, //
		2, 3, 3, 3, 4, 3, 5, 3, 6, 3, //
		2, 4, 3, 4, 4, 4, 5, 4, 6, 4, //
		2, 5, 3, 5, 4, 5, 5, 5, 6, 5, //
		2, 6, 3, 6, 4, 6, 5, 6, 6, 6, //
		2, 7, 3, 7, 4, 7, 5, 7, 6, 7, //
		2, 8, 3, 8, 4, 8, 5, 8, 6, 8, //
		2, 9, 3, 9, 4, 9, 5, 9, 6, 9, //
		2, 10, 3, 10, 4, 10, 5, 10, 6, 10, //
		2, 11, 3, 11, 4, 11, 5, 11, 6, 11, //
		2, 12, 3, 12, 4, 12, 5, 12, 6, 12, //
		2, 13, 3, 13, 4, 13, 5, 13, 6, 13, // 
		2, 14, 3, 14, 4, 14, 5, 14, 6, 14  //
		] //
		];
		
		private var playLedsDottedMovieStepDelay:uint;
		
		private function playLedsDottedMovie(mode:uint):void
		{
			
			show(lineLedsDottedContainer);
			
			// reset
			var i:uint, //
			j:uint, //
			lenj:uint, //
			leni:uint = lineLedsDottedDotsList.length;
			for (; i < leni; i++)
			{
				lenj = lineLedsDottedDotsList[i].length;
				j = 0;
				for (; j < lenj; j++)
				{
					lineLedsDottedDotsList[i][j].alpha = 0;
				}
			}
			
			var len:uint, //
			dotTemp:Image, //
			orders:Vector.<uint>;
			
			if (mode & LEDS_DOTTED_MODE_0)
			{
				orders = LEDS_DOTTED_ORDERS[0];
				i = 0;
				len = orders.length;
				for (; i < len; i += 2)
				{
					dotTemp = lineLedsDottedDotsList[orders[i]][orders[i + 1]];
					dotTemp.alpha = 0;
					AssukarJuggler.ME.tween(dotTemp, .05006, {alpha: 1, delay: 0.01 * i, //
						onComplete: function(target:Object):void
						{ //
							AssukarJuggler.ME.tween(target, .05006, {alpha: 0, delay: 0.5});
						}, //
						onCompleteArgs: [dotTemp] //
					});
				}
				
			}
			else if (mode & LEDS_DOTTED_MODE_1)
			{
				
				orders = LEDS_DOTTED_ORDERS[1];
				
				var repeatCount:uint = 4;
				function step():void
				{
					i = 0;
					len = orders.length;
					var dotTempList:Vector.<Image> = new <Image>[];
					for (; i < len; i += 10)
					{
						dotTempList[0] = lineLedsDottedDotsList[orders[i]][orders[i + 1]];
						dotTempList[1] = lineLedsDottedDotsList[orders[i + 2]][orders[i + 3]];
						dotTempList[2] = lineLedsDottedDotsList[orders[i + 4]][orders[i + 5]];
						dotTempList[3] = lineLedsDottedDotsList[orders[i + 6]][orders[i + 7]];
						dotTempList[4] = lineLedsDottedDotsList[orders[i + 8]][orders[i + 9]];
						
						j = 0;
						lenj = dotTempList.length;
						for (; j < lenj; j++)
						{
							dotTemp = dotTempList[j];
							dotTemp.alpha = 0;
							AssukarJuggler.ME.tween(dotTemp, .05006, {alpha: 1, delay: 0.005 * i, //
								onComplete: function(target:Object):void
								{
									AssukarJuggler.ME.tween(target, .05006, {alpha: 0, delay: 0.5});
								}, //	
								onCompleteArgs: [dotTemp]});
						}
					}
					
					AssukarJuggler.ME.removeByID(playLedsDottedMovieStepDelay);
					playLedsDottedMovieStepDelay = AssukarJuggler.ME.delayCall(function():void
					{
						if (repeatCount--)
						{
							step();
						}
					}, 1.0);
				
				}
				
				step();
				
			}
			else throw new AssukarError("invalid mode: " + mode);
		
		}
		
		// small bingo movie
		private var smallBingosDelay:uint;
		
		private function playSmallBingosMovie():void
		{
			var i:uint, //
			len:uint = smallBingos.length, //
			temp:BingoTextComp;
			for (; i < len; i++)
			{
				temp = smallBingos[i];
				show(temp);
				smallBingosDelay = AssukarJuggler.ME.delayCall(function(target:Object):void
				{
					target.playMovie();
					AssukarJuggler.ME.removeTweens(target);
					AssukarJuggler.ME.tween(target, .3, {alpha: 0, delay: 1.3});
				}, (0.1 * 8) * i, temp);
			}
		}
		
		// colorful leds movies
		static private const LEDS_COLORFUL_MODE_0:uint = (1 << 0);
		static private const LEDS_COLORFUL_MODE_1:uint = (1 << 1);
		static private const LEDS_COLORFUL_ORDERS:Vector.<Vector.<uint>> = new <Vector.<uint>>[ //
		new <uint>[ //
		20, 19, 21, 18, 22, 17, 23, 16, //
		12, 11, 13, 10, 14, 9, 15, 8, //
		4, 3, 5, 2, 6, 1, 7, 0 //
		], // 
		new <uint>[ //
		16, 17, 18, 19, 20, 21, 22, 23, //
		8, 9, 10, 11, 12, 13, 14, 15, //
		0, 1, 2, 3, 4, 5, 6, 7 //
		] // 
		];
		
		private function playLedsColorfulMovie(mode:uint):void
		{
			
			var i:uint, //
			len:uint = lineLedsColorfulList.length, //
			ledTemp:Image, orders:Vector.<uint>;
			
			if (mode & LEDS_COLORFUL_MODE_0)
			{
				orders = LEDS_COLORFUL_ORDERS[0];
			}
			else if (mode & LEDS_COLORFUL_MODE_1)
			{
				orders = LEDS_COLORFUL_ORDERS[1];
			}
			else throw new AssukarError("invalid mode: " + mode);
			
			for (; i < len; i++)
			{
				ledTemp = lineLedsColorfulList[orders[i]];
				ledTemp.alpha = 0;
				AssukarJuggler.ME.tween(ledTemp, .150006, {alpha: 1, delay: 0.1 * i, //
					onComplete: function(target:Object):void
					{ //
						AssukarJuggler.ME.tween(target, .150006, {alpha: 0, delay: 0.1 * 8});
					}, //
					onCompleteArgs: [ledTemp] //
				});
			}
		}
		
		private function startProps():void
		{
			hide( //
			lineLedsDottedContainer, //
			lineLedsColorfulContainer, //
			stoneContainer, //
			smallBingos[0], smallBingos[1], smallBingos[2], //
			bigBingo //
			);
		}
	
	}

}


import starling.animation.Transitions;
import starling.display.Image;
import starling.filters.ColorMatrixFilter;
import starling.textures.Texture;
import starling.textures.TextureSmoothing;

import com.assukar.praia.menton.assets.MentonAssets;
import com.assukar.view.starling.AssukarJuggler;
import com.assukar.view.starling.Component;

// internals

// bingo 
internal class BingoTextComp extends Component
{
	
	private var isJackpot:Boolean;
	
	function BingoTextComp(isJackpot:Boolean = false)
	{
		this.isJackpot = isJackpot;
	}
	
	override public function dispose():void
	{
		
		bingoPartsContainers.length = 0;
		bingoPartsContainers = null;
		
		super.dispose();
	}
	
	private var container:Component;
	private var bingoPartsContainers:Vector.<Component>;
	
	override protected function draww():void
	{
		
		function getFilter():ColorMatrixFilter
		{
			var filter:ColorMatrixFilter = new ColorMatrixFilter("BingoTextComp");
			filter.adjustBrightness(0.5);
			return filter;
		}
		
		container = addComp(null, {scaleX: 0.5, scaleY: 0.5});
		bingoPartsContainers = new <Component>[ //
		container.addComp(null), //
		container.addComp(null) //
		];
		const bingoTextLetters:Vector.<String> =  //
		isJackpot ? new <String>["j", "a", "c", "k", "p", "o", "t", "exclamation"] : new <String>["b", "i", "n", "g", "o", "exclamation"];
		
		var text:Texture,//
		lastWidth:uint = 0,//
		xx:uint,//
		index:uint, //
		temp:Image;
		while (bingoTextLetters.length)
		{
			text = MentonAssets.ME.texture(bingoTextLetters.shift());
			xx += lastWidth;
			bingoPartsContainers[0].addImage(text, {x: xx, smoothing: TextureSmoothing.TRILINEAR});
			temp = bingoPartsContainers[1].addImage(text, {x: xx, smoothing: TextureSmoothing.TRILINEAR});
			temp.filter = getFilter(); //new FilterChain("getFilter", getFilter());
			//temp.filter.cache();
			temp.filter.dispose();
			lastWidth = text.width;
			index++;
		}
		bingoPartsContainers[0].pivotsRatio = bingoPartsContainers[1].pivotsRatio = .5;
		bingoPartsContainers[0].scaleX = bingoPartsContainers[0].scaleY = 0.8;
		
		startProps();
	
	}
	
	public function playMovie():void
	{
		
		startProps();
		
		AssukarJuggler.ME.removeTweens(bingoPartsContainers[0]);
		AssukarJuggler.ME.removeTweens(bingoPartsContainers[1]);
		
		AssukarJuggler.ME.tween(bingoPartsContainers[0], .3, {alpha: 1, scaleX: 1.0, scaleY: 1.0, transition: Transitions.EASE_IN_CUBIC, //
			onComplete: function():void
			{ //
				bingoPartsContainers[1].alpha = 1; //
				AssukarJuggler.ME.tween(bingoPartsContainers[1], .3, {alpha: 0, scaleX: 1.0, scaleY: 1.0}); //
				AssukarJuggler.ME.tween(bingoPartsContainers[0], .3, {scaleX: 0.9, scaleY: 0.9, transition: Transitions.EASE_OUT_CUBIC}); //
			} //
		});
	
	}
	
	private function startProps():void
	{
		bingoPartsContainers[0].alpha = bingoPartsContainers[1].alpha = 0;
	}

}

// big bingo
internal class BigBingoTextComp extends Component
{
	
	private var isJackpot:Boolean;
	
	function BigBingoTextComp(isJackpot:Boolean = false)
	{
		this.isJackpot = isJackpot;
	}
	
	override public function dispose():void
	{
		
		const len:uint = bingoLetters.length;
		for (var i:uint = 0; i < len; i++)
		{
			AssukarJuggler.ME.removeTweens(bingoLetters[i]);
		}
		AssukarJuggler.ME.removeByID(bumpDelay);
		AssukarJuggler.ME.removeTweens(container);
		
		bingoLetters.length = 0;
		bingoLetters = null;
		
		originalPosX.length = 0;
		originalPosX = null;
		
		super.dispose();
	}
	
	private var container:Component;
	private var bingoLetters:Vector.<Image>;
	private var originalPosX:Vector.<uint>;
	
	override protected function draww():void
	{
		
		container = addComp(null);
		bingoLetters = new <Image>[];
		originalPosX = new <uint>[];
		const bingoTextLetters:Vector.<String> =  //
		isJackpot ? new <String>["j", "a", "c", "k", "p", "o", "t", "exclamation"] : new <String>["b", "i", "n", "g", "o", "exclamation"];
		
		var index:uint, //
		lastWidth:uint = 0,//
		xx:uint = 0,//
		temp:Image;
		while (bingoTextLetters.length)
		{
			xx += lastWidth;
			originalPosX[index] = xx;
			temp = bingoLetters[index] = container.addImage(MentonAssets.ME.texture(bingoTextLetters.shift()), {x: xx});
			lastWidth = temp.width;
			index++;
		}
		
		container.pivotsRatio = 0.5;
		
		startProps();
	
	}
	
	private var bumpDelay:uint;
	
	public function playMovie():void
	{
		
		startProps();
		
		var i:uint = 0, //
		len:uint = bingoLetters.length, //
		temp:Image, //
		delay:Number;
		for (; i < len; i++)
		{
			delay = 0.2 * i;
			temp = bingoLetters[i];
			AssukarJuggler.ME.removeTweens(temp);
			AssukarJuggler.ME.tween(temp, .500006, {x: originalPosX[i], delay: 0.2 * i, transition: Transitions.EASE_OUT_BACK});
		}
		AssukarJuggler.ME.removeByID(bumpDelay);
		bumpDelay = AssukarJuggler.ME.delayCall(function():void
		{
			
			AssukarJuggler.ME.removeTweens(container);
			
			var repeatCount:uint = 4;
			function step():void
			{
				AssukarJuggler.ME.tween(container, .3, {scaleX: 1.02, scaleY: 1.02, //
					onComplete: function():void
					{
						AssukarJuggler.ME.tween(container, .3, {scaleX: 0.97, scaleY: 0.97, //
							onComplete: (repeatCount--) ? step : null //
						});
					} // 
				});
			}
			step();
		
		}, 0.3 + delay);
	
	}
	
	private function startProps():void
	{
		var i:uint = 0, //
		len:uint = bingoLetters.length;
		for (; i < len; i++)
		{
			bingoLetters[i].x = 768;
		}
	}
}

