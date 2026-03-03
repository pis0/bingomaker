package com.assukar.praia.menton.components.bonus
{
    import com.assukar.airong.utils.Utils;
    import com.assukar.domain.services.bi.BIAnalEngine;
    import com.assukar.engine.analytics.AnalEvent;
    import com.assukar.engine.analytics.Analytics;
    import com.assukar.praia.controllers.AutoPlayController;
    import com.assukar.praia.domain.share.ShareContext;
    import com.assukar.praia.main.PraiaContext;
    import com.assukar.praia.menton.assets.MentonAssets;
    import com.assukar.praia.menton.assets.SoundID;
    import com.assukar.praia.menton.components.bonus.boxGame.BonusCardGame;
    import com.assukar.praia.menton.components.bonus.cardGame.BonusBoxGame;
    import com.assukar.praia.menton.components.share.ShareBonusIcon;
    import com.assukar.praia.menton.controllers.RoundMotion;
    import com.assukar.praia.menton.domain.FeteDuCitroinBonusSession;
    import com.assukar.praia.menton.domain.SlotBonusSession;
    import com.assukar.praia.services.navigation.Screens;
    import com.assukar.view.sounds.Sounds;
    import com.assukar.view.starling.AssukarJuggler;
    import com.assukar.view.starling.Component;

    import starling.display.BlendMode;

    public class BonusGame
	extends Component
	{
		private var cardGame:BonusCardGame;
		private var boxGame:BonusBoxGame;
		private var mSession:FeteDuCitroinBonusSession;
		
		// singleton
		static public var ME : BonusGame;
		public function BonusGame()
		{
			ME = singleton(ME);
		}

		override public function dispose() : void
		{
			destroyCall("collectBonus");
			super.dispose();
			ME = null;
		}
		
		public function init(bonusSession : FeteDuCitroinBonusSession):void
		{
            // Analytics //
            BIAnalEngine.ME.getSession().withIncrementInt("BONUS");
            Analytics.ME.track(new AnalEvent("BONUS_AMP", BIAnalEngine.ME.getSession().sessionStart)
                    .withParam("click_count", BIAnalEngine.ME.getSession().getParam("BONUS"))
                    .withParam("primary", PraiaContext.ME.navigator.primary.gamee.id)
                    .withParam("timestamp", Utils.timestamp()));

            mSession = bonusSession;
			
			cardGame.countCards = 0;
			cardGame.maxCardsOpen = mSession.remainingCardsToPick;
			cardGame.init(mSession);
			cardGame.resetCards();
			cardGame.enableCards();
			cardGame.callbackFinish = finishChoiceCards;
			
			show(cardGame);
			hide(boxGame);
			
			Sounds.ME.stopMusic();
			Sounds.ME.setMusicVolume(.6);
			Sounds.ME.playMusic(SoundID.BONUS_LOOP, null, int.MAX_VALUE);
			
			AutoPlayController.ME.disableAutoPlay();
		}
		
		
		override protected function draww() : void
		{
			this.touchable = true; 
			addImage(MentonAssets.ME.texture("bgbonus"), {blendMode: BlendMode.NONE});
			cardGame = addComp(BonusCardGame, { x:20, y:300 } );
			boxGame = addComp(BonusBoxGame, { x:0, y:0 } );	
		}
		
		private function finishChoiceCards():void
		{
			AssukarJuggler.ME.delayCall(cardGame.bombCards, 1);
			AssukarJuggler.ME.delayCall(showBoxGame, 2);
		}
		
		private function showBoxGame():void
		{
			boxGame.alpha = 0;
			show(boxGame);
			boxGame.init(mSession);
			callBonusWave();
		}
		
		private function checkEndRound():void
		{
//			Utils.wraplog("CHECK END ROUND: " +  mSession.over +  " |" +  mSession.collected)

			if (mSession.over)
			{
				boxGame.sculptures.overSession = true;
				if (!mSession.collected)mSession.collect();
				delayCall2(boxGame.callFinalBonus, 1.5, mSession.payout, onCompleteFinalAnima);
			}
			else
			{
				delayCall2(callBonusWave, 1);
			}	
		}
		
		private function callBonusWave():void
		{
            mSession.walkTreadmill();
			
			AssukarJuggler.ME.tween(cardGame, 0.3, {delay:0.5, alpha:0, onComplete:function():void { cardGame.alpha = 1, hide(cardGame); }} );
			AssukarJuggler.ME.tween(boxGame, 0.3, { alpha:1, onComplete:boxGame.callWave } );
			
			boxGame.updateRounds(mSession.rounds);
			boxGame.endRound = checkEndRound;
			boxGame.resetWeapons(mSession);
		}
		
		private function onCompleteFinalAnima():void
		{
			hide();
			Sounds.ME.stopMusic();
			Sounds.ME.setMusicVolume(.6);
			Sounds.ME.playMusic(SoundID.MENTON_LOOP, null, int.MAX_VALUE);

			if(boxGame)boxGame.removeWeaponsBump();
			if(SlotBonusSession.ME)SlotBonusSession.ME.triggered = false;
            if (isDisposed() || !RoundMotion.ME) return;

			RoundMotion.ME.processEndOfDraws();
			// share
			if (PraiaContext.ME.hudServices.canBotherWithAutomaticPopups())
				PraiaContext.ME.navigator.triggerNonPrimary(Screens.SHARE, null, [ShareBonusIcon, Screens.MENTON, ShareContext.MENTON_BONUS]);
		}
	}
}


