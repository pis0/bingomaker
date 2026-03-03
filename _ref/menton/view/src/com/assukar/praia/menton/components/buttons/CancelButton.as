package com.assukar.praia.menton.components.buttons 
{
	import com.assukar.domain.services.dictio.Dictio;
	import com.assukar.praia.assets.Fonts;
    import com.assukar.praia.components.FontResolver;
    import com.assukar.praia.menton.assets.MentonAssets;
import com.assukar.view.starling.AssukarTextField;
import com.assukar.view.starling.TouchableComponent;
import com.assukar.view.starling.images.AssukarImage;

/**
	 * ...
	 * @author Caian Seiki Murakawa
	 * @date 10/08/2015
	 */
	public class CancelButton 
	extends TouchableComponent 
	{
		public function CancelButton() 
		{
			super();
		}
		
		override public function dispose() : void
		{
			super.dispose();
		}
		
		override protected function draww() : void
		{
			var bg:AssukarImage = addImage(MentonAssets.ME.texture("btplay_idle"));
			var label:AssukarTextField = addText(220, bg.height - 40, Dictio.upper("autocancel"), FontResolver.ME.resolveFontName(Fonts.CLARENDON_BLKBT), {color: 0xffffff, fontSize: 50, x:30}, {resizeOffset: true});
			label.centerYRelativeTo = bg;
		}
		
	}
}