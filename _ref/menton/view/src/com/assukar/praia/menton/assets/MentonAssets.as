package com.assukar.praia.menton.assets
{
	import com.assukar.airong.utils.Singleton;
	import com.assukar.view.assets.Assets;

	public class MentonAssets extends Assets
	{
		// singleton
		static public const ME: MentonAssets = new MentonAssets();

		function MentonAssets()
		{
			Singleton.enforce(ME);
			super("menton");
		}
        
        override public function dispose(forceDispose: Boolean = false):void
        {
            disposeDynamicAssets();
            super.dispose(forceDispose);
        }
        
        public function createDynamicAssets():void
        {
            MentonDynamicAssets.ME = new MentonDynamicAssets(super);
        }
        
        public function disposeDynamicAssets():void
        {
            if (MentonDynamicAssets.ME) MentonDynamicAssets.ME.dispose();
        }
	}
}