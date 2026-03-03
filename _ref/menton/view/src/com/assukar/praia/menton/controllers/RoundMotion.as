package com.assukar.praia.menton.controllers {
	import com.assukar.airong.ds.Cursor;
	import com.assukar.airong.error.AssukarError;
	import com.assukar.airong.utils.Singleton;
	import com.assukar.airong.utils.Utils;
	import com.assukar.domain.domain.StatsMoney;
	import com.assukar.domain.services.dictio.Dictio;
	import com.assukar.engine.utils.AntiCheatInt;
	import com.assukar.praia.controllers.AutoCollector;
	import com.assukar.praia.domain.tourneys.TourneyController;
	import com.assukar.praia.main.PraiaContext;
	import com.assukar.praia.menton.assets.SoundID;
	import com.assukar.praia.menton.components.Menton;
	import com.assukar.praia.menton.components.MissingBallSyncer;
	import com.assukar.praia.menton.components.MotionConstants;
	import com.assukar.praia.menton.components.balls.BallPanelMenton;
	import com.assukar.praia.menton.components.bellPanel.BellPanel;
	import com.assukar.praia.menton.components.bonus.BonusGame;
	import com.assukar.praia.menton.components.buttons.payout.Payout;
	import com.assukar.praia.menton.components.cards.CardPanel;
	import com.assukar.praia.menton.components.cards.IntervalCardPatternController;
	import com.assukar.praia.menton.components.jackpot.JackpotPanel;
	import com.assukar.praia.menton.components.payouts.PayoutTable;
	import com.assukar.praia.menton.domain.CardMatches;
	import com.assukar.praia.menton.domain.Draw;
	import com.assukar.praia.menton.domain.Extra;
	import com.assukar.praia.menton.domain.MentonJackpotSession;
	import com.assukar.praia.menton.domain.MentonStatics;
	import com.assukar.praia.menton.domain.PatternGroup;
	import com.assukar.praia.menton.domain.Round;
	import com.assukar.praia.menton.domain.SlotBonusSession;
	import com.assukar.praia.menton.domain.SuperExtra;
	import com.assukar.praia.menton.main.MentonEngine;
	import com.assukar.praia.menton.main.MentonView;
	import com.assukar.view.sounds.Sounds;
	import com.assukar.view.starling.Animatables;
	import com.assukar.view.starling.AssukarJuggler;

import starling.animation.IAnimatable;


public class RoundMotion implements IAnimatable
	{
		static private const ROUND_VERIFICATION_INTERVAL:int = 8;
		// cycles between ball triggering and draw processing
		static private const DRAW_CALLBACK_CYCLES:int = 2;
		static private const EXTRA_DRAW_CALLBACK_CYCLES:int = 12;
		// singleton
		static public var ME:RoundMotion = new RoundMotion();
		// object vars
		internal var round:Round;
		private var extra:Boolean = false;
		// cumulative payout
		internal var _payout:AntiCheatInt = AntiCheatInt.ZERO;
		// cursor of draws
		private var cit:Cursor;
		// last CardMatches for each card index
		private var lastCardMatches:Vector.<CardMatches>;
		// draw animas completed
		private var completedDraws:int;
		private var moreDrawsToProcess:Boolean;
		private var running:Boolean;
		private var maxMissingPriority:int;
		private var maxMissingPriorityNumber:int;
		internal var processing:Boolean = false;
		public var haltedForUser:Boolean;
		internal var peelingMode:Boolean;
		internal var peelingColorMode:Boolean;
		internal var peeling:Boolean;
		private var lastDraw:Draw;
		private var roundOver:Boolean;
		private var forcedEndOfGame:Boolean;
    
        private var clearRoundCall:uint;
		
		private var animatingSplash:Boolean = false;
		
		public function dispose():void
		{
            if ( clearRoundCall ) juggler.removeByID(clearRoundCall);
			juggler.removeTweens(retryEnd);
			ME = null
		}
		
		function RoundMotion()
		{
			Singleton.enforce(ME);
		}
		
		public function triggerSuperExtra(superExtra:SuperExtra):void
		{
			triggerAnExtra();
		}
		
		public function triggerExtra(extra:Extra):void
		{
			BallPanelMenton.ME.hideExtraPrice();
			triggerAnExtra();
		}


        public function forceReset(): void
        {
            animatingSplash = false;
            extra = false;
            processing = false;
            maxMissingPriority = 0;
            maxMissingPriorityNumber = 0;
        }

		public function triggerAnExtra():void
		{
			processing = true;
			extra = true;
			var draw:Draw = round.draws.getLast();
			
			evaluatePeelingPre(draw);
			
			if (peelingMode)
			{
				if (peelingColorMode)
				{
					peel(triggerExtraBall, draw);
				}
				else
				{
					peel(triggerExtraBall, draw);
				}
			}
			else
			{
				triggerExtraBall(draw);
			}
		}
		
		private var peels:int;
		private var peelCallback:Function;
		private var peelDraw:Draw;
		
		public function peelBall():void
		{
			peels--;
			if (peels < 0)
			{
			}
			else if (peels == 0)
			{
				
				BallPanelMenton.ME.peel(peelDraw.ball - 1, peels);
				
				peeling = false;
				peelingMode = false;
				peelingColorMode = false;
				
				peelCallback(peelDraw);
				
			}
			else
			{
				BallPanelMenton.ME.peel(peelDraw.ball - 1, peels, peelAnimaCallback);
			}
		}
		
		private function peelAnimaCallback():void
		{
			ButtonsController.ME.setState(ButtonsController.PEEL);
		}
		
		private function peel(peelCallback:Function, peelDraw:Draw):void
		{
			this.peelCallback = peelCallback;
			this.peelDraw = peelDraw;
			
			peels = 4;//6;
			peeling = true;
			
//			PraiaGameEvents.MENTON_PEEL.dispatch();
//			// TUTORIAL
//			if (PraiaGameEvents.MENTON_PEEL.consume())
//			{
//				PraiaContext.ME.hudServices.tutorial.queue(new <Object>[Menton.ME.buttons.playButton], Dictio.upper("tutorialPeel"), 0.1);
//				Utils.print("INICIOU PEEL, MENTON_PEEL");
//			}
			
			if (peelingColorMode) peelBall();
			peelAnimaCallback();
		}
		
		private function triggerExtraBall(draw:Draw):void
		{
			lastDraw = draw;
			
			BallPanelMenton.ME.hideExtraStakes();
			
			BallController.ME.trigger(draw, EXTRA_DRAW_CALLBACK_CYCLES, cyclesCallback, ballAndPrizeCallback);
			
			if (draw.cardMatches && draw.cardMatches.newMissingPatterns)
			{
				maxMissingPriority = Math.max(maxMissingPriority, draw.cardMatches.maxMissingPriority);
				evaluatePeelingPost(draw);
			}
			
			callMovieSplash(draw);
		}
		
		public function triggerRound(round:Round):void
		{
			roundOver = false;
			
			triggerCount = 0;
			haltTriggerCount = 0;
			
			lastDraw = null;
			ballAndPrizeCallbackCounter = 0;
			ballCounter = 0;
			extra = false;
			
			previousPayout = 0;
			
			processing = true;
			forcedEndOfGame = false;
			
			if (this.round == round) throw new AssukarError();
			if (this.round) this.round.dispose();
			
			this.round = round;
			cit = round.draws.cursor;
			payout = 0;
			
			BallController.ME.reset();
            
            //
            if ( clearRoundCall ) juggler.removeByID(clearRoundCall);
            //
			
			lastCardMatches = new <CardMatches>[null, null, null, null];
			
			colorPeelNumbers = new <int>[];
			
			completedDraws = 0;
			maxMissingPriority = 0;
			maxMissingPriorityNumber = 0;
			triggerIntervalInFrames = MotionConstants.BALLS_TRIGGER_INTERVALS_IN_FRAMES[0];
			moreDrawsToProcess = cit.next;
			haltedForUser = false;
			peelingMode = false;
			peelingColorMode = false;
			peeling = false;
			destroyJumpingBalls();
			
			MissingBallSyncer.ME.frequency = 1;
			
			ButtonsController.ME.setPayout(new StatsMoney(), false);
			
			ttime = 1;
			tframes = 10;
			
			resume(false);
			PatternsController.ME.clear();
			
			BallPanelMenton.ME.state = BallPanelMenton.STATE_REGULAR;
			BallPanelMenton.ME.dropWater();
			
//			Menton.ME.hideHelpButton();
//			Menton.ME.destroyCall("showHelpButton");
			
			if (MentonJackpotSession.ME)
			{
				BallPanelMenton.ME.updateJackpotMarkPos();
				if (MentonJackpotSession.ME.ballsToJackpot == 30) BallPanelMenton.ME.showJackpotMarks();
			}
		}
		
		public function halt():void
		{
			if (running)
			{
				Animatables.stop(this);
				running = false;
			}
		}
		
		public function resume(user:Boolean = true):void
		{
			if (!running)
			{
				if (user)
				{
					if (cit.available)
					{
						if (peelingMode)
						{
							peel(triggerDefaultBall, cit.current);
						}
						else
						{
							triggerDefaultBall(cit.current);
						}
					}
				}
				else if (!haltedForUser)
				{
					ttime = 0;
					tframes = 0;
					running = true;
					Animatables.play(this);
				}
			}
		}
		
		private function color(b:int):int
		{
			return int((b - 1) / 15);
		}
		
		private var colorPeelNumbers:Vector.<int>;
		
		private function processPeelNumbers(drawColorPeelNumbers:Vector.<int>):void
		{
			var len:int = drawColorPeelNumbers.length;
			var i:int;
			for (i = 0; i < len; i++)
			{
				colorPeelNumbers.push(drawColorPeelNumbers[i]);
			}
		}
		
		private function evaluatePeelingPre(draw:Draw):void
		{
			if (!peelingMode && colorPeelNumbers.length > 0)
			{
				var colorball:int = color(draw.ball);
				var len:int = colorPeelNumbers.length;
				var i:int;
				for (i = 0; i < len; i++)
				{
					if (color(colorPeelNumbers[i]) == colorball)
					{
						peelingColorMode = true;
						peelingMode = true;
						
						break;
					}
				}
			}
		}
		
		private function evaluatePeelingPost(draw:Draw):void
		{
			if (draw.cardMatches.colorPeelNumbers.length > 0) processPeelNumbers(draw.cardMatches.colorPeelNumbers);
		}
		
		private var triggerCount:int;
		private var haltTriggerCount:int;
		
		private function triggerDefaultBall(draw:Draw):void
		{
			triggerCount++;
			
			lastDraw = cit.current;
			moreDrawsToProcess = cit.next;
			
			// halt the round if there is a payout pattern
			if (draw.additionalPayout > 0) halt();
			
			// trigger the ball
			BallController.ME.trigger(draw, DRAW_CALLBACK_CYCLES, cyclesCallback, ballAndPrizeCallback);
			
			if (haltedForUser) haltTriggerCount = triggerCount;
			
			if (draw.cardMatches && draw.cardMatches.newMissingPatterns)
			{
				maxMissingPriority = Math.max(maxMissingPriority, draw.cardMatches.maxMissingPriority);
				triggerIntervalInFrames = MotionConstants.BALLS_TRIGGER_INTERVALS_IN_FRAMES[maxMissingPriority];
				
				if (haltedForUser)
				{
					BallPanelMenton.ME.waterParticle(true);
				}
				else if (maxMissingPriority >= PatternGroup.HALT_FOR_USER_MIN_PRIORITY)
				{
					CardsController.ME.startBlinking();
					haltedForUser = true;
					haltTriggerCount = triggerCount;
					
				}
				
				if (maxMissingPriority >= PatternGroup.EXTRA_MIN_PRIORITY)
				{
					CardsController.ME.showMissing();
				}
				
				evaluatePeelingPost(draw);
			}
			
			// check if there are more draws to be processed
			if (draw.cardMatches && draw.cardMatches.maxPriority == PatternGroup.FULL.priority)
			{
				forcedEndOfGame = true;
				moreDrawsToProcess = false;
				haltedForUser = false;
				ButtonsController.ME.setState(ButtonsController.PLAY, false);
			}
			
			if (!moreDrawsToProcess)
			{
				haltedForUser = false;
				halt();
				
				BallPanelMenton.ME.waterParticle(true);
			}
			
			if (haltedForUser)
			{
				halt();
			}
			
			
			callMovieSplash(draw);
		}
		
		
		private function callMovieSplash(draw:Draw):void
		{
			if(!draw.cardMatches.bestNewPattern) return;
			
			var patternGroup:PatternGroup = draw.cardMatches.bestNewPattern.group;
			
			
			if(patternGroup == PatternGroup.DOUBLE_LINE || patternGroup == PatternGroup.TRIPLE_COLUMN ||
			   patternGroup == PatternGroup.QUAD_COLUMN || patternGroup == PatternGroup.QUAD_COLUMN_3)
			{
				animatingSplash = haltedForUser = true;
				
				var textLabel:String;
				
				switch (patternGroup)
				{
					case PatternGroup.DOUBLE_LINE:
						textLabel = Dictio.upper("DoubleLine");
						break;
					case PatternGroup.TRIPLE_COLUMN:
						textLabel = Dictio.upper("tripleColumn");
						break;
					case PatternGroup.QUAD_COLUMN:
						textLabel = Dictio.upper("prize4columns");
						break;
					case PatternGroup.QUAD_COLUMN_3:
						textLabel = Dictio.upper("doubleBox");
						break;
					default:
						//				
				}
				
				BallPanelMenton.ME.playSplash(textLabel, completeSplashMovie);
			}
		}
		
		private function completeSplashMovie():void
		{
			animatingSplash = haltedForUser = false;
			if(ballCounter < MentonStatics.DEFAULT_BALLS && haltTriggerCount == ballCounter){
				haltedForUser = true;
				if(ButtonsController.ME.getState() == ButtonsController.HALT)
					ButtonsController.ME.setState(ButtonsController.HALT, true);
			}
			
			if((!round.extraEnabled  && !round.superExtraEnabled && ballCounter < MentonStatics.TOTAL_GAME_BALLS) || ballCounter < MentonStatics.DEFAULT_BALLS)
			{
				if(ballCounter == MentonStatics.DEFAULT_BALLS + MentonStatics.EXTRA_BALLS){
				 	processEndOfDraws();
				}else{
					resume(false);	
				}
			}
			else
			{
				 processEndOfDraws();
			}
		}
		
		
		private var triggerIntervalInFrames:int;
		private var ttime:Number;
		private var tframes:int;
		
		public function advanceTime(time:Number):void
		{
			ttime += time;
			tframes += 1;
			while (ttime > 0.06 && tframes >= triggerIntervalInFrames && cit.available)
			{
				ttime = 0;
				tframes = 0;
				triggerDefaultBall(cit.current);
			}
		}
		
		public function updatePayoutAndFinishRound():void
		{
			ButtonsController.ME.setPayout(new StatsMoney(0, payout), false);  
			
			forcedEndOfGame = true;
			
			destroyJumpingBalls();
			Payout.ME.clearMessage();
			ButtonsController.ME.setState(ButtonsController.PLAY, false);
		}
		
		public function updatePayout(blink:Boolean = true):void
		{
			ButtonsController.ME.setPayout(new StatsMoney(0, payout), false); 
			if(blink) Payout.ME.collectingLeds(3);  
		}
		
		
		private var addPayout:int;
		
		private function cyclesCallback(draw:Draw):void
		{
			addPayout = draw.additionalPayout;
			payout += addPayout;
			
			CardsController.ME.processDraw(draw);
			
			if (draw.affectedCard) lastCardMatches[draw.affectedCard.index] = draw.cardMatches;
			
			if (CardsController.ME.showingMissing && draw.cardMatches)
			{
				if (draw.cardMatches.newMissingPatterns.size + draw.cardMatches.newPatterns.size)
				{
					PatternsController.ME.clear(false);
					PatternsController.ME.stopAnimas();
				}
				
				if (draw.cardMatches.newMissingPatterns.size + draw.cardMatches.newPatterns.size > 0)
				{
					PatternsController.ME.updateMissingPatterns(lastCardMatches);
				}
			}
			
			completedDraws++;
			
			if (draw.cardMatches)
			{
				PrizeController.ME.processCardMatches(draw.cardMatches, ballAndPrizeCallback);
			}
			else
			{
				ballAndPrizeCallback();
			}
			
			if (draw.affectedCard) PatternsController.ME.updateFullPatterns(lastCardMatches);
			
		}
		
		private var previousPayout:int;
		
		private function finalDrawCallback():void
		{
			previousPayout = payout;
			
			if (forcedEndOfGame)
			{
				processEndOfDraws();
			}
			else if (moreDrawsToProcess)
			{
				if (!running) resume(false);
			}
			else if (ballCounter >= 30)
			{
				processEndOfDraws();
			}
			
			if (haltedForUser && haltTriggerCount == ballCounter)
			{
				ButtonsController.ME.setState(ButtonsController.HALT);
			}
		
		}
		
		private var ballAndPrizeCallbackCounter:int;
		private var ballCounter:int;
		
		private function ballAndPrizeCallback():void
		{
			ballAndPrizeCallbackCounter++;
			if (ballAndPrizeCallbackCounter >= 2)
			{
				ballCounter++;
				ballAndPrizeCallbackCounter = 0;
				finalDrawCallback();
			}
		}
		
		private var retryEndDelay:uint;
		
		public function processEndOfDraws():void
		{
			if (moreDrawsToProcess && !forcedEndOfGame) throw new AssukarError("moreDrawsToProcess:" + moreDrawsToProcess + " forcedEndOfGame:" + forcedEndOfGame);

			if (CardPanel.ME && CardPanel.ME.bingoAnima && CardPanel.ME.bingoAnima.isRunning) return;


			try
			{
				if (retryEndDelay) AssukarJuggler.ME.removeByID(retryEndDelay);

				processing = false;

				if (ballCounter == MentonStatics.DEFAULT_BALLS)
				{
					BallPanelMenton.ME.state = BallPanelMenton.STATE_REGULAR;
					BallPanelMenton.ME.notifyEndOfDefaultRound();
				}

				if (ballCounter == MentonJackpotSession.ME.ballsToJackpot && (round.superExtraEnabled || round.extraEnabled))
				{
					if (JackpotPanel.ME) JackpotPanel.ME.turnOff();
				}

				var stmoney:StatsMoney;

				if (round.extraEverEnabled) stmoney = round.extraStake;

				// Durante as extras não verifica o bonus
				if (SlotBonusSession.ME.triggered)
				{
					checkBonus();
				}
				else if(animatingSplash)
				{
					if ( !roundOver ) retryEndDelay = AssukarJuggler.ME.delayCall(retryEnd,3);
					//Do nothing
				}
				else if (round.extraEnabled)
				{
					if (ballCounter == MentonStatics.DEFAULT_BALLS) Sounds.ME.playFx(SoundID.EXTRA_BALL_ACTIVATED, null, 1, Sounds.SOUND_TRANSFORM_VOLUME_40);

					if (round.extrasDrawn == 0)
					{
						if (CardsController.ME) CardsController.ME.startBlinking();
						BallPanelMenton.ME.updateExtraStakes(round.extraStakes);
					}

					if (stmoney.nil || (MentonEngine.ME.newRound.freeSpin && stmoney && stmoney.coinsOnly))
					{
						BallPanelMenton.ME.state = BallPanelMenton.STATE_FREE;
					}
					else
					{
						BallPanelMenton.ME.state = BallPanelMenton.STATE_EXTRA;
						BallPanelMenton.ME.updateExtraPrice(stmoney);
					}
					extraPriceSetCallback(ballCounter == MentonStatics.DEFAULT_BALLS);
				}
				else if (round.superExtraEnabled)
				{
					if (ballCounter == MentonStatics.DEFAULT_BALLS + MentonStatics.EXTRA_BALLS) Sounds.ME.playFx(SoundID.SUPER_BALL_ACTIVATED, null, 1, Sounds.SOUND_TRANSFORM_VOLUME_60);

					if (stmoney.nil || (MentonEngine.ME.newRound.freeSpin && stmoney && stmoney.coinsOnly))
					{
						BallPanelMenton.ME.state = BallPanelMenton.STATE_FREE;
					}
					else
					{
						BallPanelMenton.ME.state = BallPanelMenton.STATE_SUPER;
						BallPanelMenton.ME.updateExtraPrice(stmoney);
					}
					superExtraPriceSetCallback(ballCounter == MentonStatics.DEFAULT_BALLS + MentonStatics.EXTRA_BALLS);
				}
				else
				{
					if(!roundOver) endRound(false);
				}

			}
			catch (err:Error)
			{
				Utils.log("BallPanelMenton.ME: " + BallPanelMenton.ME);
				Utils.log("MentonEngine.ME: " + MentonEngine.ME);
				if (MentonEngine.ME) Utils.log("MentonEngine.ME.newRound: " + MentonEngine.ME.newRound);

				Utils.logError(err, false);
			}
		}
		
		private function retryEnd():void
		{
			Utils.log("DELAY CALL CALLED PROCCESSENDOFDRAWS AGAIN TO PREVENT ANIMATION TIMING FREEZE.");
			processEndOfDraws();
		}
		
		private function callbackFruitBonus():void
		{
			Sounds.ME.playFx(SoundID.SLOT_PRIZE_BOMB, null, 1, Sounds.SOUND_TRANSFORM_VOLUME_60);
			
			if (SlotBonusSession.ME.fruitBombBonus.pendingProcesssing)
			{
				SlotBonusSession.ME.fruitBombBonus.process();
			}
			
			CardPanel.ME.callFruitBonus(SlotBonusSession.ME.fruitBombBonus.bombPositions, function():void
			{
				if (!round || !round.draws)
				{
					Utils.log("round:" + round);
					Utils.logError(new AssukarError(), false);
					return;
				}
				
				var totalDraws:int = round.draws.size;
				var totalFruitBonusDraws:int = round.trueBonusDraws;
				var currentDraw:Draw;
				
				while (totalFruitBonusDraws)
				{
					currentDraw = round.draws.get( totalDraws - (totalFruitBonusDraws--) );
					
					CardsController.ME.processDraw(currentDraw); 		
					
					if (currentDraw.affectedCard) lastCardMatches[currentDraw.affectedCard.index] = currentDraw.cardMatches;	
					
					if (currentDraw.cardMatches.newMissingPatterns.size + currentDraw.cardMatches.newPatterns.size)
					{
						PatternsController.ME.clear(false);
						PatternsController.ME.stopAnimas();
					}						
					if (currentDraw.cardMatches.newMissingPatterns.size + currentDraw.cardMatches.newPatterns.size > 0)
					{
						PatternsController.ME.updateMissingPatterns(lastCardMatches);
					}	
					
					payout = MentonEngine.ME.round.payout;
					
					if (currentDraw.cardMatches) 
					{
						PrizeController.ME.processCardMatches(currentDraw.cardMatches, finalDrawCallback);
					}
					else
					{
						finalDrawCallback();
					}
					
					if (currentDraw.affectedCard) PatternsController.ME.updateFullPatterns(lastCardMatches); 	
					
					callMovieSplash(currentDraw); 
				}
				
			});
		}
		
		public function checkBonus():void
		{
			if (SlotBonusSession.ME.feteDuCitroinBonus)
			{
				CardPanel.ME.callBellAnimation(function():void
				{
					BellPanel.ME.animateSlots(SlotBonusSession.ME.symbols, callBackBonusGame);
				});
			}
			else if (SlotBonusSession.ME.fruitBombBonus)
			{
				CardPanel.ME.callBellAnimation(function():void
				{
					BellPanel.ME.animateSlots(SlotBonusSession.ME.symbols, callbackFruitBonus);
				});
			}
			else if (SlotBonusSession.ME.doubleWinBonus)
			{
				CardPanel.ME.callBellAnimation(function():void
				{
					BellPanel.ME.animateSlots(SlotBonusSession.ME.symbols, callbackMultiplierBonus);
				});
			}
			else
			{
				// o sorteio não trará nada
				CardPanel.ME.callBellAnimation(function():void
				{
					BellPanel.ME.animateSlots(SlotBonusSession.ME.symbols, processEndOfDraws);
				});
			}
			
			SlotBonusSession.ME.triggered = false;
		}
		
		private function callbackMultiplierBonus():void
		{
			Sounds.ME.playFx(SoundID.SLOT_PRIZE_2X, null, 1, Sounds.SOUND_TRANSFORM_VOLUME_60);			
			processEndOfDraws();   
		}
		
		private function callBackBonusGame():void
		{
			Sounds.ME.playFx(SoundID.SLOT_PRIZE_BONUS, null, 1, Sounds.SOUND_TRANSFORM_VOLUME_60);
			BellPanel.ME.blinkPanel();
			AssukarJuggler.ME.delayCall(initBonus, 2);
		}
		
		private function initBonus():void
		{
			if(BellPanel.ME){
				BellPanel.ME.stopBlink();
			}
			BonusGame.ME.init(SlotBonusSession.ME.feteDuCitroinBonus);
			BonusGame.ME.show();
		}
		
		private var endRoundByUser:Boolean;		
		
		private var prevEndRoundStatck:String; 
		
		public function endRound(endRoundByUser:Boolean = true):void
		{
			
			prevEndRoundStatck = Utils.getStackTrace(); 
			
			if (roundOver)
			{
				Utils.log("stack:" + prevEndRoundStatck);  
				Utils.logError(new AssukarError("endRoundByUser=" + endRoundByUser), false);
				return;
			}
			
			roundOver = true;
			
			TourneyController.ME.notifyCollection();
			
			if ( payout > 0 )
			{
//				PraiaGameEvents.MENTON_COLLECT.dispatch();
				// TUTORIAL
//				if (PraiaGameEvents.MENTON_COLLECT.consume())
//				{
//					PraiaContext.ME.hudServices.tutorial.queue(new <Object>[Menton.ME.buttons.payout], Dictio.upper("tutorialPayout"), 0.1);
//					Utils.print("INICIOU PRIMEIRA COLETA. MENTON_COLLECT");
//				}
			}
			
			this.endRoundByUser = endRoundByUser;
			
			MissingBallSyncer.ME.frequency = 2;
			
			MentonEngine.ME.lastRoundCollect = new Date();
			
			if (round.winMultiplierPayout) 
			{			
				BellPanel.ME.multiplierCollect(function ():void 
				{
					payout = MentonEngine.ME.round.payout+round.winMultiplierPayout;
					updatePayout();  
					Menton.ME.delayCall("multiplierCollectDelay", juggler.delayCall(collect, 1.5, !endRoundByUser )); 
				}); 				
			}
			else
			{ 
				Menton.ME.delayCall("collectDelay", juggler.delayCall(collect, .5, !endRoundByUser ));
			}
			
			if (endRoundByUser) BallPanelMenton.ME.state = BallPanelMenton.STATE_IDLE;
			
			//
            
   
			
			//PatternsController.ME.clear();
		}
		
		private function collect(breathBeforeStart:Boolean):void 		
		{
			MentonEngine.ME.triggerMultiplierPayout();
			AutoCollector.ME.collect(autoCollectCallback, new StatsMoney(0, payout), MentonEngine.ME.newRound, breathBeforeStart);
		}
		
		private var jumpBallsDelayedCall:uint;
		private var _jugglerIndex:int = -1;
		
		public function destroyJumpingBalls():void
		{
			if (jumpBallsDelayedCall)
			{
				juggler.removeByID(jumpBallsDelayedCall);
				jumpBallsDelayedCall = 0;
			}
		}
		
		/* INTERFACE starling.animation.IAnimatable */
		public function get jugglerIndex():int
		{
			return _jugglerIndex;
		}
		
		public function set jugglerIndex(value:int):void
		{
			_jugglerIndex = value;
		}
		
		private function autoCollectCallback():void
		{
			if (!MentonView.ME || MentonView.ME.isDisposed())
			{
				PraiaContext.ME.navigator.autoInitiatedLock = false;
				return;
			}
			
			MentonEngine.ME.collect();
			MentonEngine.ME.verifyFreeTag();
			
			destroyJumpingBalls();
			ButtonsController.ME.setPayout(new StatsMoney(0, payout), true);
			
			PraiaContext.ME.navigator.autoInitiatedLock = false;
			
			if(!CardPanel.ME.bingoAnima.isRunning)
			{
				ButtonsController.ME.setState(ButtonsController.PLAY);
                
                if ( clearRoundCall ) juggler.removeByID(clearRoundCall);
                clearRoundCall = juggler.delayCall(clearRound, ROUND_VERIFICATION_INTERVAL);
            }
			
			//jumpBallsDelayedCall = juggler.delayCall(jumpBalls, ROUND_VERIFICATION_INTERVAL);
//			CardPanel.ME.resetCardsPositions();
			CardPanel.ME.setPositions();
			
//			function jumpBalls():void
//			{
//				ButtonsController.ME.setPayout(new StatsMoney(), false);
//			}
		}
		
		private function extraPriceSetCallback(blink:Boolean = true):void
		{
			ButtonsController.ME.setState(ButtonsController.EXTRA, true, blink);
		}
		
		private function superExtraPriceSetCallback(blink:Boolean = true):void
		{
			ButtonsController.ME.setState(ButtonsController.SUPER, true, blink);
		}
		
		public function get extraAvailable():Boolean
		{
			return round && round.extraEnabled;
		}
		
		public function get superExtraAvailable():Boolean
		{
			return round && round.superExtraEnabled;
		}
		
		public function get payout():int {
			return _payout.value;
		}
		
		public function set payout(value:int):void {
			_payout.value = value;
		}
    
        private function clearRound() : void
        {
            BellPanel.ME.resetPanel();
            BallController.ME.reset();
            PayoutTable.ME.clear();
            CardPanel.ME.clear();
            IntervalCardPatternController.ME.playIntervalAnimation();
        }
	}
}
