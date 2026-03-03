package com.assukar.praia.menton.main
{
    import com.assukar.airong.ds.Cursor;
    import com.assukar.airong.platforms.IOS;
import com.assukar.airong.utils.Statics;
import com.assukar.airong.utils.Utils;
    import com.assukar.praia.assets.Fonts;
    import com.assukar.praia.assets.PraiaCommonAssets;
    import com.assukar.praia.assets.games.vbs.VBView;
    import com.assukar.praia.controllers.AutoPlayController;
    import com.assukar.praia.controllers.PraiaView;
    import com.assukar.praia.domain.games.vbs.VBNewRound;
    import com.assukar.praia.main.PraiaContext;
    import com.assukar.praia.menton.assets.MentonAssets;
    import com.assukar.praia.menton.assets.MentonParticles;
    import com.assukar.praia.menton.assets.SoundID;
    import com.assukar.praia.menton.assets.imports.AssetsManagerMenton;
    import com.assukar.praia.menton.components.Menton;
    import com.assukar.praia.menton.components.buttons.ButtonPanel;
    import com.assukar.praia.menton.components.buttons.payout.Payout;
    import com.assukar.praia.menton.components.cards.CardPanel;
    import com.assukar.praia.menton.components.cards.IntervalCardPatternController;
    import com.assukar.praia.menton.controllers.BallController;
    import com.assukar.praia.menton.controllers.ButtonsController;
    import com.assukar.praia.menton.controllers.CardsController;
    import com.assukar.praia.menton.controllers.JackpotController;
    import com.assukar.praia.menton.controllers.MentonAutoCollector;
    import com.assukar.praia.menton.controllers.PatternsController;
    import com.assukar.praia.menton.controllers.PrizeController;
    import com.assukar.praia.menton.controllers.RoundMotion;
    import com.assukar.praia.menton.domain.Extra;
    import com.assukar.praia.menton.domain.NewRound;
    import com.assukar.praia.menton.domain.Round;
    import com.assukar.praia.menton.domain.SuperExtra;
import com.assukar.praia.services.navigation.Screens;
import com.assukar.praia.sounds.PraiaSounds;
    import com.assukar.view.sounds.Sounds;
    

    
    public class MentonView extends PraiaView implements VBView
    {
        // singleton
        static public var ME:MentonView;
        
        public function MentonView()
        {
            //TODO to delete
            //Statics.SCALE = 320 / Statics.INITIAL_RECT.width;

            ME = this;
            MentonAssets.ME.createDynamicAssets();
            super(AssetsManagerMenton.ME, PraiaCommonAssets.MENTON, Menton, MentonAutoCollector);

        }

//
//		public function dispatchTutorial(event: GameEvent, args: Array): void
//		{
//			switch (event)
//			{
//				case PraiaGameEvents.MENTON_COLLECT:
//					PraiaContext.ME.hudServices.tutorial.queue(new <Object>[Menton.ME.buttons.payout], Dictio.upper("tutorialPayout"), 0.1);
//					break;
//				case PraiaGameEvents.MENTON_EXTRA:
//					PraiaContext.ME.hudServices.tutorial.queue(new <Object>[ // 
//						Menton.ME.balls.extraBallsBackContainer, //
//						Menton.ME.balls.extraBallsFrontContainer, //
//						Menton.ME.balls.extraBallsStakesContainer, //
//						Menton.ME.balls.extraPriceContainer //    
//					], Dictio.upper("tutorialExtraBall"), 0.5);
//					break;
//				case PraiaGameEvents.MENTON_MISSING:
//					PraiaContext.ME.hudServices.tutorial.queue(new <Object>[args[0]], Dictio.upper("tutorialMissing"), 0.3);
//					break;
//				case PraiaGameEvents.MENTON_PEEL:
//					PraiaContext.ME.hudServices.tutorial.queue(new <Object>[Menton.ME.buttons.playButton], Dictio.upper("tutorialPeel"), 0.1);
//					break;
//				case PraiaGameEvents.MENTON_PRIZE:
//					PraiaContext.ME.hudServices.tutorial.queue(new <Object>[Menton.ME.buttons.payout], Dictio.upper("tutorialBalance"), 0.1);
//					break;
//			}
//		}	
        
        override public function dispose():void
        {
            if (MentonAssets.ME) MentonAssets.ME.disposeDynamicAssets();
            
            if (RoundMotion.ME)
            {
                RoundMotion.ME.destroyJumpingBalls();
                juggler.remove(RoundMotion.ME);
                RoundMotion.ME.dispose();
            }
            
            if (volumeDelay) juggler.removeByID(volumeDelay);
            if (Payout.ME) Payout.ME.clearMessage();
            
            BallController.ME.dispose();
            ButtonsController.ME.dispose();
            CardsController.ME.dispose();
            PatternsController.ME.dispose();
            PrizeController.ME.dispose();
            JackpotController.ME.dispose();
            MentonParticles.ME.dispose();
            IntervalCardPatternController.ME.dispose();
            
            ME = null;
            super.dispose();
        }
        
        override public function initiate():void
        {
            super.initiate();
            
            CardsController.ME = new CardsController();
            BallController.ME = new BallController();
            ButtonsController.ME = new ButtonsController();
            PatternsController.ME = new PatternsController();
            PrizeController.ME = new PrizeController();
            
            JackpotController.ME = new JackpotController();
            JackpotController.ME.initiate();
            
            MentonEngine.ME.viewInitiated();
            
            ButtonsController.ME.setState(ButtonsController.PLAY);
            
            Sounds.ME.setMusicVolume(.6);
            Sounds.ME.playMusic(SoundID.MENTON_LOOP, null, int.MAX_VALUE);
            PraiaSounds.ME.voice = PraiaSounds.MALE_VOICE;
//			PraiaContext.ME.hudServices.checkUseKeyboardTip();
            
            IntervalCardPatternController.ME = new IntervalCardPatternController();
            IntervalCardPatternController.ME.playIntervalAnimation();
            
            RoundMotion.ME.forceReset();

        }
        
        public function setNewRound(newRoundd:VBNewRound, stakeChanged:Boolean = true, cardContentChanged:Boolean = true):void
        {
            var newRound:NewRound = newRoundd as NewRound;
            var stake:int = newRound.unitaryStake;
            
            BallController.ME.reset();
            PatternsController.ME.clear(true, false);
            
            if (stakeChanged)
            {
                ButtonPanel.ME.stakesButton.resetStakes();
                CardPanel.ME.setTitleColor(MentonEngine.ME.newRound ? MentonEngine.ME.newRound.stakeIndex : 0);
                JackpotController.ME.update();
                PatternsController.ME.updateStakes(stake);
            }
            
            CardsController.ME.clear();
            CardsController.ME.setNumbers(newRound);
        }
        
        public function processRound(round:Round):void
        {
            var str:String = "";
            
            var c:Cursor = round.balls.cursor;
            while (c.next)
            {
                str += c.current + ",";
            }
            
            CardsController.ME.clear();
            RoundMotion.ME.triggerRound(round);
            PatternsController.ME.stopAnimas();
            ButtonPanel.ME.stakesButton.closeTotalPrice();
        }
        
        public function processExtra(extra:Extra):void
        {
            RoundMotion.ME.triggerExtra(extra);
        }
        
        public function processSuperExtra(superExtra:SuperExtra):void
        {
            RoundMotion.ME.triggerSuperExtra(superExtra);
        }
        
        public var volumeDelay:uint;
        
        public function setAutoPlay(autoPlay:Boolean, extras:Boolean = false):void
        {
            Utils.log("AUTO PLAY: " + autoPlay + " | EXTRAS: " + extras);
            if (autoPlay)
            {
                AutoPlayController.ME.enableAutoPlay(extras, ButtonPanel.ME.playButton, ButtonPanel.ME.endButton, MentonEngine.ME.tryExtraCash, ButtonPanel.ME.autoPlayContainer);
                AutoPlayController.ME.onButtonEnabled(true);
            }
            else
            {
                AutoPlayController.ME.disableAutoPlay();
                ButtonPanel.ME.freeSpinBigTag.visible = false;
            }
        }
        
        override public function getFontLib():Object
        {
            return PraiaContext.ME.mobile ? Fonts.mentonFonts : MentonAssets.ME.getFontLib("mentonfonts");
        }
    }
}
