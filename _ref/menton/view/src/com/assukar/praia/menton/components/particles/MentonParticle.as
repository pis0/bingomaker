package com.assukar.praia.menton.components.particles
{
	import starling.events.Event;
	import starling.extensions.PDParticleSystem;

	import com.assukar.praia.menton.assets.MentonParticles;
	import com.assukar.view.starling.Component;

	/**
	 * @author Johnatan
	 */
	public class MentonParticle
	{
		private var name: String;
		private var parent: Component;
		private var x: int, y: int;
		private var particlee: PDParticleSystem;
		private var emitterX: int, emitterY: int;

		public function MentonParticle(name: String, parent: Component, x: int = 0, y: int = 0)
		{
			this.name = name;
			this.parent = parent;
			this.x = x;
			this.y = y;
		}

		private function completeHandler(e: Event): void
		{
			if (!running) return;
			running = false;
			stop();
//			dispose();
		}

		public function pos(x: int, y: int): void
		{
			this.x = x;
			this.y = y;
		}

//		public function dispose(): void
//		{
//			if (particle)
//			{
//				particle.stop(false);
//				particle.removeEventListener(Event.COMPLETE, completeHandler);
//				particle.parent.removeChild(particle);
//				MentonParticles.ME.offerParticle(name, particle);
//				particlee = null;
//			}
//			
//			running = false;
//		}

		public function setEmitter(emitterX: int = 0, emitterY: int = 0): void
		{
			this.emitterX = emitterX;
			this.emitterY = emitterY;

			if (particle)
			{
				particle.emitterX = emitterX;
				particle.emitterY = emitterY;
			}
		}

		private var running: Boolean = false;
		public var addFirst: Boolean = false;

		public function start(duration: Number = Number.MAX_VALUE, delay: Number = 0): void
		{
			if (running) return;
			running = true;

			particlee = MentonParticles.ME.retrieveParticle(name);
			
			this.particlee.name = name;
			particle.addEventListener(Event.COMPLETE, completeHandler);
			if (addFirst) parent.addChildAt(particle, 0);
			else parent.addChild(particle);

			particle.x = x;
			particle.y = y;

			setEmitter(emitterX, emitterY);

			juggler.add(particle);

			if (delay) juggler.delayCall(particle.start, delay, duration);
			else particle.start(duration);
		}

		public function stop(): void
		{
//			if (particle) particle.stop(clearParticles);
			
			if (particle)
			{
				particle.stop(false);
				particle.removeEventListener(Event.COMPLETE, completeHandler);
				if(particle.parent) particle.parent.removeChild(particle);
//				particle.parent.removeChild(particle, true);
				MentonParticles.ME.offerParticle(name, particle);
				particlee = null;
			}
			
			running = false;			
		}

		public function get particle(): PDParticleSystem
		{
			return this.particlee;
		}
	}
}