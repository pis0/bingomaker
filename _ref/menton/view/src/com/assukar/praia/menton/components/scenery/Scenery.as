package com.assukar.praia.menton.components.scenery
{
    import com.assukar.praia.menton.assets.MentonAssets;
    import com.assukar.view.starling.Component;
    
    import starling.display.BlendMode;
    import starling.display.Image;
    import starling.textures.TextureSmoothing;
    
    public class Scenery extends Component
    {
        private var mImageFreeSpinBGL:Image;
        private var mImageFreeSpinBGR:Image;
        
        override public function dispose():void
        {
            juggler.removeTweens( mImageFreeSpinBGL );
            juggler.removeTweens( mImageFreeSpinBGR );
            super.dispose();
        }
        
        override protected function draww():void
        {
            
            addImage( MentonAssets.ME.texture( "bgmenton" ), {
                smoothing: TextureSmoothing.NONE, y: 0//
            }, {blendMode: BlendMode.NONE} );
        }
    }
}
