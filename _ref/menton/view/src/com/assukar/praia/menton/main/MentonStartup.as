package com.assukar.praia.menton.main
{
	import starling.core.Starling;
	import starling.display.Sprite;

	import com.assukar.airong.utils.Statics;
	import com.assukar.airong.utils.Utils;
	import com.assukar.domain.domain.PlayerInfo;
	import com.assukar.domain.domain.Stats;
	import com.assukar.domain.domain.StatsMoney;
	import com.assukar.domain.domain.UserInfo;
	import com.assukar.domain.domain.i18n.Locale;
	import com.assukar.domain.services.dictio.Dictio;
	import com.assukar.domain.services.props.AssukarPropsController;
	import com.assukar.domain.services.skulls.SkullNavigationServices;
	import com.assukar.praia.assets.CommonAssetEmbeds;
	import com.assukar.praia.assets.Fonts;
	import com.assukar.praia.assets.PraiaCommonAssets;
	import com.assukar.praia.assets.imports.CommonAssetsManager;
	import com.assukar.praia.assets.imports.CommonImportEvents;
	import com.assukar.praia.domain.PraiaPlayerInfo;
	import com.assukar.praia.main.PraiaContext;
	import com.assukar.praia.menton.assets.MentonAssets;
	import com.assukar.praia.menton.assets.MentonParticlesEmbeds;
	import com.assukar.praia.menton.assets.imports.AssetsManagerMenton;
	import com.assukar.praia.menton.assets.imports.MentonSyncSoundsSwf;
	import com.assukar.praia.menton.assets.imports.MentonSyncSpritesSwf;
	import com.assukar.praia.profiles.StartupProfile;
	import com.assukar.praia.services.i18n.PraiaLocaleManager;
	import com.assukar.praia.services.security.PraiaSecurityManager;
	import com.assukar.praia.services.stats.PraiaMainStats;
	import com.assukar.praia.skulls.PraiaSkullHudServices;
	import com.assukar.praia.skulls.PraiaSkullPlatformServices;
	import com.assukar.praia.skulls.StaticDictio_en_US;
	import com.assukar.praia.sounds.PraiaSounds;
	import com.assukar.view.sounds.Sounds;
	import com.assukar.view.starling.Component;
	import com.assukar.view.starling.main.Startup;

	import flash.events.Event;
	import flash.geom.Rectangle;
	

	[SWF(width="760", height="1024", frameRate="60", backgroundColor="#eeeeee")]
	public class MentonStartup extends Startup
	{
		function MentonStartup()
		{
			var profile: StartupProfile = new StartupProfile();
			profile.initiate();
			PraiaContext.ME.platformServices = new PraiaSkullPlatformServices(profile);
			PraiaSkullPlatformServices(PraiaContext.ME.platformServices).profile = profile;
			PraiaSounds.ME;
			super();
			if (!stage) addEventListener(Event.ADDED_TO_STAGE, hasStage, false, 0, true);
		}
		
		private function hasStage(e:Event):void
		{
			removeEventListener(Event.ADDED_TO_STAGE, hasStage);
			super.start(stage);
		}
				
		static public function initiateMenton(spritee: Sprite): void
		{
			CommonAssetsManager.ME.startupMode = true;
			Starling.current.showStats = true;
			
			Statics.STAGE_WIDTH = Statics.INITIAL_RECT.width;
			Statics.STAGE_HEIGHT = Statics.INITIAL_RECT.height;
			
			PraiaLocaleManager.ME;
			
			PraiaContext.ME.hudServices = new PraiaSkullHudServices();
			PraiaContext.ME.navigator = new SkullNavigationServices();		

/*
			PraiaPlayerInfo.ME.uinfo = new UserInfo();
			PraiaPlayerInfo.ME.uinfo.pid = Utils.props().asInt("pid");
			PraiaPlayerInfo.ME.uinfo.firstName = Utils.props().asString("first_name");
			PraiaPlayerInfo.ME.uinfo.lastName = Utils.props().asString("last_name");
			PraiaPlayerInfo.ME.groupLocale = Locale.pt_BR;
*/
			new PraiaPlayerInfo(true);
			PlayerInfo.ME = PraiaPlayerInfo.ME = new PraiaPlayerInfo();
			PraiaPlayerInfo.ME.uinfo = new UserInfo();
			PraiaPlayerInfo.ME.uinfo.pid = Utils.props().asInt("pid");
			PraiaPlayerInfo.ME.uinfo.firstName = Utils.props().asString("first_name");
			PraiaPlayerInfo.ME.uinfo.lastName = Utils.props().asString("last_name");
			PraiaPlayerInfo.ME.groupLocale = Locale.pt_BR;

			StaticDictio_en_US.load();

			PraiaSounds.ME;

			AssetsManagerMenton.ME.wakeup();
			CommonAssetsManager.ME.wakeup();

			CommonImportEvents.syncSprites = CommonAssetEmbeds;
			CommonImportEvents.eventDispatcher.dispatchEvent(CommonImportEvents.SYNC_SPRITES);

			new MentonSyncSpritesSwf();
			new MentonSyncSoundsSwf();
			new MentonParticlesEmbeds();

			PraiaCommonAssets.ME.loadAtlases();
			MentonAssets.ME.loadAtlases();
			Fonts.start();
			
			PraiaCommonAssets.ME.loadBitmapFonts(PraiaCommonAssets.MENTON);

			Utils.setPropsController(new AssukarPropsController());

			PraiaMainStats.ME.reset(new Stats(new StatsMoney(1000, 10000)));

			var view: MentonView = new MentonView();
			var comp: Component = view.createComponent() as Component;

			MentonController.ME.startupMode = true;
			MentonController.ME.preConnect();

			spritee.addChild(comp.draw());

			MentonController.ME.setView(view);
			MentonController.ME.start();
			
			Sounds.ME.muteSounds();
			PraiaSounds.ME.muteSounds();
			
//			setInterval(dump, 10000);
		}
		
//		static private function dump(): void
//		{
//			Utils.print(StarlingUtils.dumpChildren(Menton.ME));
//		}		

//		private function clickHandler(c: TouchableComponent, e: Touch): void
//		{
//			if (RoundController.ME.peeling)
//			{
//				RoundController.ME.peel();
//			}
//			else if (RoundController.ME.processing)
//			{
//				if (RoundController.ME.haltedForUser)
//				{
//					RoundController.ME.resume();
//				}
//			}
//			else if (RoundController.ME.extraAvailable)
//			{
//				MentonEngine.ME.callExtra();
//			}
//			else if (RoundController.ME.superExtraAvailable)
//			{
//				MentonEngine.ME.callExtra();
//			}
//			else
//			{
//				MentonEngine.ME.newRound.baseStakeCoins = 1;
//				MentonEngine.ME.callNewRound();
//			}
//		}

		override protected function callbackContext3DCreate(event: Event): void
		{
			initiateMenton(sprite);
//			ButtonPanel.ME.PRESS.listen(clickHandler);
			super.callbackContext3DCreate(event);
		}

		override protected function initiate(): void
		{
			PraiaSecurityManager.ME.allowAllDomains();

			Dictio.initiate();
		}

		override protected function getViewPortRectangle(): Rectangle
		{
			return Statics.INITIAL_RECT;
		}
	}
}

