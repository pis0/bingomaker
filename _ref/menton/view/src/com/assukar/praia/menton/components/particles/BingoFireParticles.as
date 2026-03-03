package com.assukar.praia.menton.components.particles
{
	import com.assukar.airong.ds.LinkedList;
	import com.assukar.praia.menton.components.cards.Cardd;
	import flash.geom.Point;

	/**
	 * @author Johnatan
	 */
	public class BingoFireParticles
	{
		private var index	:int;
		private var index2	:int;
		
		private var cardd	:Cardd;
		
		private var particle1 :MentonParticleFactory;
		private var particle2 :MentonParticleFactory;
		
		private var pos1	:Point;
		private var pos2	:Point;
		
		private var delayCall	:uint;
		
		function BingoFireParticles(card: Cardd)
		{
			this.cardd = card;			
			particle1 = new MentonParticleFactory("BingoFire", cardd, 161, 66);
			particle2 = new MentonParticleFactory("BingoFire2", cardd, 161, 66);
			pos1 = new Point();
			pos2 = new Point();
		}		
		
		public function start():void
		{
			index = 0;
			index2 = 0;
			loop();
			loop2();
		}
		
		
		private var particles: LinkedList = new LinkedList();
		
		private function loop():void
		{
			if(index<0) return;
			
			if(index%2==0)
			{
				pos1.x = Math.random()*300;	
			}
			else
			{
				pos1.x = Math.random()*-300;
			}
			
			if(index%3==0)
			{
				pos1.y = Math.random()*140;	
			}
			else
			{
				pos1.y = Math.random()*-140;
			}
									
			var particle:MentonParticle = particle1.produce();
			
			particle.setEmitter(pos1.x,pos1.y);
			particle.start(.4);
			
			particles.push(particle);
			
			index++;
			delayCall = juggler.delayCall(loop, .4);
		}
		private function loop2():void
		{
			if(index2<0) return;
			
			if(index2%2==0)
			{
				pos2.x = Math.random()*-300;	
			}
			else
			{
				pos2.x = Math.random()*300;
			}
			
			if(index%3==0)
			{
				pos2.y = Math.random()*-140;	
			}
			else
			{
				pos2.y = Math.random()*140;	
			}
						
			
			var particle:MentonParticle = particle2.produce();
			
			particle.setEmitter(pos2.x,pos2.y);
			particle.start(.3);
			
			particles.push(particle);
			
			index2++;
			delayCall = juggler.delayCall(loop2, .3);
		}
		
		public function stop():void
		{
			juggler.removeByID(delayCall);
			
			index = -1;
			index2 = -1;
			
			while (!particles.empty) MentonParticle(particles.removeFirst()).stop();
		}
	}
}
