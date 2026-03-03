package com.assukar.praia.menton.components.particles
{
	import com.assukar.view.starling.Component;
	/**
	 * @author Johnatan
	 */
	public class ParticlesLayer
	extends Component
	{
		// singleton
		static public var ME: ParticlesLayer;
		public function ParticlesLayer()
		{
			ME = singleton(ME);
			starsParticle = new MentonParticle("Stars", this, 200, 300);
			
		}
		override public function dispose(): void
		{
			if(starsParticle) starsParticle.stop();
			starsParticle = null;
			super.dispose();			
			ME = null;
		}
		
		public var starsParticle: MentonParticle;

		override protected function draww(): void
		{
		}
	}
}