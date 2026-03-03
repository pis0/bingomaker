package com.assukar.praia.menton.assets.imports {
import com.assukar.airong.utils.Singleton;
import com.assukar.praia.assets.PraiaCommonAssets;
import com.assukar.praia.menton.assets.MentonAssets;
import com.assukar.praia.menton.assets.MentonParticles;
import com.assukar.praia.services.navigation.Screens;
import com.assukar.view.assets.SoundEmbeds;

import flash.events.Event;

public class AssetsManagerMenton {
    static public const ME:AssetsManagerMenton = new AssetsManagerMenton();

    function AssetsManagerMenton() {
        Singleton.enforce(ME);
        ImportEventsMenton.eventDispatcher.addEventListener(ImportEventsMenton.SYNC_SOUNDS.type, loadSyncSounds);
        ImportEventsMenton.eventDispatcher.addEventListener(ImportEventsMenton.SYNC_SPRITES.type, loadSyncSprites);

        loadSounds();
        if (ImportEventsMenton.syncSprites) loadSyncSprites(null);

//			if(PraiaContext.ME.mobile) MentonParticles.ME.load(MentonParticlesEmbeds);
    }

    public function wakeup():void {
    }

    public function loadSounds():void {
        if (ImportEventsMenton.syncSounds) loadSyncSounds(null);
    }

    public function unload():void {
        SoundEmbeds.ME.dispose("Menton");
        MentonAssets.ME.unloadBitmapFonts(PraiaCommonAssets.MENTON);
        MentonAssets.ME.dispose();
        MentonParticles.ME.dispose();
    }

    private function loadSyncSounds(e:Event):void {
        SoundEmbeds.ME.registerFromClass("Menton", ImportEventsMenton.syncSounds);
    }

    private function loadSyncSprites(e:Event):void {
        Screens.MENTON.isAsyncAssetComplete = true;
//			MentonAssets.ME.setTextureClass(ImportEventsMenton.syncSprites);
//            MentonAssets.ME.setTextureClassIgnoreFonts(ImportEventsMenton.syncSprites, PraiaCommonAssets.MENTON);
        MentonParticles.ME.load(ImportEventsMenton.particles);
//            MentonAssets.ME.loadBitmapFonts(PraiaCommonAssets.MENTON);
    }
}
}
