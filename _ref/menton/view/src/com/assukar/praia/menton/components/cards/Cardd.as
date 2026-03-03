package com.assukar.praia.menton.components.cards
{
	import com.assukar.airong.ds.Cursor;
	import com.assukar.airong.ds.LinkedList;
	import com.assukar.airong.ds.NumberLinkedList;
	import com.assukar.airong.error.AssukarError;
	import com.assukar.praia.assets.Fonts;
	import com.assukar.praia.domain.gameevents.PraiaGameEvents;
	import com.assukar.praia.menton.assets.MentonAssets;
	import com.assukar.praia.menton.components.MotionConstants;
	import com.assukar.praia.menton.components.bellPanel.BellPanel;
	import com.assukar.praia.menton.components.buttons.ButtonPanel;
	import com.assukar.praia.menton.components.cards.movies.ColumnPattern;
	import com.assukar.praia.menton.components.cards.movies.LinePattern;
	import com.assukar.praia.menton.components.cards.movies.MoviePattern;
	import com.assukar.praia.menton.controllers.BallController;
	import com.assukar.praia.menton.controllers.ButtonsController;
	import com.assukar.praia.menton.domain.Card;
	import com.assukar.praia.menton.domain.CardMatches;
	import com.assukar.praia.menton.domain.MentonJackpotSession;
	import com.assukar.praia.menton.domain.MissingPatternsHolder;
	import com.assukar.praia.menton.domain.Pattern;
	import com.assukar.praia.menton.domain.PatternGroup;
	import com.assukar.praia.menton.domain.SlotPosition;
	import com.assukar.praia.menton.main.MentonEngine;
import com.assukar.praia.services.navigation.WebScreens;
import com.assukar.view.starling.Component;
	import com.assukar.view.starling.StarlingUtils;
	import com.assukar.view.starling.UberTouchableComponent;
	import flash.geom.Point;
	import flash.ui.Keyboard;

	
	public class Cardd extends UberTouchableComponent
	{
		// class consts
		static public const SLOT_WIDTH:int = 58;
		static public const SLOT_HEIGHT:int = 40;
		static private const X_O:int = 16;
		static private const Y_O:int = 33;
		static public var SCALE:Number = 1;
		
		static public const MARKED_BGS_BY_STAKE_INDEX:Vector.<uint> = new <uint>[0x5b1f72, 0x2f113d]; // 0x5b1f72 //0x600770
		static public const MARKED_FONT_COLOR_BY_STAKE_INDEX:Vector.<uint> = new <uint>[0x993ebc, 0x4a1d5d, 0x5b1f72]; //0x932fa7;//0x742e8f
		
		static internal var MARKED_NUMBER_COLOR_TRANSITION:uint = 0x000000;
		static private const DEFAULT_BG_COLORS_BY_STAKE_INDEX:Vector.<uint> = new <uint>[0xffffff];//0xe6f8e1
		static private const DEFAULT_NUMBER_COLOR:uint = 0x332d11;
		
		static private const MARKED_PRIZE_BG_BY_STAKE_INDEX:Vector.<uint> = new <uint>[0x5b1f72]; //0x5b1f72
		static private const MARKED_NUMBER_COLORS_BY_STAKE_INDEX:Vector.<uint> = new <uint>[0x852f96];// 0x993ebc//0x742e8f //0x600770// 0x3d0049
		
		public function Cardd(index:int)
		{
			this.index = index;
		}
		
		private var shaker:CardShaker;
		
		override public function dispose():void
		{
			if (slotComp) slotComp.dispose();
			shaker.dispose();
			super.dispose();
			setMarkDelayedCalls.clear();
		}
		
		// object vars
		public var benchmarkState:int = 0;
		public var index:int;
		private var slotComp:Component;
		internal var markedComp:Component;
		private var markComp:Component;
		private var missingComp:Component;
		internal var numberComp:Component;
		
		private var slots:Vector.<Vector.<Slot>> = new Vector.<Vector.<Slot>>(3);
//		private var yellow:Component;
//		private var blue:Component;
//		private var purple:Component;
//		private var green:Component;
//		private var gray:Component;
		
		private var missingBackground:MissingBackground;
		
		private var titleContainer:Component;
		private var bgContainer:Component;
		//private var fullMoviePattern:JackpotMovie;
		//private var doubleLinePatterns:Vector.<DoubleLinePattern> = new <DoubleLinePattern>[null, null, null];
		internal var initPos:Point;
		
		private var particleHolder:Component;
		
		private var fruitBonus:FruitBonus;
		
		private var topSlotContainer:Component;
		private var movieCardContainer:Component;
		
		override protected function draww():void
		{
			bgContainer = addComp(Component, {x: 10, y: 9});
			bgContainer.addImage(MentonAssets.ME.texture("card"));
			
			slotComp = new Component();
			markComp = addComp(Component);
			markedComp = addComp(Component);
			numberComp = addComp(Component);
			
			titleContainer = addComp(Component, {x: 10, y: 9});
            titleContainer.addImage(MentonAssets.ME.texture("cardbet1"));
            titleContainer.addImage(MentonAssets.ME.texture("cardbet2"));
            titleContainer.addImage(MentonAssets.ME.texture("cardbet3"));
            titleContainer.addImage(MentonAssets.ME.texture("cardbet4"));
            titleContainer.addImage(MentonAssets.ME.texture("cardbet5"));
            titleContainer.addImage(MentonAssets.ME.texture("cardbet6"));
            titleContainer.addImage(MentonAssets.ME.texture("cardbet7"));
            titleContainer.addImage(MentonAssets.ME.texture("cardbet8"));

			
//			yellow = titleContainer.addComp();
//			blue = titleContainer.addComp();
//			purple = titleContainer.addComp();
//			green = titleContainer.addComp();
//			gray = titleContainer.addComp();
//
//			green.addImage(MentonAssets.ME.texture("cardbet1"));
//			yellow.addImage(MentonAssets.ME.texture("cardbet2"));
//			purple.addImage(MentonAssets.ME.texture("cardbet3"));
//			gray.addImage(MentonAssets.ME.texture("cardbet4"));
//			blue.addImage(MentonAssets.ME.texture("cardbet5"));
			
			missingBackground = addComp(MissingBackground);
			
			missingComp = addComp(Component);
			
			particleHolder = addComp();
			
			var widthNumber:int = 65;
			var heightNumber:int = 46;
			var pos:Point = new Point();
			
			for (var i:int = 0; i < 3; i++)
			{
				slots[i] = new Vector.<Slot>(5);
				for (var j:int = 0; j < 5; j++)
				{
					var slot:Slot = new Slot();
					slots[i][j] = slot;
					slotComp.addComp(slot);
					
					pos.setTo(X_O + j * widthNumber, Y_O + i * heightNumber);
					//					jackpotMovie.maskara.addQuad(SLOT_WIDTH, SLOT_HEIGHT, 0x00FFFF, {x:pos.x, y:pos.y});
					slot.bgDefault = markComp.addQuad(SLOT_WIDTH, SLOT_HEIGHT, DEFAULT_BG_COLORS_BY_STAKE_INDEX[0], {x: pos.x, y: pos.y});
					slot.patternMark = markedComp.addQuad(SLOT_WIDTH, SLOT_HEIGHT, MARKED_BGS_BY_STAKE_INDEX[0], {x: pos.x, y: pos.y});
					
					slot.missingMark = missingComp.addCompAt(0, MissingMarkMovie, {x: pos.x, y: pos.y});
					slot.bellState = markComp.addImage(MentonAssets.ME.texture("cardbell4"), {x: pos.x + 10, y: pos.y + 3, visible: false});
					
					slot.number = numberComp.addText(SLOT_WIDTH + 4, SLOT_HEIGHT + 4, "", Fonts.IOWAN_OLD_STYLE_BLACK_43, {color: DEFAULT_NUMBER_COLOR, fontSize: 43, 
						//fontSize:BitmapFont.NATIVE_SIZE, 
						centerPivots: true});//fontSize: 36,					 					 
					slot.number.x = int(pos.x + slot.number.pivotX - 2);
					slot.number.y = int(pos.y + slot.number.pivotY - 2);
					
					//AssukarTextField(slot.number).letterSpacing = -1;
					StarlingUtils.setText(slot.number, slot.number.text, -1);
					
					slot.initTextY = slot.number.y;
					
					slot.mark = markComp.addQuad(SLOT_WIDTH, SLOT_HEIGHT, 0x666666, {x: pos.x, y: pos.y});
					slot.markAnima = markComp.addMovie(MentonAssets.ME.textures("marking"), {x: pos.x, y: pos.y, visible: false});
					slot.markAnima.scaleX = 1.02;
					slot.markAnima.scaleY = 1.02;
					slot.markAnima.fps = 30;
					
				}
			}
			
			topChild(missingBackground);
			topChild(missingComp);
			
			//			flattenSlots();
			
			shaker = new CardShaker(this);
			
			topSlotContainer = addComp();
			
			movieCardContainer = addComp(Component, {touchable: false});
			
			fruitBonus = addComp(FruitBonus, {x: 170, y: 150});
			
			activateCards();
			
			if (index==0) assignKeys([Keyboard.RIGHT]);
		
		}
		
		public function fruitBonusFire(sp:SlotPosition, callback:Function):void
		{
			fruitBonus.fire( //
			fruitBonus.randomFruit(), //			
			new Point(sp.line, sp.column), //			
			function():void
			{
				cardShake();
//				delayCall("fruitBonusFireCardShakeDelay", juggler.delayCall(callback, 0.5));
				delayCall2(callback, 0.5);

			} //
			);
		}
		
		private function flattenSlots(mark:Boolean = true, marked:Boolean = true, numbers:Boolean = true):void
		{
			if (mark) markComp.flatten();
			if (marked) markedComp.flatten();
			if (numbers) numberComp.flatten();
		}
		
		public function setInitPos():void
		{
			initPos = new Point(this.x, this.y);
		}
		
		public function setTitleColor(stakeIndex:int):void
		{
			var i:int;
			for (i = 0; i < 3; i++)
			{
				for (var j:int = 0; j < 5; j++)
				{
					//					var slot : Slot = slots[i][j];
					slots[i][j].bgDefault.color = DEFAULT_BG_COLORS_BY_STAKE_INDEX[0];
				}
			}
			
			for (i = 0; i < titleContainer.numChildren; ++i)
				hide(titleContainer.getChildAt(i));
            show(titleContainer.getChildAt(stakeIndex));

//			switch (color)
//			{
//			case ButtonPanel.STAKE_COLORS[0]:
//				show(green);//greenBG
//				break;
//			case ButtonPanel.STAKE_COLORS[1]:
//				show(yellow);//yellowBG
//				break;
//			case ButtonPanel.STAKE_COLORS[2]:
//				show(purple);//purpleBG
//				break;
//			case ButtonPanel.STAKE_COLORS[3]:
//				show(gray);//blueBG
//				break;
//			case ButtonPanel.STAKE_COLORS[4]:
//				show(blue);//redBG
//				break;
//			default: // do nothing
//                show(blue);
//					break;
//			}
		}
		
		public function clear():void
		{
			for (var i:int = 0; i < 90; i++)
			{
				if (delayBlinks[i])
				{
					juggler.removeByID(delayBlinks[i]);
					delayBlinks[i] = null;
				}
			}
			missingBackground.clear();
			//			juggler.removeTweens(this);
			
			//cleanDoubleLinePattern();
			//cleanJackpotPattern();
			missingOnePatternss = null;
			holdingMissingBalls.clear();
			activateCards();
			stopCardAnimations();
			//			flattenSlots();
			
			fruitBonus.reset();
		}
		
		public function getSlotByNumber(number:int):Slot
		{
			var aSlot:Slot;
			
			for (var i:int = 0; i < 3; i++)
			{
				for (var j:int = 0; j < 5; j++)
				{
					if (int(slots[i][j].number.text) == number) aSlot = slots[i][j];
				}
			}
			
			return aSlot;
		}
		
		public function getAllSlots():Vector.<Vector.<Slot>>
		{
			return slots;
		}
		
		private function activateCards():void
		{
			killDelays();
			
			for (var i:int = 0; i < 3; i++)
			{
				for (var j:int = 0; j < 5; j++)
				{
					var slot:Slot = slots[i][j];
					var cardd:Cardd = this;
					
					slot.prepareRestore();
					slot.restoreParent(cardd);
					
					slot.number.visible = true;
					slot.markAnima.stop();
					slot.missingMark.clear();
					hide(slot.patternMark, slot.missingMark, slot.mark, slot.markAnima);
					slot.stopParticle();
					slot.number.color = DEFAULT_NUMBER_COLOR;
					slot.number.fontName = Fonts.IOWAN_OLD_STYLE_BLACK_43;
					slot.number.fontSize = 43;
					//slot.number.fontSize = BitmapFont.NATIVE_SIZE;
					slot.mark.alpha = 1;
					slot.number.alpha = 1;
					slot.number.y = slot.initTextY;
					show(slot.bgDefault);
				}
			}
			
			enable();
			flattenSlots();
		}
		
		public function setNumbers(numbers:NumberLinkedList):void
		{
			var c:Cursor = numbers.cursor;
			var i:int = 0;
			while (c.next)
			{
				var line:int = int(i % 3);
				var column:int = int(i / 3);
				
				var number:int = c.current;
				
				slots[line][column].number.text = String(number);
				
				i++;
			}
			
			flattenSlots(false, false, true);
		}
		
		private function setMark(i:int, j:int, shouldBlinkMatch:Boolean, intervalMark:Boolean = false):void
		{
			var slot:Slot = slots[i][j];
			slot.bgDefault.visible = false;
			slot.mark.visible = true;
			slot.number.color = MARKED_NUMBER_COLORS_BY_STAKE_INDEX[0];
			slot.mark.color = MARKED_PRIZE_BG_BY_STAKE_INDEX[0];
			if (slot.bellState.visible && MentonEngine.ME.round && !MentonEngine.ME.round.roundEnded && !intervalMark) BellPanel.ME.openPiece();
			if (shouldBlinkMatch) blinkMarkExtra(slot);
			if (setMarkDelayedCalls.size > 0) setMarkDelayedCalls.removeFirst();
		}
		
		private var delayBlinks:Vector.<uint> = new Vector.<uint>(90);
		
		private function blinkMarkExtra(slot:Slot, transitionIndex:int = 0):void
		{
			if (MentonEngine.ME.round && MentonEngine.ME.round.roundEnded) return;
			
			var slotIndex:int = int(slot.number.text) - 1;
			if (transitionIndex + 1 < 3)
			{
				if (delayBlinks[slotIndex] && !delayBlinks[slotIndex].isComplete)
				{
//					juggler.delayCall(blinkMarkExtra, 0.1, slot, transitionIndex);
					delayCall2(blinkMarkExtra, 0.1, slot, transitionIndex);
					return;
				}
			}
			
			if (transitionIndex % 3 == 0)
			{
				slot.number.color = MARKED_NUMBER_COLOR_TRANSITION;
				hide(slot.mark);
				show(slot.bgDefault);
			}
			else
			{
				slot.number.color = MARKED_NUMBER_COLORS_BY_STAKE_INDEX[0];//MentonEngine.ME.newRound.stakeIndex
				show(slot.mark);
				hide(slot.bgDefault);
			}
			
			transitionIndex++;
			
			flattenSlots();
			
			if (transitionIndex == 1)
			{
				showHoldingMissingBallsIntern();
			}
			if (transitionIndex < 3)
			{
				if (delayBlinks[slotIndex])
				{
					if (!delayBlinks[slotIndex].isComplete)
					{
//						juggler.delayCall(blinkMarkExtra, 0.1, slot, transitionIndex - 1);
						delayCall2(blinkMarkExtra, 0.1, slot, transitionIndex - 1);
						return;
					}
					
					juggler.removeByID(delayBlinks[slotIndex]);
					delayBlinks[slotIndex] = null;
				}

//				delayBlinks[slotIndex] = juggler.delayCall(blinkMarkExtra, 0.1, slot, transitionIndex);
				delayBlinks[slotIndex] = delayCall2(blinkMarkExtra, 0.1, slot, transitionIndex);
			}
		}
		
		private function setNewPatternMark(i:int, j:int, p:Pattern):void
		{
			var slot:Slot = slots[i][j];
			hide(slot.mark, slot.missingMark);
			Slot.missingMotion.removeSlot(slot);
			show(slot.patternMark);
			slot.number.color = MARKED_NUMBER_COLORS_BY_STAKE_INDEX[0];
			
			slot.saveParent(topSlotContainer, p);
		}
		
		private var c1:Cursor;
		
		private var frozen:Boolean = false;
		
		private function hideMissingPatterns():void
		{
			for (var i:int = 0; i < 3; i++)
			{
				for (var j:int = 0; j < 5; j++)
				{
					slots[i][j].missingMark.freeze(i, j);
				}
			}
			frozen = true;
		}
		
		private function showMissingPatterns():void
		{
			frozen = false;
			for (var i:int = 0; i < 3; i++)
			{
				for (var j:int = 0; j < 5; j++)
				{
					slots[i][j].missingMark.unfreeze(i, j);
				}
			}
			showHoldingMissingBallsIntern();
		}
		
		public function propagateNewPatternMark(newPatterns:LinkedList, bestPattern:Pattern):void
		{
			hideMissingPatterns();
			
			var p:Pattern;
			c1 = newPatterns.cursor;
			while (c1.next)
			{
				p = c1.current as Pattern;
				
				// last param false added on 2016-02-02
//                delayCall("propagatePattern" + p.id, juggler.delayCall(propagatePattern, MotionConstants.PATTERN_PROPAGATE_COLUMN_DELAY, 0, p, bestPattern == p), false);
                delayCall2(propagatePattern, MotionConstants.PATTERN_PROPAGATE_COLUMN_DELAY, 0, p, bestPattern == p);

				var shakeType:int = 0;
				switch (p.group)
				{
				case PatternGroup.DOUBLE_LINE: 
					shakeType = 3;
					break;
				}
				if (shakeType) shaker.shake(shakeType);
			}
		}
		
		private function propagatePattern(column:int, p:Pattern, bestPattern:Boolean):void
		{
			if (bestPattern)
			{
				var line1:int;
				for (line1 = 0; line1 < 3; line1++)
				{
					if (p.match(line1, column)) setNewPatternMark(line1, column, p);
				}
			}
			
			if (column < 4)
			{
				// last param false added on 2016-02-02
//				delayCall2("propagatePattern" + p.id, juggler.delayCall(propagatePattern, MotionConstants.PATTERN_PROPAGATE_COLUMN_DELAY, column + 1, p, bestPattern), false);
				delayCall2(propagatePattern, MotionConstants.PATTERN_PROPAGATE_COLUMN_DELAY, column + 1, p, bestPattern);
			}
			else
			{
				if (bestPattern)
				{
					delay(function():void
					{
						for (var i:int = 2; i >= 0; i--)
						{
							for (var j:int = 4; j >= 0; j--)
							{
								if (p.match(i, j))
								{
									var slot:Slot = slots[i][j];
									slot.prepareRestore();
								}
							}
						}
					}, MotionConstants.PATTERN_PROPAGATE_CALLBACKS_BY_PATTERN_PRIORITY[p.group.priority] - 0.3);
				}
				
				var cardd:Cardd = this;
				
				if (bestPattern)
				{
					patternAnimation(p);
					delayCall2(function():void
					{
						for (var i:int = 2; i >= 0; i--)
						{
							for (var j:int = 4; j >= 0; j--)
							{
								if (p.match(i, j))
								{
									var slot:Slot = slots[i][j];
									slot.restoreParent(cardd);
									slot.fixMarked();
								}
							}
						}
						showMissingPatterns();
						flattenSlots();
						//patternAnimation(p);
					}, MotionConstants.PATTERN_PROPAGATE_CALLBACKS_BY_PATTERN_PRIORITY[p.group.priority] + 0.2);
				}
				
//				PraiaGameEvents.MENTON_PRIZE.dispatch(p.group.id);
				PraiaGameEvents.MENTON_PATTERN.dispatch(p.group.id, MentonEngine.ME.round, _card.index).securedRelay(WebScreens.ME.gameEventRelay, {
					pattern: p.group.id
				})
			}
			
			if (bestPattern) flattenSlots(false, true, true);
		}
		
		private function patternAnimation(p:Pattern):void
		{
			switch (p)
			{
			case Pattern.LINE_1: 
				var line1:LinePattern = movieCardContainer.addObject(new LinePattern().draw(), {x: X_O - 2, y: Y_O});
				line1.startAnimation(completeAnimationCard);
				break;
			case Pattern.LINE_2: 
				var line2:LinePattern = movieCardContainer.addObject(new LinePattern().draw(), {x: X_O - 2, y: Y_O + 46});
				line2.startAnimation(completeAnimationCard);
				break;
			case Pattern.LINE_3: 
				var line3:LinePattern = movieCardContainer.addObject(new LinePattern().draw(), {x: X_O - 2, y: Y_O + 92});
				line3.startAnimation(completeAnimationCard);
				break;
			
			case Pattern.DOUBLE_LINE_1: 
				var dl1Line2:LinePattern = movieCardContainer.addObject(new LinePattern().draw(), {x: X_O - 2, y: Y_O + 46});
				dl1Line2.startAnimation(completeAnimationCard, true);
				var dl1Line1:LinePattern = movieCardContainer.addObject(new LinePattern().draw(), {x: X_O - 2, y: Y_O});
				dl1Line1.startAnimation(completeAnimationCard, true);
				break;
			case Pattern.DOUBLE_LINE_2: 
				var dl2Line2:LinePattern = movieCardContainer.addObject(new LinePattern().draw(), {x: X_O - 2, y: Y_O + 92});
				dl2Line2.startAnimation(completeAnimationCard, true);
				var dl2Line1:LinePattern = movieCardContainer.addObject(new LinePattern().draw(), {x: X_O - 2, y: Y_O});
				dl2Line1.startAnimation(completeAnimationCard, true);
				break;
			case Pattern.DOUBLE_LINE_3: 
				var dl3Line2:LinePattern = movieCardContainer.addObject(new LinePattern().draw(), {x: X_O - 2, y: Y_O + 92});
				dl3Line2.startAnimation(completeAnimationCard, true);
				var dl3Line1:LinePattern = movieCardContainer.addObject(new LinePattern().draw(), {x: X_O - 2, y: Y_O + 46});
				dl3Line1.startAnimation(completeAnimationCard, true);
				break;
			
			case Pattern.DOUBLE_COLUMN_1: 
				var dc1c1:ColumnPattern = movieCardContainer.addObject(new ColumnPattern().draw(), {x: X_O, y: Y_O});
				dc1c1.startAnimation(completeAnimationCard);
				var dc1c2:ColumnPattern = movieCardContainer.addObject(new ColumnPattern().draw(), {x: X_O + 65, y: Y_O});
				dc1c2.startAnimation(completeAnimationCard, false, true);
				break;
			case Pattern.DOUBLE_COLUMN_2: 
				var dc2c1:ColumnPattern = movieCardContainer.addObject(new ColumnPattern().draw(), {x: X_O + 65, y: Y_O});
				dc2c1.startAnimation(completeAnimationCard);
				var dc2c2:ColumnPattern = movieCardContainer.addObject(new ColumnPattern().draw(), {x: X_O + 130, y: Y_O});
				dc2c2.startAnimation(completeAnimationCard, false, true);
				break;
			case Pattern.DOUBLE_COLUMN_3: 
				var dc3c1:ColumnPattern = movieCardContainer.addObject(new ColumnPattern().draw(), {x: X_O + 130, y: Y_O});
				dc3c1.startAnimation(completeAnimationCard);
				var dc3c2:ColumnPattern = movieCardContainer.addObject(new ColumnPattern().draw(), {x: X_O + 195, y: Y_O});
				dc3c2.startAnimation(completeAnimationCard, false, true);
				break;
			case Pattern.DOUBLE_COLUMN_4: 
				var dc4c1:ColumnPattern = movieCardContainer.addObject(new ColumnPattern().draw(), {x: X_O + 195, y: Y_O});
				dc4c1.startAnimation(completeAnimationCard);
				var dc4c2:ColumnPattern = movieCardContainer.addObject(new ColumnPattern().draw(), {x: X_O + 260, y: Y_O});
				dc4c2.startAnimation(completeAnimationCard, false, true);
				break;
			
			case Pattern.TRIPLE_COLUMN_1: 
				var tc1c3:ColumnPattern = movieCardContainer.addObject(new ColumnPattern().draw(), {x: X_O + 130, y: Y_O});
				tc1c3.startAnimation(completeAnimationCard, true);
				var tc1c2:ColumnPattern = movieCardContainer.addObject(new ColumnPattern().draw(), {x: X_O + 65, y: Y_O});
				tc1c2.startAnimation(completeAnimationCard, true, true);
				var tc1c1:ColumnPattern = movieCardContainer.addObject(new ColumnPattern().draw(), {x: X_O, y: Y_O});
				tc1c1.startAnimation(completeAnimationCard, true);
				break;
			case Pattern.TRIPLE_COLUMN_2: 
				var tc2c3:ColumnPattern = movieCardContainer.addObject(new ColumnPattern().draw(), {x: X_O + 195, y: Y_O});
				tc2c3.startAnimation(completeAnimationCard, true);
				var tc2c2:ColumnPattern = movieCardContainer.addObject(new ColumnPattern().draw(), {x: X_O + 130, y: Y_O});
				tc2c2.startAnimation(completeAnimationCard, true, true);
				var tc2c1:ColumnPattern = movieCardContainer.addObject(new ColumnPattern().draw(), {x: X_O + 65, y: Y_O});
				tc2c1.startAnimation(completeAnimationCard, true);
				break;
			case Pattern.TRIPLE_COLUMN_3: 
				var tc3c3:ColumnPattern = movieCardContainer.addObject(new ColumnPattern().draw(), {x: X_O + 260, y: Y_O});
				tc3c3.startAnimation(completeAnimationCard, true);
				var tc3c2:ColumnPattern = movieCardContainer.addObject(new ColumnPattern().draw(), {x: X_O + 195, y: Y_O});
				tc3c2.startAnimation(completeAnimationCard, true, true);
				var tc3c1:ColumnPattern = movieCardContainer.addObject(new ColumnPattern().draw(), {x: X_O + 130, y: Y_O});
				tc3c1.startAnimation(completeAnimationCard, true);
				break;
			
			case Pattern.QUAD_COLUMN_1: 
				var qc1c4:ColumnPattern = movieCardContainer.addObject(new ColumnPattern().draw(), {x: X_O + 195, y: Y_O});
				qc1c4.startAnimation(completeAnimationCard, true);
				var qc1c3:ColumnPattern = movieCardContainer.addObject(new ColumnPattern().draw(), {x: X_O + 130, y: Y_O});
				qc1c3.startAnimation(completeAnimationCard, true, true);
				var qc1c2:ColumnPattern = movieCardContainer.addObject(new ColumnPattern().draw(), {x: X_O + 65, y: Y_O});
				qc1c2.startAnimation(completeAnimationCard, true);
				var qc1c1:ColumnPattern = movieCardContainer.addObject(new ColumnPattern().draw(), {x: X_O, y: Y_O});
				qc1c1.startAnimation(completeAnimationCard, true, true);
				break;
			case Pattern.QUAD_COLUMN_2: 
				var qc2c4:ColumnPattern = movieCardContainer.addObject(new ColumnPattern().draw(), {x: X_O + 260, y: Y_O});
				qc2c4.startAnimation(completeAnimationCard, true);
				var qc2c3:ColumnPattern = movieCardContainer.addObject(new ColumnPattern().draw(), {x: X_O + 195, y: Y_O});
				qc2c3.startAnimation(completeAnimationCard, true, true);
				var qc2c2:ColumnPattern = movieCardContainer.addObject(new ColumnPattern().draw(), {x: X_O + 130, y: Y_O});
				qc2c2.startAnimation(completeAnimationCard, true);
				var qc2c1:ColumnPattern = movieCardContainer.addObject(new ColumnPattern().draw(), {x: X_O + 65, y: Y_O});
				qc2c1.startAnimation(completeAnimationCard, true, true);
				break;
			
			case Pattern.QUAD_COLUMN_3: //CAIXA DUPLA
				var qc3c4:ColumnPattern = movieCardContainer.addObject(new ColumnPattern().draw(), {x: X_O + 260, y: Y_O});
				qc3c4.startAnimation(completeAnimationCard, true);
				var qc3c3:ColumnPattern = movieCardContainer.addObject(new ColumnPattern().draw(), {x: X_O + 195, y: Y_O});
				qc3c3.startAnimation(completeAnimationCard, true, true);
				var qc3c2:ColumnPattern = movieCardContainer.addObject(new ColumnPattern().draw(), {x: X_O + 65, y: Y_O});
				qc3c2.startAnimation(completeAnimationCard, true);
				var qc3c1:ColumnPattern = movieCardContainer.addObject(new ColumnPattern().draw(), {x: X_O, y: Y_O});
				qc3c1.startAnimation(completeAnimationCard, true, true);
				break;
			
			case Pattern.FULL: 
				CardPanel.ME.animaBingo(index);
				break;
			}
			
			switch (p)
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
				if (ButtonsController.ME.getState() == ButtonsController.HALT)
					ButtonsController.ME.setState(ButtonsController.HALT, false);
				break;
			default: 
				break;
			}

			p.group.notifyFullMatchMotion();
		}
		
		private function completeAnimationCard():void
		{
			for (var i:int = 0; i < movieCardContainer.numChildren; i++)
			{
				var child:MoviePattern = movieCardContainer.getChildAt(i) as MoviePattern;
				if (!child || !child.isRunning)
				{
					movieCardContainer.removeChildAt(i, true);
					i--;
				}
			}
		
			//RoundMotion.ME.updatePayout(false);
		}
		
		private function stopCardAnimations():void
		{
			movieCardContainer.removeChildren(0, -1, true);
		}
		
		public function cardScale():void
		{
			var scalee:Number = this.scaleX;
			
			juggler.tween(this, .05, {scaleX: scalee + .05, scaleY: scalee + .05});
			juggler.tween(this, .05, {delay: .05, scaleX: scalee - .05, scaleY: scalee - .05});
			juggler.tween(this, .05, {delay: .1, scaleX: scalee, scaleY: scalee});
		}
		
		public function cardShake():void
		{
			juggler.tween(this, .05, {x: initPos.x + 1, y: initPos.y + 1});
			juggler.tween(this, .05, {delay: .05, x: initPos.x - 2, y: initPos.y - 2});
			juggler.tween(this, .05, {delay: .1, x: initPos.x + 1, y: initPos.y - 1});
			juggler.tween(this, .05, {delay: .17, x: initPos.x, y: initPos.y, onComplete: resetPos, onCompleteArgs: [initPos]});
		}
		
		internal function resetPos(pos:Point):void
		{
			this.x = pos.x;
			this.y = pos.y;
		}
		
		// local variables
		private var xpectation:int;
		private var maxPriority:int;
		private var slot1:Slot;
		private var holder:MissingPatternsHolder;
		private var missingOnePatternss:LinkedList;
		private var holdingMissingBalls:LinkedList = new LinkedList();
		
		private function setMissingMark(obj:Object, usingNewPattern:Boolean = false):void
		{
			holder = obj.expectation as MissingPatternsHolder;
			
			xpectation = holder.expectation;
			maxPriority = holder.maxPriority;
			slot1 = obj.slot;
			slot1.missingMark.playBg(maxPriority);
			slotComp.topChild(slot1);
			if (maxPriority < 8 || (BallController.ME.triggers > MentonJackpotSession.ME.ballsToJackpot && maxPriority == 9)) slot1.missingMark.setPrizeValue(xpectation, slot1.number.text);
			else if (maxPriority == 8) slot1.missingMark.setPrizeValue(0, slot1.number.text);
			else if (maxPriority == 9) slot1.missingMark.setPrizeValue(-1, slot1.number.text);
			else throw new AssukarError("maxPriority: " + maxPriority);
			
			if (slot1.bellState.visible)
				slot1.missingMark.showBel();

			if (slot1 && Slot.missingMotion && Slot.missingMotion.addSlot(slot1)) hide(slot1.mark);
			
			//			if (BallController.ME.triggers < MentonJackpotSession.ME.ballsToJackpot && maxPriority == PatternGroup.FULL.priority)
			//			{
			//				CardPanel.ME.oneToJackpot(this.index);
			//			}
			if (maxPriority < 2) return;
			
			missingBackground.addMissingPatterns(holder.list, obj.slot, maxPriority);
		}
		
		public function cleanJackpotText():void
		{
			if (BallController.ME.triggers >= MentonJackpotSession.ME.ballsToJackpot && maxPriority == 9) slot1.missingMark.setPrizeValue(xpectation, slot1.number.text);
		}
		
		//private function cleanDoubleLinePattern():void
		//{
		//for (var i:int = 0; i < 3; i++)
		//{
		//if (doubleLinePatterns[i])
		//{
		//doubleLinePatterns[i].removeFromParent();
		//doubleLinePatterns[i] = null;
		//}
		//}
		//}
		
		//private function cleanJackpotPattern():void
		//{
		//if (fullMoviePattern) fullMoviePattern.removeFromParent();
		
		//fullMoviePattern = null;
		//}
		
		private var holdingMissingBallsProcessedThisBall:Boolean = false;
		
		private function showHoldingMissingBallsIntern():void
		{
			if (!holdingMissingBallsProcessedThisBall && !holdingMissingBalls.empty)
			{
				holdingMissingBallsProcessedThisBall = true;
				var c:Cursor = holdingMissingBalls.cursor;
				while (c.next) setMissingMark(c.current);
				holdingMissingBalls.clear();
//				PraiaGameEvents.MENTON_MISSING.dispatch(this);
			}
		}
		
		public function showHoldingMissingBalls():void
		{
			if (!frozen) showHoldingMissingBallsIntern();
		}
		
		private var cm:Vector.<int>;
		private var slott:Slot;
		private var objj:Object;
		private var hasNewPattern:Boolean;
		private var setMarkDelayedCalls:LinkedList = new LinkedList();
		
		public function setCardMatches(matches:CardMatches, showMissingBalls:Boolean, shouldBlinkMatch:Boolean):void
		{
			if (!matches) return;
			
			hasNewPattern = !matches.newPatterns.empty;
			if (hasNewPattern)
			{
				setMarkDelayedCalls.applyTo("complete");
				setMarkDelayedCalls.clear();
			}
			
			if (!matches.newPatterns.empty || shouldBlinkMatch) showMissingBalls = false;
			
			holdingMissingBallsProcessedThisBall = false;
			
			if (!showMissingBalls) holdingMissingBalls.clear();
			//else cleanDoubleLinePattern();
			
			missingOnePatternss = matches.missingOnePatterns;
			
			for (var i:int = 0; i < 3; i++)
			{
				cm = matches.matchTypes[i];
				for (var j:int = 0; j < 5; j++)
				{
					switch (cm[j])
					{
					case CardMatches.NO_MATCH: 
					case CardMatches.OLD_MATCH: 
						break;
					case CardMatches.OLD_MATCH_IN_PATTERN: 
						slots[i][j].fixMarked();
						break;
					case CardMatches.NEW_MATCH: 
					case CardMatches.NEW_MATCH_IN_PATTERN: 
						markComp.unflatten();
						numberComp.unflatten();
						markedComp.unflatten();
						playAnima(slots[i][j].markAnima, 1);
						
//						juggler.delayCall(function(i:int, j:int):void
//						{
//							slots[i][j].number.color = MARKED_NUMBER_COLORS_BY_STAKE_INDEX[0];
//						}, 0.2, i, j);

                        delayCall2(function(i:int, j:int):void {slots[i][j].number.color = MARKED_NUMBER_COLORS_BY_STAKE_INDEX[0];}, 0.2, i, j);


						setMarkDelayedCalls.push(delayCall2(setMark, 0.5, i, j, shouldBlinkMatch));//juggler.delayCall(setMark, 0.5, i, j, shouldBlinkMatch)
						
						if (cm[j] == CardMatches.NEW_MATCH_IN_PATTERN)
						{
							var slot:Slot = slots[i][j];
							Slot.missingMotion.removeSlot(slot);
							if (matches.bestNewPattern && matches.bestNewPattern.group.priority > 1) missingBackground.removeBgPattern(slot);
							
//							juggler.delayCall(propagateNewPatternMark, 0.8, matches.newPatterns, matches.bestNewPattern);
							delayCall2(propagateNewPatternMark, 0.8, matches.newPatterns, matches.bestNewPattern);
						}
						
						break;
					case CardMatches.MISSING_BALL: 
						slott = slots[i][j];
						objj = {slot: slott, expectation: matches.xpectations[i][j]};
						objj.patterns = matches.missingOnePatterns;
						objj.newPatterns = matches.newMissingPatterns;
						if (showMissingBalls) setMissingMark(objj);
						else holdingMissingBalls.push(objj);
						break;
					default: 
						throw new AssukarError("unexpected matches.matchTypes[" + i + "][" + j + "]: " + matches.matchTypes[i][j]);
					}
				}
			}
		
		}
		
		//		public function showBingoParticle():void
		//		{
		//			//if(!bingoParticle) bingoParticle = new MentonParticle("SuspenseBingo", particleHolder, bgContainer.width/2, bgContainer.height/2);
		//			//bingoParticle.start();
		//		}
		
		public function hideBingoParticle():void
		{
			//if(bingoParticle) bingoParticle.stop();
		}
		
		public function getSlotExpectationByPosition(pos:Point):MissingPatternsHolder
		{
			var auxSlotHolder:MissingPatternsHolder;
			for (var i:int = 0; i < 3; i++)
			{
				for (var j:int = 0; j < 5; j++)
				{
					var slot:Slot = slots[i][j];
					
					var auxSlotX:Number = slot.number.x - (SLOT_WIDTH / 2);
					var auxSlotY:Number = slot.number.y - (SLOT_HEIGHT / 2);
					
					if (pos.x >= auxSlotX && pos.y >= auxSlotY && pos.x <= (auxSlotX + SLOT_WIDTH) && pos.y <= (auxSlotY + SLOT_HEIGHT))
					{
						if (slot.missingMark.visible == true)
						{
							auxSlotHolder = this._card.getExpectation(i, j);
						}
					}
				}
			}
			return auxSlotHolder;
		}
		
		private var _card:Card;
		
		public function set card(_card:Card):void
		{
			this._card = _card;
		}
		
		public function setIntervalPattern(p:Pattern):void
		{
			clear();
			for (var i:int = 0; i < 3; i++)
			{
				for (var j:int = 0; j < 5; j++)
				{
					if (p.match(i, j))
					{
						setMark(i, j, false, true);
						var slot:Slot = slots[i][j];
						slot.bgDefault.visible = true;
						//slot.mark.alpha = .4;
					}
				}
			}
		}
	}
}
