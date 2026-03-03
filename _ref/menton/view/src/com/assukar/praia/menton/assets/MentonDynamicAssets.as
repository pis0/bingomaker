package com.assukar.praia.menton.assets
{
    import com.assukar.airong.utils.Singleton;
    import com.assukar.praia.assets.BaseDynamicAssets;
    import com.assukar.view.assets.Assets;
    
    public class MentonDynamicAssets extends BaseDynamicAssets
    {
        static public var ME:MentonDynamicAssets;

        override public function dispose():void
        {
            super.dispose();
            ME = null;
        }

        function MentonDynamicAssets(baseAssets:Assets)
        {
            super(baseAssets);

            ME = Singleton.enforce(ME, this);
            createAssets();
        }

        private function createAssets():void
        {
            roundedGradientBox("howToPlayBox", [0x6c972c, 0x185813], 380, 134, 20, false);
            drawCircle("howToPlayTip", 0xffFFff, 4);
        }
    }
}