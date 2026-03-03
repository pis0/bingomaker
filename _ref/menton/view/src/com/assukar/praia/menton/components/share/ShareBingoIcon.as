package com.assukar.praia.menton.components.share
{
	import com.assukar.praia.menton.assets.MentonAssets;
	import com.assukar.view.starling.Component;
	import starling.textures.TextureSmoothing;

	/**
	 * @author user
	 */
	public class ShareBingoIcon extends Component {
		public function ShareBingoIcon() {
			addImage(MentonAssets.ME.texture("menton_share2"), {smoothing:TextureSmoothing.BILINEAR});
		}
			
	}
}
