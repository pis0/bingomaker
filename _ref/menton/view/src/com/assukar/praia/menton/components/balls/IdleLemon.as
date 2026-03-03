package com.assukar.praia.menton.components.balls
{
	import com.assukar.praia.menton.assets.MentonAssets;
	import com.assukar.praia.menton.components.particles.MentonParticle;
	import com.assukar.view.starling.Component;

import flash.display3D.Context3DBlendFactor;

import starling.animation.Transitions;
	import starling.display.Image;
	import starling.display.Quad;
	import starling.textures.TextureSmoothing;
	
	/**
	 * @author Diogo
	 */
	public class IdleLemon extends Component
	{
		private var radius:Number;
		private var speed:Number;
		private var xcenter:Number;
		private var ycenter:Number;
		private var degree:Number;
		
		private var flag:Boolean;
		
		private var lemon:Image;
		
		private var bubblesParticle:MentonParticle;
		
		private var container:Component;
		private var maskk:Quad;
		
		override protected function draww():void
		{
			var bg:Image = addImage(MentonAssets.ME.texture("pipoqueirasuco"), {centerPivots: true});
			
			lemon = addImage(MentonAssets.ME.texture("pipoqueiralimao"), {name: "lemon", centerPivots: true, smoothing: TextureSmoothing.BILINEAR}, {x: bg.x + 13, y: bg.y + 1});
			
			maskk = addQuad(96, 95, 0xff00ff, {x: -36, y: -48, alpha: .2, name: "maskk"});
			
			container = addComp(Component, {x: maskk.x, y: maskk.y});
			
			xcenter = lemon.x;
			ycenter = lemon.y;
			degree = 0;
			
			flag = false;
			
			bubblesParticle = new MentonParticle("menton_pipoqueira_bbl", container);
			
			container.mask = maskk;
		}
		
		override public function dispose():void
		{
			if (bubblesParticle.particle) bubblesParticle.particle.stop(true);
			
			//bubblesParticle.stop(); 
			//bubblesParticle = null;
			
			super.dispose();
		}
		
		//override public function playParticles(... animas:*):void
		public function playParticles(... animas:*):void
		{
			if (flag) return;
			
			bubblesParticle.start();
			bubblesParticle.particle.blendFactorDestination = Context3DBlendFactor.ONE;
			
			radius = 2;
			speed = 2;
			//			direction = Math.round(Math.random());
			
			flag = true;
			
			loop();
		}
		
		private function loop():void
		{
			juggler.tween(lemon, 2.2, {y: ycenter + 3, transition: Transitions.LINEAR, onComplete: function():void
			{
				juggler.tween(lemon, 2.2, {y: ycenter - 3, transition: Transitions.LINEAR, onComplete: loop});
			}});
			
			juggler.tween(lemon, 3, {rotation: Math.random() * .8, transition: Transitions.LINEAR});
		}
		
		//override public function stopParticles(... animas:*):void
		public function stopParticles(... animas:*):void
		{
			juggler.removeTweens(lemon);
			
			bubblesParticle.stop();
			flag = false;
		}
	}
}