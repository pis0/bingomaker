package com.assukar.praia.menton.components.cards
{
	import starling.display.Image;
	import starling.display.Quad;
	import starling.events.Event;
	import com.assukar.view.starling.AssukarTextField;
	import starling.utils.Color;

	import com.assukar.airong.error.AssukarError;
	import com.assukar.praia.menton.components.particles.MentonParticle;
	import com.assukar.praia.menton.components.particles.ParticlesLayer;
	import com.assukar.praia.menton.domain.Pattern;
	import com.assukar.view.starling.AssukarMovieClip;
	import com.assukar.view.starling.Component;

	import flash.geom.Point;
	
	public class Slot extends Component
	{
		// class consts
		static public var missingMotion:MissingTextMotion;
		public var mark:Quad;
		public var number:AssukarTextField;
		public var patternMark:Quad;
		public var bgDefault:Quad;
		public var missingMark:MissingMarkMovie;
		public var initTextY:int;
		public var bellState:Image;
		public var markAnima:AssukarMovieClip;
		
		private var numberIndex:int;
		private var patternMarkIndex:int;
		
		//public function saveParent(cardd: Cardd, p: Pattern) : void
		public function saveParent(container:Component, p:Pattern):void
		{
			patternMarkIndex = patternMark.parent.getChildIndex(patternMark.parent);
			numberIndex = number.parent.getChildIndex(number.parent);
			container.addChild(patternMark);
			container.addChild(number);
			
			transitionCount = 0;
			container.addEventListener(Event.ENTER_FRAME, enterFrame);
			patternMark.color = NEW_PATTERN_MATCH_STARTING_COLOR;
			number.color = Cardd.MARKED_NUMBER_COLOR_TRANSITION;
			
			colorVec = NEW_PATTERN_MATCH_FINISH_COLORS_BY_PATTERN_PRIORITY[p.group.priority];
			transitionLength = 20;
			colorVecIx = 0;
			c1 = NEW_PATTERN_MATCH_STARTING_COLOR;
			c2 = colorVec[colorVecIx];
			state = 0;
		}
		
		private var transitionCount:int = 0;
		private var transitionLength:int;
		private var colorVec:Vector.<uint>;
		private var colorVecIx:int = 0;
		static private var NEW_PATTERN_MATCH_STARTING_COLOR:uint = 0x000000;
		static public const NEW_PATTERN_MATCH_FINISH_COLORS_BY_PATTERN_PRIORITY:Vector.<Vector.<uint>> = new <Vector.<uint>>[ //
		null, new <uint>[0x00ff00, 0x44aa44], // 1
		new <uint>[0x0066ff, 0xff77ff, 0x55aaff], // 2
		new <uint>[0x0066ff, 0xff77ff, 0x55aaff], // 3
		new <uint>[0xff00ff, 0xffbb00, 0xff0066, 0x6600ff], // 4
		new <uint>[0xff00ff, 0xffbb00, 0xff0066, 0x6600ff], // 5
		new <uint>[0xff00ff, 0xffbb00, 0xff0066, 0x6600ff], // 6
		new <uint>[0xffff33, 0xffaa00, 0xff6622, 0xff0066, 0xffffaa, 0x6600ff, 0xffff33], // 7
		new <uint>[0xffff33, 0xffaa00, 0xff6622, 0xff0066, 0xffffaa, 0x6600ff, 0xffff33], // 8
		new <uint>[0xff3333, 0xffff33, 0xff0000, 0xffff33, 0xff5500, 0xffff33, 0xff0055], // 9
		];
		private var c1:uint, c2:uint;
		private var state:int;
		
		private function enterFrame(e:Event):void
		{
			transitionCount++;
			
			if (state == 0)
			{
				if (transitionCount == transitionLength)
				{
					transitionCount = 0;
					c1 = colorVec[colorVecIx];
					if (colorVecIx + 1 < colorVec.length) c2 = colorVec[colorVecIx + 1];
					else c2 = colorVec[0];
					colorVecIx = (colorVecIx + 1) % colorVec.length;
				}
				
				patternMark.color = Color.rgb((Color.getRed(c1) * (transitionLength - transitionCount) + Color.getRed(c2) * (transitionCount)) / transitionLength, (Color.getGreen(c1) * (transitionLength - transitionCount) + Color.getGreen(c2) * (transitionCount)) / transitionLength, (Color.getBlue(c1) * (transitionLength - transitionCount) + Color.getBlue(c2) * (transitionCount)) / transitionLength);
			}
			else if (state == 1)
			{
				if (transitionCount < 10)
				{
					//Utils.wraplog("index " + MentonEngine.ME.newRound.stakeIndex);
					
					var cc:uint = Cardd.MARKED_BGS_BY_STAKE_INDEX[0];//MentonEngine.ME.newRound.stakeIndex
					patternMark.color = Color.rgb((Color.getRed(c1) * (10 - transitionCount) + Color.getRed(cc) * (transitionCount)) / 10, (Color.getGreen(c1) * (10 - transitionCount) + Color.getGreen(cc) * (transitionCount)) / 10, (Color.getBlue(c1) * (10 - transitionCount) + Color.getBlue(cc) * (transitionCount)) / 10);
				}
				
			}
			else
			{
				throw new AssukarError();
			}
		}
		
		public function prepareRestore():void
		{
			state = 1;
			transitionCount = 0;
			c1 = patternMark.color;
		}
		
		public function restoreParent(cardd:Cardd):void
		{
			cardd.removeEventListener(Event.ENTER_FRAME, enterFrame);
			
			if (patternMarkIndex > -1) cardd.markedComp.addChildAt(patternMark, patternMarkIndex);
			else cardd.markedComp.addChild(patternMark);
			if (numberIndex > -1) cardd.numberComp.addChildAt(number, numberIndex);
			else cardd.numberComp.addChild(number);
			
			patternMark.color = Cardd.MARKED_BGS_BY_STAKE_INDEX[1];
			number.color = Cardd.MARKED_FONT_COLOR_BY_STAKE_INDEX[1];
		}
		
		function Slot():void
		{
			if (!missingMotion)
			{
				missingMotion = MissingTextMotion(new MissingTextMotion().draw());
			}
		}
		
		override public function dispose():void
		{
			stopParticle();
			paticleWasStarted = false;
			super.dispose();
			if (missingMotion)
			{
				missingMotion.dispose();
				missingMotion = null;
			}
		}
		
		private var missingOneParticle:MentonParticle;
		private var paticleWasStarted:Boolean;
		
		public function startParticle():void
		{
			if (!paticleWasStarted)
			{
				var p:Point = number.localToGlobal(new Point(0, 0));
				missingOneParticle = new MentonParticle("missingOne", ParticlesLayer.ME, p.x + 30, p.y + 30);
				missingOneParticle.start(.2);
				missingOneParticle.particle.speed = 70;
				paticleWasStarted = true;
			}
		}
		
		public function stopParticle():void
		{
			if (missingOneParticle)
			{
				missingOneParticle.stop();
			}
		}
		
		public function fixMarked():void 
		{
			patternMark.color = Cardd.MARKED_BGS_BY_STAKE_INDEX[1];
			number.color = Cardd.MARKED_FONT_COLOR_BY_STAKE_INDEX[2];
		}
		
		override protected function draww():void
		{
			
		}
	}
}