package com.assukar.praia.menton.components.buttons 
{
	import com.assukar.domain.services.dictio.Dictio;
	import com.assukar.praia.assets.Fonts;
    import com.assukar.praia.components.FontResolver;
    import com.assukar.praia.components.buttons.CancelAutoPlayButton;
	import com.assukar.praia.menton.assets.MentonAssets;
	import com.assukar.view.starling.AssukarTextField;
	
	/**
	 * ...
	 * @author Caian Seiki Murakawa
	 * @date 10/08/2015
	 */
	public class CancelAutoButton 
	extends CancelAutoPlayButton 
	{
		// Display vars //
		private var mTextAuto : AssukarTextField;
		private var mTextAutoExtra : AssukarTextField;
		
		public function CancelAutoButton() 
		{
			super();
			
		}
		
		override public function dispose() : void
		{
			super.dispose();
		}
		
		override protected function draww() : void 
		{
			addImage(MentonAssets.ME.texture("btplay_idle"));
			mTextAuto = addText(220, 60, Dictio.upper("auto"), FontResolver.ME.resolveFontName(Fonts.CLARENDON_BLKBT), {color: 0xffffff, fontSize: 40, x: 36, y:13}, {resizeOffset: true});
			mTextAutoExtra = addText(230, 60, Dictio.upper("autoextras"), FontResolver.ME.resolveFontName(Fonts.CLARENDON_BLKBT), {color: 0xffffff, fontSize: 38, x:25 , y:13  }, {resizeOffset: true});
			addText(220, 40, Dictio.upper("turnOff"), FontResolver.ME.resolveFontName(Fonts.CLARENDON_BLKBT), { color:0xffffff, fontSize: 20, x: 36, y:60 }, { resizeOffset: true } );//0x9900CC
			
		}
	}
}