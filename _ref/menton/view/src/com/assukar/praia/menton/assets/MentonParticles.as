package com.assukar.praia.menton.assets
{
	import com.assukar.airong.utils.Singleton;
	import com.assukar.view.particles.Particles;
	/**
	 * @author Johnatan
	 */
	public class MentonParticles extends Particles
	{
		// singleton
		static public const ME: MentonParticles = new MentonParticles();

		function MentonParticles()
		{
			Singleton.enforce(ME);
		}
	}
}
