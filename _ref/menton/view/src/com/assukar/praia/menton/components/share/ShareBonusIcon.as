package com.assukar.praia.menton.components.share
{
	import com.assukar.praia.menton.assets.MentonAssets;
	import com.assukar.view.starling.Component;
	import starling.textures.TextureSmoothing;

	/**
	 * @author user
	 */
	public class ShareBonusIcon extends Component {
		public function ShareBonusIcon() {
			addImage(MentonAssets.ME.texture("menton_share1"), {smoothing:TextureSmoothing.BILINEAR});
		}

			
	}
}
