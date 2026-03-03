package com.assukar.praia.menton.main
{
    import com.assukar.airong.error.AssukarError;
    import com.assukar.airong.utils.Singleton;
    import com.assukar.airong.utils.StringUtils;
    import com.assukar.airong.utils.Utils;
    import com.assukar.domain.domain.StatsAction;
    import com.assukar.domain.domain.StatsMoney;
    import com.assukar.praia.assets.games.vbs.VBEngine;
    import com.assukar.praia.assets.games.vbs.VBView;
    import com.assukar.praia.domain.PraiaStatsAction;
    import com.assukar.praia.domain.gameevents.PraiaGameEvents;
    import com.assukar.praia.domain.games.vbs.MentonVBB;
    import com.assukar.praia.domain.games.vbs.VBNewRound;
    import com.assukar.praia.domain.games.vbs.VBRound;
    import com.assukar.praia.domain.inventories.PraiaIFlagsInventory;
    import com.assukar.praia.domain.levels.GameLevelsController;
    import com.assukar.praia.domain.tourneys.TourneyController;
    import com.assukar.praia.main.PraiaContext;
    import com.assukar.praia.menton.assets.SoundID;
    import com.assukar.praia.menton.components.Menton;
    import com.assukar.praia.menton.components.buttons.ButtonPanel;
    import com.assukar.praia.menton.controllers.RoundMotion;
    import com.assukar.praia.menton.domain.Extra;
    import com.assukar.praia.menton.domain.MentonJackpotSession;
    import com.assukar.praia.menton.domain.NewExtra;
    import com.assukar.praia.menton.domain.NewRound;
    import com.assukar.praia.menton.domain.NewSuperExtra;
    import com.assukar.praia.menton.domain.Round;
    import com.assukar.praia.menton.domain.SlotBonusSession;
    import com.assukar.praia.menton.domain.SuperExtra;
    import com.assukar.praia.menton.engine.commands.BonusCommand;
    import com.assukar.praia.menton.engine.commands.ExtraControlCommand;
    import com.assukar.praia.menton.engine.commands.NewRoundControlCommand;
    import com.assukar.praia.menton.engine.commands.SuperExtraControlCommand;
import com.assukar.praia.services.navigation.WebScreens;
import com.assukar.praia.services.stats.PraiaMainStats;
    import com.assukar.view.sounds.Sounds;
    
    public class MentonEngine
            extends VBEngine
    {
        // singleton
        static public const ME:MentonEngine = new MentonEngine();
        
        public function MentonEngine()
        {
            Singleton.enforce(ME);
            reset();
        }
        
        // object vars
        public var newRound:NewRound;
        public var round:Round;
        
        override protected function get newRoundd():VBNewRound
        {
            return newRound;
        }
        
        override protected function get roundd():VBRound
        {
            return round;
        }
        
        override protected function get vieww():VBView
        {
            return MentonView.ME;
        }
        
        override public function get freeSpinIFlag():int
        {
            return PraiaIFlagsInventory.FREE_SPIN_BONUS_MENTON;
        }
        
        override protected function get freeSpinAction():StatsAction
        {
            return PraiaStatsAction.FREE_SPINS_MENTON;
        }
        
        override public function get vipSpinIFlag():int
        {
            return PraiaIFlagsInventory.FREE_SPIN_VIP_MENTON;
        }
        
        override protected function get vipSpinAction():StatsAction
        {
            return PraiaStatsAction.VIP_SPINS_MENTON;
        }
        
        private function reset():void
        {
            newRound = null;
            round = null;
        }
        
        override public function dispose():void
        {
            reset();
            if (RoundMotion.ME) RoundMotion.ME.halt();
            SlotBonusSession.ME.reset();
            MentonJackpotSession.ME.reset();
            PraiaContext.ME.gameEngine = null;
        }
        
        override public function initiate():void
        {
            newRound = new NewRound();
            if (!RoundMotion.ME) RoundMotion.ME = new RoundMotion()
            SlotBonusSession.ME.shuffle();
            PraiaContext.ME.gameEngine = this;
            if (ButtonPanel.ME) ButtonPanel.ME.stakesButton.openTotalPrice();
        }
        
        public function viewInitiated():void
        {
            MentonView.ME.setNewRound(MentonEngine.ME.newRound);
            WebScreens.ME.main.trackPage('Game_Menton');
        }
        
        public function walkStake():void
        {
//			if (IFlagsController.ME.retrieve(PraiaIFlagsInventory.FREE_SPIN_BONUS_MENTON) > 0) return;
            if (MentonEngine.ME.freeSpins) return;
            
            newRound.walkStake();
            MentonView.ME.setNewRound(newRound, true);
            ButtonPanel.ME.stakesButton.openTotalPrice();
        }
        
        public function resetStake():void
        {
            newRound.resetStake();
            if (MentonView.ME) MentonView.ME.setNewRound(newRound, true);
        }
        
        public function shuffle():void
        {
            newRound.shuffle();
            SlotBonusSession.ME.shuffle();
            MentonView.ME.setNewRound(newRound, false);
            
            Sounds.ME.playFx(SoundID.BUTTON_SHUFFLE);
        }
        
        public function endRound():void
        {
            RoundMotion.ME.endRound();
        }
        
        public function tryExtraCash():Boolean
        {
            return !round || !round.extraStake || PraiaMainStats.ME.tryCash(-round.extraStake.cash) >= 0;
        }
        
        public function callSuperExtra():Boolean
        {
            if (SlotBonusSession.ME.fruitBombBonus && SlotBonusSession.ME.fruitBombBonus.pendingProcesssing) throw new AssukarError();
            if (!round.superExtraEnabled) throw new AssukarError();
            
            var stake:StatsMoney = round.extraStake.clone().multiply(-1);
            var cashOnFreeSpin:Boolean = (newRound.freeSpin && stake.cash != 0);
            setFreeExtraStake(stake);
            
            if (PraiaContext.ME.hudServices.checkMoney(stake) && !cashOnFreeSpin)
            {
                PraiaContext.ME.hudServices.addMoney(stake, PraiaStatsAction.MENTON_SUPEREXTRAS);
                var superExtra:SuperExtra = SuperExtraControlCommand.ME.execute(new NewSuperExtra(round));
                lastExtraCalled = new Date();
                PraiaContext.ME.hudServices.addLockedMoney(StatsMoney.makeCoins(round.lastDraw.additionalPayout), PraiaStatsAction.MENTON_PAYOUTSUPEREXTRA);
                MentonView.ME.processSuperExtra(superExtra);
                PraiaGameEvents.MENTON_EXTRA.dispatch().securedRelay(WebScreens.ME.gameEventRelay, {
                    segment: 2
                })
                MentonJackpotSession.ME.addJuice(stake.coinsEquivalent);
                return true;
            }
            return false;
        }
        
        public function callExtra():Boolean
        {
            if (!round) throw new AssukarError("round is null " + Utils.printStackTrace());
            if (round.superExtraEnabled) throw new AssukarError("round.superExtraEnabled:" + round.superExtraEnabled);
            
            var stake:StatsMoney = round.extraStake.clone().multiply(-1);
            var cashOnFreeSpin:Boolean = (newRound.freeSpin && stake.cash != 0);
            setFreeExtraStake(stake);
            
            if (PraiaContext.ME.hudServices.checkMoney(stake) && !cashOnFreeSpin)
            {
                if (stake.coinsEquivalent == 0) PraiaGameEvents.MENTON_FREE_EXTRA.dispatch();
                PraiaContext.ME.hudServices.addMoney(stake, PraiaStatsAction.MENTON_EXTRAS);
                var extra:Extra = ExtraControlCommand.ME.execute(new NewExtra(round));
                lastExtraCalled = new Date();
                PraiaContext.ME.hudServices.addLockedMoney(StatsMoney.makeCoins(round.lastDraw.additionalPayout), PraiaStatsAction.MENTON_PAYOUTEXTRA);
                MentonView.ME.processExtra(extra);
                PraiaGameEvents.MENTON_EXTRA.dispatch().securedRelay(WebScreens.ME.gameEventRelay, {
                    segment: 1
                })
                MentonJackpotSession.ME.addJuice(stake.coinsEquivalent);
                return true;
            }
            return false;
        }
        
        public function triggerMultiplierPayout():void
        {
            if (round && round.winMultiplierPayout)
            {
                PraiaContext.ME.hudServices.addLockedMoney(StatsMoney.makeCoins(round.winMultiplierPayout), PraiaStatsAction.MENTON_MULTIPLIER);
            }
        }
        
        public function collect():void
        {
            lastRoundCollected = new Date();
            round = null;
        }
        
        private var lastRoundCalled:Date;
        private var lastExtraCalled:Date;
        public var lastRoundCollect:Date;
        private var lastRoundCollected:Date;
        
        override public function callNewRound():Boolean
        {
            //TODO to review (ads)
            if (super.callNewRound() || tryToTriggerAds(callNewRound))
            {
                return false;
            }
            
            if (round)
            {
                Utils.log(StringUtils.formatDate(lastRoundCalled) + " " + StringUtils.formatDate(lastExtraCalled) + " " + StringUtils.formatDate(lastRoundCollect) + " " + StringUtils.formatDate(lastRoundCollected));
                Utils.logError(new AssukarError("round not null"), false);
                round = null;
            }
            
            if (getFreeSpins() > 0)
            {
                ButtonPanel.ME.freeSpinBigTag.visible = true;
                ButtonPanel.ME.freeTag.visible = false;
            } else
            {
                ButtonPanel.ME.freeSpinBigTag.visible = false;
            }
            
            if (checkFreeSpin() && PraiaContext.ME.hudServices.checkMoneyAndMoonwalk(newRound, MentonView.ME.setNewRound))
            {
                var stake:StatsMoney = newRound.getMoney();
                
                PraiaContext.ME.navigator.autoInitiatedLock = true;
                PraiaContext.ME.hudServices.addMoney(stake.clone(), PraiaStatsAction.MENTON_NEWROUND);
                
                round = NewRoundControlCommand.ME.execute();
                lastRoundCalled = new Date();
                PraiaContext.ME.hudServices.addLockedMoney(StatsMoney.makeCoins(round.payout), PraiaStatsAction.MENTON_PAYOUT);
                MentonView.ME.processRound(round);
                MentonJackpotSession.ME.addJuice(stake.coinsEquivalent);
                TourneyController.ME.buyIn();
                GameLevelsController.ME.notifyGameLevelUp(MentonVBB.ME);
                
                return true;
            } else
            {
                Menton.ME.delayCall("verifyFreeTag", juggler.delayCall(verifyFreeTag, .2));
                return false;
            }
        }
        
        override public function verifyFreeTag():void
        {
            //if (getFreeSpins() > 0 && ButtonsController.ME.getState() == ButtonsController.PLAY) ButtonPanel.ME.freeTag.startBGAnim(getFreeSpins());
            //else ButtonPanel.ME.freeTag.stopBGAnim();
            ButtonPanel.ME.freeTag.update();
        }
        
//        public function callFruitBomb():void
//        {
//            if (SlotBonusSession.ME.fruitBombBonus && SlotBonusSession.ME.fruitBombBonus.pendingProcesssing) SlotBonusSession.ME.fruitBombBonus.process();
//            else throw new AssukarError();
//        }
        
        public function callBonus():Boolean
        {
            try
            {
                BonusCommand.ME.execute(round);
                ButtonPanel.ME.disableKeyboard();
                return true;
            } catch (e:Error)
            {
                Utils.logError(e, false);
            }
            return false;
        }
        
        override public function tryThreshold(cash:int, coins:int):Boolean
        {
            return coins < newRound.totalStake;
        }
    }
}
