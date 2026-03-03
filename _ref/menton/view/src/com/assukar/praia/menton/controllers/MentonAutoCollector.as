package com.assukar.praia.menton.controllers
{
	import com.assukar.praia.domain.gameevents.PraiaGameEvents;
	import com.assukar.praia.menton.components.cards.CardPanel;
	import com.assukar.domain.domain.StatsMoney;
	import com.assukar.praia.controllers.AutoCollector;
	import com.assukar.praia.menton.assets.SoundID;
	import com.assukar.praia.menton.components.buttons.payout.BgPayout;
	import com.assukar.praia.menton.components.buttons.payout.Payout;
import com.assukar.praia.services.navigation.WebScreens;
import com.assukar.view.sounds.Sounds;

	/**
	 * @author Johnatan
	 */
	public class MentonAutoCollector
	extends AutoCollector
	{
		override protected function notifyStart(loops : int, interval : Number, money : StatsMoney) : void
		{
			PraiaGameEvents.MENTON_PAYOUT.dispatch(money.cashOnly ? money.cash : money.coins).securedRelay(WebScreens.ME.gameEventRelay, {
				payout: money.toObject()
			})
			
			Payout.ME.update(money, false);
			Payout.ME.collectingLeds(money.objects);
			
			Sounds.ME.playFx(SoundID.COINS_COLLECT, null, 1, Sounds.SOUND_TRANSFORM_VOLUME_50);
			juggler.delayCall(function(): void
			{
				Sounds.ME.stopFx(SoundID.COINS_COLLECT);
			}, loops*interval);
			
			
		}
		
		override public function enablePlay(beginning: Boolean): void
		{
			if (beginning && !CardPanel.ME.bingoAnima.isRunning) ButtonsController.ME.setState(ButtonsController.PLAY);
		}

		override public function updatePayout(money : StatsMoney) : void
		{
			Payout.ME.update(money, false, false);
		}

		override public function notifyEnd() : void
		{
			Payout.ME.stopBlink(BgPayout.OFF);
		}
		
		override public function expedite() : void 
		{
			Payout.ME.stopBlink(BgPayout.OFF);
			Sounds.ME.stopFx(SoundID.COINS_COLLECT);
		}
	}
}