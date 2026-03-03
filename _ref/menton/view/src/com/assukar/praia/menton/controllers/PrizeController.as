package com.assukar.praia.menton.controllers
{
	import com.assukar.airong.ds.Cursor;
	import com.assukar.airong.utils.Singleton;
	import com.assukar.domain.domain.i18n.Locale;
	import com.assukar.praia.domain.share.ShareContext;
	import com.assukar.praia.main.PraiaContext;
	import com.assukar.praia.menton.assets.SoundID;
	import com.assukar.praia.menton.components.cards.CardPanel;
	import com.assukar.praia.menton.components.jackpot.JackpotPanel;
	import com.assukar.praia.menton.components.prizes.PrizePanel;
	import com.assukar.praia.menton.components.share.ShareBingoIcon;
	import com.assukar.praia.menton.domain.CardMatches;
	import com.assukar.praia.menton.domain.MentonJackpotSession;
	import com.assukar.praia.menton.domain.Pattern;
	import com.assukar.praia.menton.domain.PatternGroup;
	import com.assukar.praia.menton.main.MentonEngine;
	import com.assukar.praia.services.i18n.PraiaLocaleManager;
	import com.assukar.praia.services.navigation.Screens;
	import com.assukar.praia.sounds.PraiaSounds;
	import com.assukar.view.sounds.Sounds;
	
	/**
	 * @author Johnatan
	 */
	public class PrizeController
	{
		// singleton
		static public var ME:PrizeController;
		
		private const EN:int = 0;
		private const ES:int = 1;
		private const FR:int = 2;
		private const IT:int = 3;
		private const PT:int = 4;
		
		private const LOC_BINGO:Vector.<int> = new <int>[3, 4, 3, 2, 3];
		private const LOC_DOUBLE_BOX:Vector.<int> = new <int>[3, 3, 3, 2, 2];
		private const LOC_JACKPOT:Vector.<int> = new <int>[3, 3, 3, 3, 3];
		private const LOC_DOUBLE_LINE:Vector.<int> = new <int>[4, 3, 3, 3, 5];
		private const LOC_FOUR_COLUMNS:Vector.<int> = new <int>[3, 3, 3, 2, 4];
		private const LOC_THREE_COLUMNS:Vector.<int> = new <int>[3, 2, 3, 3, 3];
		
		public function dispose():void
		{
			ME = null;
		}
		
		public function PrizeController()
		{
			Singleton.enforce(ME);
		}
		
		// object vars
		private var c:Cursor;
		private var p:Pattern;
		
		public function processCardMatches(cardMatches:CardMatches, callback:Function):void
		{
			if (!cardMatches.newPatterns.empty) Sounds.ME.stopFx(SoundID.PEEL);
			
			var delay:Number = getDelayToMotion(cardMatches);
			if (delay) JackpotPanel.ME.delayCall("processNewPatterns", juggler.delayCall(processNewPatterns, delay, cardMatches, callback), false);
			else callback();
		}
		
		private function getDelayToMotion(cardMatches:CardMatches):Number
		{
			if (cardMatches.newPatterns.empty) return 0;
			
			switch (cardMatches.bestNewPattern.group)
			{
			case PatternGroup.LINE: 
			case PatternGroup.DOUBLE_LINE: 
				return 0.8;
				break;
			case PatternGroup.FULL: 
				return 1.5;
				break;
			}
			
			return 0.45;
		}
		
		private function processNewPatterns(cardMatches:CardMatches, callback:Function):void
		{
			//			print(cardMatches);
			p = cardMatches.bestNewPattern;
			//			print(p);
			switch (p)
			{
			case Pattern.LINE_1: 
			case Pattern.LINE_2: 
			case Pattern.LINE_3: 
				Sounds.ME.playFx(SoundID.PRIZE_LINE, null, 1, Sounds.SOUND_TRANSFORM_VOLUME_20);
				callback();
				break;
			case Pattern.DOUBLE_COLUMN_1: 
			case Pattern.DOUBLE_COLUMN_2: 
			case Pattern.DOUBLE_COLUMN_3: 
			case Pattern.DOUBLE_COLUMN_4: 
				Sounds.ME.playFx(SoundID.PRIZE_DOUBLE_COLUMNS, null, 1, Sounds.SOUND_TRANSFORM_VOLUME_20);
				callback();
				break;
			case Pattern.DOUBLE_LINE_1: 
			case Pattern.DOUBLE_LINE_2: 
			case Pattern.DOUBLE_LINE_3: 
				PrizePanel.ME.playMovie(p, callback);
				showJackpotLimit();
				
				Sounds.ME.playFx(SoundID.PRIZE_DOUBLE_LINES, null, 1, Sounds.SOUND_TRANSFORM_VOLUME_20);
				PraiaSounds.ME.playVoice(soundId(SoundID.DOUBLE_LINE, LOC_DOUBLE_LINE));//, null, 1, null);
				
				break;
			case Pattern.TRIPLE_COLUMN_1: 
			case Pattern.TRIPLE_COLUMN_2: 
			case Pattern.TRIPLE_COLUMN_3: 
				PrizePanel.ME.playMovie(p, callback);
				showJackpotLimit();
				
				Sounds.ME.playFx(SoundID.PRIZE_THREE_COLUMNS, null, 1, Sounds.SOUND_TRANSFORM_VOLUME_20);
				PraiaSounds.ME.playVoice(soundId(SoundID.THREE_COLUMNS, LOC_THREE_COLUMNS));//, null, 1, null);
				
				break;
			case Pattern.QUAD_COLUMN_1: 
			case Pattern.QUAD_COLUMN_2: 
				PrizePanel.ME.playMovie(p, callback);
				showJackpotLimit();
				
				Sounds.ME.playFx(SoundID.PRIZE_FOUR_COLUMNS, null, 1, Sounds.SOUND_TRANSFORM_VOLUME_20);
				PraiaSounds.ME.playVoice(soundId(SoundID.FOUR_COLUMNS, LOC_FOUR_COLUMNS));//, null, 1, null);
				
				break;
			case Pattern.QUAD_COLUMN_3: 
				PrizePanel.ME.playMovie(p, callback);
				showJackpotLimit();
				
				Sounds.ME.playFx(SoundID.PRIZE_DOUBLE_BOX, null, 1, Sounds.SOUND_TRANSFORM_VOLUME_20);
				PraiaSounds.ME.playVoice(soundId(SoundID.DOUBLE_BOX, LOC_DOUBLE_BOX));//, null, 1, null);
				
				break;
			case Pattern.FULL:
				
				Sounds.ME.playFx(SoundID.PRIZE_BINGO, null, 1, Sounds.SOUND_TRANSFORM_VOLUME_20);
				if (MentonJackpotSession.ME.isValid(MentonEngine.ME.round))
				{
					if (JackpotPanel.ME)
					{
						JackpotPanel.ME.won();
					}
					PraiaSounds.ME.playVoice(soundId(SoundID.JACKPOT, LOC_JACKPOT));
				}
				else
				{
					PraiaSounds.ME.playVoice(soundId(SoundID.BINGO, LOC_BINGO));
				}
				
				JackpotPanel.ME.delayCall("jackpotPrizeDelay", juggler.delayCall(function():void
				{
					PrizePanel.ME.playMovie(p, function():void
					{
//						PraiaAchievementEvents.MENTON_BINGO.dispatch(true);
						
						callback();
//						CardPanel.ME.resetCardsPositions();
						CardPanel.ME.setPositions();
						
						// share
						if (PraiaContext.ME.hudServices.canBotherWithAutomaticPopups())
						{
							PraiaContext.ME.navigator.triggerNonPrimary(Screens.SHARE, null, [ShareBingoIcon, Screens.MENTON, ShareContext.MENTON_BINGO]);
						}
					});
				}, 2));
				
				break;
			
			default: 
				callback();
				break;
			}
			
			c = cardMatches.missingOnePatterns.cursor;
			while (c.next)
			{
				p = c.current;
				switch (p)
				{
				case Pattern.FULL: 
					showJackpotLimit();
					if (BallController.ME.triggers >= MentonJackpotSession.ME.ballsToJackpot)
					{
						JackpotPanel.ME.turnOff();
					}
					
					break;
				}
			}
		}
		
		private function showJackpotLimit():void
		{
			if (JackpotPanel.ME && BallController.ME.triggers < MentonJackpotSession.ME.ballsToJackpot) JackpotPanel.ME.oneToWin();
		}
		
		private function soundId(baseId:String, vec:Vector.<int>):String
		{
			
			var languageIndex:int = 0;
			switch (PraiaLocaleManager.ME.resolveVoiceLocale().baseLocale)
			{
			case Locale.pt_BR: 
//			case Locale.pt_PT: 
				languageIndex = PT;
				break;
			case Locale.fr_FR: 
				languageIndex = FR;
				break;
			case Locale.es_LA: 
//			case Locale.es_ES: 
//			case Locale.es_CO:
//			case Locale.es_AR:
				languageIndex = ES;
				break;
			case Locale.it_IT: 
				languageIndex = IT;
				break;
			default: 
				languageIndex = EN;
				break;
			}
			
			var locNumber:int = Math.floor(Math.random() * vec[languageIndex]) + 1;
			return baseId.replace("_CLASS", String("_" + locNumber + "_CLASS"));
		
		}
	
	}
}
