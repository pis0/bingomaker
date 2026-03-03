package com.assukar.praia.menton.controllers
{
    import com.assukar.airong.error.AssukarError;
    import com.assukar.airong.utils.Singleton;
    import com.assukar.airong.utils.Utils;
    import com.assukar.domain.domain.StatsMoney;
    import com.assukar.praia.components.AutoPlayPanel;
    import com.assukar.praia.controllers.AutoCollector;
    import com.assukar.praia.controllers.AutoCollectorButtonEventApprover;
    import com.assukar.praia.controllers.AutoPlayController;
    import com.assukar.praia.main.PraiaContext;
    import com.assukar.praia.menton.assets.SoundID;
    import com.assukar.praia.menton.components.buttons.ButtonPanel;
    import com.assukar.praia.menton.components.buttons.EndButton;
    import com.assukar.praia.menton.components.buttons.StakesButton;
    import com.assukar.praia.menton.components.buttons.payout.Payout;
    import com.assukar.praia.menton.components.cards.CardPanel;
    import com.assukar.praia.menton.components.cards.Cardd;
    import com.assukar.praia.menton.components.cards.IntervalCardPatternController;
    import com.assukar.praia.menton.main.MentonEngine;
    import com.assukar.praia.services.stats.PraiaMainStats;
    import com.assukar.view.sounds.Sounds;
    import com.assukar.view.starling.TouchableComponent;

    import flash.ui.Keyboard;

    
    
    import starling.events.Touch;

    /**
     * @author Johnatan
     */
    public class ButtonsController
    {
        static public const PLAY:int = 1;
        static public const EXTRA:int = 2;
        static public const BONUS:int = 3;
        static public const SUPER:int = 4;
        static public const HALT:int = 5;
        static public const PEEL:int = 6;
        static public var ME:ButtonsController;
        private var state:int = PLAY;
        private var pressedState:int = 0;
        private var clickCraze:uint;

        public function dispose():void
        {
            ME = null;
            if (clickCraze) juggler.removeByID(clickCraze);
        }

        public function ButtonsController()
        {
            Singleton.enforce(ME);

            ButtonPanel.ME.playButton.RELEASE.listen(playReleaseHandler);
            ButtonPanel.ME.playButton.PRESS.listen(playPressHandler);

            ButtonPanel.ME.extraButton.RELEASE.listen(playReleaseHandler);
            ButtonPanel.ME.extraButton.PRESS.listen(playPressHandler);

            ButtonPanel.ME.endButton.RELEASE.listen(endHandler);

            CardsController.ME.registerPressListeners(cardPressHandler);

            ButtonPanel.ME.stakesButton.RELEASE.listen(stakesRelease);
            ButtonPanel.ME.stakesButton.PRESS.listen(stakesHandler);
        }

        private function startPeelCall():void
        {
            doPeel();
        }

        private function doPeel():Boolean
        {
            if (state == PEEL)
            {
                RoundMotion.ME.peelBall();
                return true;
            }
            else
            {
                return false;
            }
        }

        private var pressHoldDelayCall:uint;

        private var approver:AutoCollectorButtonEventApprover;

        private function playPressHandler(comp:TouchableComponent, touch:Touch):void
        {
            approver = new AutoCollectorButtonEventApprover();
            if (AutoCollector.LOG) Utils.log("PRESS " + approver.cancelPress + " " + approver);
            if (approver.cancelPress) return;

//			PraiaContext.ME.hudServices.closeTutorialTips();

            if (!ButtonPanel.ME.playButton.enabled || PraiaContext.ME.navigator.secondary || PraiaContext.ME.navigator.popup) return;

            AutoCollector.ME.interruptIfCollecting();

            pressedState = state;

            switch (state)
            {
                case PLAY:
//					if (!IFlagsController.ME.retrieve(PraiaIFlagsInventory.FREE_SPIN_BONUS_MENTON))
                    if (!MentonEngine.ME.freeSpins)
                    {
                        juggler.removeByID(pressHoldDelayCall);
                        pressHoldDelayCall = juggler.delayCall(function ():void
                        {
                            if(!AutoPlayPanel.ME) return;
                            AutoPlayPanel.ME.showAutoModeOptions();
                        }, 1);
                    }
                    break;
                case EXTRA:
                    break;
                case SUPER:
                    break;
                case HALT:
                    break;
                case PEEL:
                    startPeelCall();
                    break;
            }
        }

        private var haltCalled:Boolean;

        private function playReleaseHandler(comp:TouchableComponent, touch:Touch):void
        {
            if (AutoCollector.LOG) Utils.log("RELEASE " + approver.cancelRelease + " " + approver);
            if (!approver || approver.cancelRelease) return;

            juggler.removeByID(pressHoldDelayCall);
            if (AutoPlayPanel.ME.state == AutoPlayPanel.MENU_OPENED)
            {
                setState(PLAY);
                return;
            }
            if (!ButtonPanel.ME.playButton.enabled) return;
            if (PraiaContext.ME.navigator.secondary || PraiaContext.ME.navigator.popup) return;
            if (pressedState != state) return;

            var success:Boolean = false;

            switch (state)
            {
                case PLAY:
                    IntervalCardPatternController.ME.stopIntervalAnimation();
                    success = MentonEngine.ME.callNewRound();
                    break;
                case EXTRA:
                    success = MentonEngine.ME.callExtra();
                    break;
                case SUPER:
                    if (AutoPlayController.ME.autoPlay && AutoPlayController.ME.extraMode)
                    {
                        if (!(PraiaMainStats.ME.tryCash(MentonEngine.ME.round.extraStake.cash * -1) >= 0))
                        {
                            success = false;
                            RoundMotion.ME.endRound(false);
                            return;
                        }
                    }
                    success = MentonEngine.ME.callSuperExtra();
                    break;
                case BONUS:
                    success = MentonEngine.ME.callBonus();
                    break;
                case HALT:
                    haltCalled = false;
                    RoundMotion.ME.resume();
                    success = true;
                    break;
                case PEEL:
                    Sounds.ME.playFx(SoundID.PEEL, null, 1, Sounds.SOUND_TRANSFORM_VOLUME_20);
                    success = doPeel();
                    break;
                default:
                    throw new AssukarError(state);
            }

            Payout.ME.clearMessage();

            if (success && pressedState == state)
            {

                if (state == BONUS)
                {
                    //setState(PLAY, true);
                } else if (state != PEEL)
                {
                    setState(state, false);
                }

            } else if (!success)
            {
                setState(pressedState, true);
            }

            pressedState = 0;
        }

        private function cardPressHandler(card:Cardd, touch:Touch):void
        {
            if (getState() == PLAY && ButtonPanel.ME.playButton.enabled)
            {
                if (!PraiaContext.ME.navigator.autoInitiatedLock)
                {
                    IntervalCardPatternController.ME.stopIntervalAnimation();
                    MentonEngine.ME.shuffle();
                }
            }
        }

        private function endHandler(button:EndButton, touch:Touch):void
        {
            button.disable();

            ButtonPanel.ME.playButton.turn(false);
            ButtonPanel.ME.extraButton.turn(false);

            MentonEngine.ME.endRound();
        }

        private function stakesRelease(button:StakesButton, touch:Touch):void
        {
            if (PraiaContext.ME.navigator.autoInitiatedLock) return;
            button.enable();
        }

        private function stakesHandler(button:StakesButton, touch:Touch):void
        {
            if (PraiaContext.ME.navigator.autoInitiatedLock) return;
            IntervalCardPatternController.ME.stopIntervalAnimation();
            MentonEngine.ME.walkStake();
        }

        public function setPayout(money:StatsMoney, tween:Boolean):void
        {
            if (!money.empty && !tween) Payout.ME.blinkWonMoney();
            Payout.ME.update(money, tween);
        }

        private var isOnn:Boolean;

        public function get isOn():Boolean
        {
            return this.isOnn;
        }

        public function getState():int
        {
            return ButtonPanel.ME.playButton.phase;
        }

        public function setState(state:int, on:Boolean = true, blink:Boolean = true):void
        {
            if (CardPanel.ME.bingoAnima.isRunning)
            {
                state = PLAY;
                on = false;
            }

            this.isOnn = false;

            this.state = state;

            var end:Boolean = false;
            var interval:Boolean = false;

            var key:String = "";
            var delay:Number = 5;

            ButtonPanel.ME.playButton.visible = true;
            ButtonPanel.ME.extraButton.visible = false;

            ButtonPanel.ME.playButton.assignKeys([Keyboard.DOWN, Keyboard.ENTER, Keyboard.NUMPAD_ENTER, Keyboard.SPACE]);
            ButtonPanel.ME.extraButton.assignKeys([]);

            switch (state)
            {
                case PLAY:
                    interval = on;
                    key = "HitPlay";
                    delay = 8;
                    ButtonPanel.ME.state = ButtonPanel.NONCANCELLABLE;
                    // if (on) Utils.printStackTrace();
                    ButtonPanel.ME.payout.setLed(on);
                    if(on) ButtonPanel.ME.freeTag.update();
//					showAuto = true;
                    break;
                case EXTRA:
                    end = on;
                    key = "HitExtra";
                    ButtonPanel.ME.state = ButtonPanel.CANCELLABLE;

                    ButtonPanel.ME.playButton.visible = false;
                    ButtonPanel.ME.extraButton.visible = true;

                    ButtonPanel.ME.playButton.assignKeys([]);
                    ButtonPanel.ME.extraButton.assignKeys([Keyboard.DOWN, Keyboard.ENTER, Keyboard.NUMPAD_ENTER, Keyboard.SPACE]);

                    break;
                case SUPER:
                    end = on;
                    key = "HitSuper";
                    ButtonPanel.ME.state = ButtonPanel.CANCELLABLE;
                    break;
                case HALT:
                    haltCalled = true;
                    key = "HitNext";
                    ButtonPanel.ME.state = ButtonPanel.NONCANCELLABLE;
                    break;
                case PEEL:
                    end = false;
                    key = "HitPeel";
                    ButtonPanel.ME.state = ButtonPanel.CANCELLABLE;
                    break;
                case BONUS:
                    key = "HitBonus";
                    delay = 0;
                    ButtonPanel.ME.state = ButtonPanel.NONCANCELLABLE;
                    AutoPlayPanel.ME.cancelAutoPlay();
                    break;
            }

            ButtonPanel.ME.extraButton.phase = state;
            ButtonPanel.ME.extraButton.turn(on);

            ButtonPanel.ME.playButton.phase = state;
            ButtonPanel.ME.playButton.turn(on);
            this.isOnn = interval;

            ButtonPanel.ME.endButton.turn(end);

            ButtonPanel.ME.stakesButton.turn(interval);

            if (on)
            {
                AutoPlayController.ME.onButtonEnabled(state == PLAY || state == HALT, state == EXTRA || state == SUPER || state == BONUS, state == PEEL,
                        MentonEngine.ME.round && MentonEngine.ME.round.extraStake ? MentonEngine.ME.round.extraStake.cash > 0 : false);
            }
        }
    }
}
