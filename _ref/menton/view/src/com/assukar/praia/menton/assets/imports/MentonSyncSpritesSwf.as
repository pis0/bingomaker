package com.assukar.praia.menton.assets.imports
{
    import com.assukar.praia.menton.assets.AssetEmbeds
    import com.assukar.praia.menton.assets.MentonParticlesEmbeds
    
    import flash.display.Sprite
    
    /**
     * @author Johnatan
     */
    public class MentonSyncSpritesSwf extends Sprite
    {
        public function MentonSyncSpritesSwf()
        {
            ImportEventsMenton.particles = MentonParticlesEmbeds;
            
            ImportEventsMenton.syncSprites = AssetEmbeds;
            ImportEventsMenton.eventDispatcher.dispatchEvent(ImportEventsMenton.SYNC_SPRITES);
        }
    }
}
