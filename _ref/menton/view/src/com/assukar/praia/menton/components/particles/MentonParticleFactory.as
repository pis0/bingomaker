package com.assukar.praia.menton.components.particles
{
	import com.assukar.view.starling.Component;
	/**
	 * @author Johnatan
	 */
	public class MentonParticleFactory
	{
		private var name: String;
		private var parent: Component;
		private var x: int, y: int;
		
		public function produce(): MentonParticle
		{
			return new MentonParticle(name, parent, x, y);
		}
		
		public function MentonParticleFactory(name: String, parent: Component, x: int = 0, y: int = 0)
		{
			this.name = name;
			this.parent = parent;
			this.x = x;
			this.y = y;
		}		
	}
}
