package com.assukar.praia.menton.components.prizes.movies
{
	import com.assukar.airong.utils.Statics;
	import com.assukar.domain.domain.i18n.Locale;
	import com.assukar.domain.services.dictio.Dictio;
	import com.assukar.praia.domain.PraiaPlayerInfo;
	import com.assukar.praia.menton.assets.MentonAssets;
	import com.assukar.praia.menton.components.particles.MentonParticle;
	import com.assukar.praia.main.PraiaContext;
	import com.assukar.view.starling.Component;
	import com.assukar.view.starling.TouchableComponent;
	import flash.geom.Rectangle;
	import flash.ui.Keyboard;
	import starling.animation.Transitions;
	import starling.core.Starling;
	import starling.display.Image;
	import starling.events.KeyboardEvent;
	import starling.events.Touch;
	import starling.textures.TextureSmoothing;


	/**
	 * @author User
	 */
	public class DoubleLineMovie 
	extends TouchableComponent
	{
		
		override public function dispose() : void
		{
			super.dispose();
		}
		
		public function playMovie(inDelay:Number, outDelay:Number, callback:Function):void
		{
			this.enable();
			
			CHARS_WAIT_TIME = outDelay;
			this.callBack = callback;
			delayCall("start", juggler.delayCall(start, inDelay));
			delayCall("end", juggler.delayCall(endAnimation, CHARS_WAIT_TIME));
		}
		
		private function skipAnim(c : TouchableComponent = null, t : Touch = null) : void
		{
			this.disable();
			
			destroyCall("start");
			destroyCall("end");
			destroyCall("sClouds");
			destroyCall("shine");
			destroyCall("label");
			destroyCall("chareff");
			
			if (cloudsLinesVec)
			{
				for(var i:int = 0 ; i < cloudsLinesVec.length ; i++)
				{
					juggler.removeTweens(cloudsLinesVec[i]);
				}
			}
			
			stopTweens();
			stopBird();
			
			hide(this);
			exit();
		}
		
		override public function disable() : void
		{
			if (!PraiaContext.ME.mobile) Starling.current.stage.removeEventListener(KeyboardEvent.KEY_DOWN, onKeyDown);
			super.disable();
		}
		
		override public function enable() : void
		{
			if (!PraiaContext.ME.mobile) Starling.current.stage.addEventListener(KeyboardEvent.KEY_DOWN, onKeyDown);
			super.enable();
		}
		
		private function onKeyDown(key: KeyboardEvent): void
		{
			if ( key.keyCode == Keyboard.DOWN || key.keyCode == Keyboard.SPACE || key.keyCode == Keyboard.ENTER || key.keyCode == Keyboard.NUMPAD_ENTER )
			{
				this.RELEASE.dispatch(this, null);
			}
        }
        //
		private var bg:Rectangle;
		private var CHARS_WAIT_TIME:int = 7;
		private var callBack:Function;
		
		private function start():void
		{
			createBird();
		}
		
		override protected function draww() : void
		{
			bg = new Rectangle(0, 0, Statics.STAGE_WIDTH, Statics.STAGE_HEIGHT);
			
			this.RELEASE.listen(skipAnim);
		}
		
		// bird
		private var lines:Component;
		private var bird1:Component;
		private var bird2:Component;
		private var birdMoveTime:Number = 1;
		
		private function createBird() : void
		{
			lines = addComp();
			lines.addImage(MentonAssets.ME.texture("ld_line"), {x:164, y:205, smoothing:TextureSmoothing.TRILINEAR});
			lines.addImage(MentonAssets.ME.texture("ld_line"), {x:164, y:301, smoothing:TextureSmoothing.TRILINEAR});
			
			bird1 = addComp(Component, {centerPivots:true, x:120, y:238});
			bird1.addComp(new Bird(false), {x:-120, centerPivots:true}, {alpha:.2});
			bird1.addComp(new Bird(true), {x:-80, centerPivots:true}, {alpha:.6});
			bird1.addComp(new Bird(false), {centerPivots:true});
			
			bird2 = addComp(Component, {centerPivots:true, x:0, y:337});
			bird2.addComp(new Bird(true), {x:-120, centerPivots:true}, {alpha:.2});
			bird2.addComp(new Bird(false), {x:-80, centerPivots:true}, {alpha:.6});
			bird2.addComp(new Bird(true), {centerPivots:true});
			moveBird();
		}
		
		private function moveBird() : void
		{
			bird1.x = 123;
			bird2.x = 173;
			juggler.tween(bird1, birdMoveTime, {x:950});
			juggler.tween(bird2, birdMoveTime, {x:900, onComplete:createClouds });
		}
		
		private function stopBird() : void
		{
			juggler.removeTweens(bird1);
			juggler.removeTweens(bird2);
			hide(lines);
			hide(bird1, bird2);
		}
		
		// clouds
		private var clouds:Component;
		private var shine1:Component;
		private var shine2:Component;
		private var leftCloud:Image;
		private var rightCloud:Image;
		private var cloudsLinesVec:Vector.<Image>;
		private var invertShine:Boolean;
		private var cloudsON:Boolean;
		
		
		private function createClouds() : void
		{
			stopBird();
			clouds = addComp(Component, {x:55, y:57});
			cloudsLinesVec = new Vector.<Image>();
			
			cloudsLinesVec.push(
				clouds.addImage(MentonAssets.ME.texture("ld_neon_a"),{alpha:0}),
				clouds.addImage(MentonAssets.ME.texture("ld_neon_b"),{alpha:0}),
				clouds.addImage(MentonAssets.ME.texture("ld_neon_c"),{alpha:0}),
				clouds.addImage(MentonAssets.ME.texture("ld_neon_d"),{alpha:0}),
				clouds.addImage(MentonAssets.ME.texture("ld_neon_e"),{alpha:0}),
				clouds.addImage(MentonAssets.ME.texture("ld_neon_f"),{alpha:0}),
				clouds.addImage(MentonAssets.ME.texture("ld_neon_g"),{alpha:0}),
				clouds.addImage(MentonAssets.ME.texture("ld_neon_h"),{alpha:0}),
				clouds.addImage(MentonAssets.ME.texture("ld_neon_i"),{alpha:0}),
				clouds.addImage(MentonAssets.ME.texture("ld_neon_j"),{alpha:0}),
				clouds.addImage(MentonAssets.ME.texture("ld_neon_k"),{alpha:0}),
				clouds.addImage(MentonAssets.ME.texture("ld_neon_l"),{alpha:0}),
				clouds.addImage(MentonAssets.ME.texture("ld_neon_m"),{alpha:0}),
				clouds.addImage(MentonAssets.ME.texture("ld_neon_n"),{alpha:0}),
				clouds.addImage(MentonAssets.ME.texture("ld_neon_o"),{alpha:0}),
				clouds.addImage(MentonAssets.ME.texture("ld_neon_p"),{alpha:0}),
				clouds.addImage(MentonAssets.ME.texture("ld_neon_q"),{alpha:0})
			);
			
			for(var i:int = 0 ; i < cloudsLinesVec.length ; i++)
			{
				juggler.tween(cloudsLinesVec[i], 0, {alpha:1, delay:i/cloudsLinesVec.length});
			}
			
			shine1 = addComp(Component,{alpha:0, x:59, y:51});
			shine2 = addComp(Component,{alpha:0, x:59, y:51});
			
			shine1.addImage(MentonAssets.ME.texture("ld_leds_left_01"), {x:126, y:113});
			shine1.addImage(MentonAssets.ME.texture("ld_leds_right_01"), {x:447, y:113});

			shine2.addImage(MentonAssets.ME.texture("ld_leds_left_02"), {x:126, y:113});
			shine2.addImage(MentonAssets.ME.texture("ld_leds_right_02"), {x:447, y:113});
			
			leftCloud = clouds.addImage(MentonAssets.ME.texture("ld_cloud"), {x:56, y:239});
			rightCloud = clouds.addImage(MentonAssets.ME.texture("ld_cloud"), {x:576, y:69, scaleX:-1});
			
			juggler.tween(leftCloud, CHARS_WAIT_TIME - 2, {x:0});
			juggler.tween(rightCloud, CHARS_WAIT_TIME - 2, {x:615});
			
			delayCall("sClouds", juggler.delayCall(animateClouds, 1));
			delayCall("shine", juggler.delayCall(animateShine, 1));
			delayCall("label", juggler.delayCall(showLabel, 1));
		}
		
		private function animateClouds() : void
		{
			cloudsON = !cloudsON;
			
			if ( cloudsON )
			{
				hide(clouds);
				delayCall("aClouds", juggler.delayCall(animateClouds, .1));
			}
			else
			{
				show(clouds);
				delayCall("aClouds", juggler.delayCall(animateClouds, (Math.random() * 10) / 10));
			}
		}
		
		private function animateShine() : void
		{
//			stopClouds();
			invertShine = !invertShine;
			
			if ( invertShine )
			{
				juggler.tween(shine1, 0, {alpha:1, delay:.2});
				juggler.tween(shine2, 0, {alpha:0, delay:.2, onComplete:animateShine});
			}
			else
			{
				juggler.tween(shine1, 0, {alpha:0, delay:.2});
				juggler.tween(shine2, 0, {alpha:1, delay:.2, onComplete:animateShine});
			}
		}
		
		// label
		private var charsContainer:Component;
		private var charsBottomContainer:Component;
		private var charVec:Vector.<Component>;
		private var charEffectON:Boolean;
		private var charScaled:Boolean;
		private var p:MentonParticle;
		
		private function showLabel():void
		{
			charsContainer = addComp(Component, {centerPivots:true});
			charsBottomContainer = addComp(Component, {centerPivots:true});
			charVec = new Vector.<Component>();
			var label:String;
			
			if ( PraiaPlayerInfo.ME.translationLocalee.cyrillic)
			{
				label = "double line";
			}
			else
			{
				label = Dictio.lower("DoubleLine");
			}
			
			var tempVec:Vector.<Array> = PrizeLabelHelper.ME.getCharacterVector(label, PrizeLabelHelper.mentonDoubleLine);
			
			var charX:Number = 0;
			var charY:Number = 0;
			var spacer:int = 0;
			var bottomLine:Boolean;
			
			for(var i:int = 0 ; i < tempVec.length ; i ++)
			{
				var char:Component;
				var charON:Component;
				var charOFF:Component;
				
				if ( tempVec[i][0] !== "" )
				{
					char = bottomLine ? charsBottomContainer.addComp() : charsContainer.addComp();
					charON = char.addComp();
					charOFF = char.addComp();
					
					charON.addImage(MentonAssets.ME.texture(tempVec[i][0]));
					charOFF.addImage(MentonAssets.ME.texture(tempVec[i][1]));

					
					if ( tempVec[i][2] )
					{
						var acentoON:Image = charON.addImage(MentonAssets.ME.texture(tempVec[i][2]));
						var acentoOFF:Image = charOFF.addImage(MentonAssets.ME.texture(tempVec[i][3]));
						acentoON.x = char.width / 2 - acentoON.width / 2 + tempVec[i][4];
						acentoOFF.x = acentoON.x;
					}
					char.x = charX;
					char.y = charY;
					charX += char.width + spacer;
				}
				else
				{
					charX = 0;
					charY = 135;
					bottomLine = true;
				}
				
				charVec.push(char);
				hide(charOFF);
			}
			
			charsContainer.pivotsRatio = .5;
			charsContainer.x = bg.width >> 1;
			charsContainer.scaleX = charsContainer.scaleY = .7;
			charsContainer.y = 180;
			
			charsBottomContainer.pivotsRatio = .5;
			charsBottomContainer.x = bg.width >> 1;
			charsBottomContainer.scaleX = charsBottomContainer.scaleY = .7;
			charsBottomContainer.y = 180;
			
			p = new MentonParticle("DoubleLine", this,350,200);
			p.start(CHARS_WAIT_TIME - 3);
			
			animateChars();
			scaleChars();
		}
		
		private function animateChars() : void
		{
			charEffectON = !charEffectON;
			
			for(var i:int = 0 ; i < charVec.length ; i++)
			{
				if (charEffectON)
				{
					show(charVec[i].getChildAt(0));
					hide(charVec[i].getChildAt(1));
				}
				else
				{
					hide(charVec[i].getChildAt(0));
					show(charVec[i].getChildAt(1));
				}
			}
			
			delayCall("chareff", juggler.delayCall(animateChars, .1));
//			delayCall("end", juggler.delayCall(endAnimation, CHARS_WAIT_TIME - 3));
		}
		
		private function scaleChars() : void
		{
			charScaled = !charScaled;
			
			if(charScaled)
			{
				juggler.tween(charsContainer, .5, {scaleX:.8, scaleY:.8, onComplete:scaleChars});
				juggler.tween(charsBottomContainer, .5, {scaleX:.8, scaleY:.8});
			}
			else
			{
				juggler.tween(charsContainer, .5, {scaleX:.7, scaleY:.7, onComplete:scaleChars});
				juggler.tween(charsBottomContainer, .5, {scaleX:.7, scaleY:.7});
			}
		}
		
		private function stopTweens():void
		{
			juggler.removeTweens(charsContainer);
			juggler.removeTweens(charsBottomContainer);
			juggler.removeTweens(shine2);
			juggler.removeTweens(shine1);
			juggler.removeTweens(leftCloud);
			juggler.removeTweens(rightCloud);
		}
		
		private function endAnimation() : void
		{
			//this.disable();
			stopTweens();
			
			//chars
			if(charsContainer) juggler.tween(charsContainer, .4, {scaleX:.2, scaleY:.2, delay:.2, transition:Transitions.EASE_OUT_CIRC});
			if(charsBottomContainer) juggler.tween(charsBottomContainer, .4, {scaleX:.2, scaleY:.2, delay:.2, transition:Transitions.EASE_OUT_CIRC});
			
			hide(shine1,shine2);
			
			//clouds
			delayCall("killclouds", juggler.delayCall(function():void{
				hide(leftCloud,rightCloud,charsContainer,charsBottomContainer);
			}, .4));
			
			for(var i:int = 0 ; i < cloudsLinesVec.length ; i++)
			{
				juggler.tween(cloudsLinesVec[i], 0, {alpha:0, delay: (i / cloudsLinesVec.length) / 2 });
			}
			
			//bg
			delayCall("killbg", juggler.delayCall(function():void{
				exit();
			}, .5));
		}
		
		private function exit():void
		{
			juggler.removeTweens(charsContainer);
			juggler.removeTweens(charsBottomContainer);
			if (this.callBack) this.callBack();
		}
		
	}
}

import com.assukar.praia.menton.assets.MentonAssets;
import com.assukar.view.starling.Component;
import starling.display.Image;



class Bird extends Component
{
	override public function dispose() : void
	{
		juggler.removeTweens(b1);
		juggler.removeTweens(b2);
		super.dispose();
	}
	
	private var b1:Image;
	private var b2:Image;
	private var birdFlySpeed:Number = .1;
	private var invert:Boolean;
	
	public function Bird(invert:Boolean) : void
	{
		this.invert = invert;
	}
	
	override protected function draww() : void
	{
		b1 = addImage(MentonAssets.ME.texture("ld_bird_01"), {centerPivots:true});
		b2 = addImage(MentonAssets.ME.texture("ld_bird_02"), {centerPivots:true});
		flyBird();
	}
	
	private function flyBird() : void
	{
		if ( invert )
		{
			juggler.tween(b2, 0, {alpha:0, delay:birdFlySpeed});
			juggler.tween(b1, 0, {alpha:1, delay:birdFlySpeed});
			juggler.tween(b2, 0, {alpha:1, delay:birdFlySpeed * 2});
			juggler.tween(b1, 0, {alpha:0, delay:birdFlySpeed * 2, onComplete:flyBird});
		}
		else
		{
			juggler.tween(b1, 0, {alpha:0, delay:birdFlySpeed});
			juggler.tween(b2, 0, {alpha:1, delay:birdFlySpeed});
			juggler.tween(b1, 0, {alpha:1, delay:birdFlySpeed * 2});
			juggler.tween(b2, 0, {alpha:0, delay:birdFlySpeed * 2, onComplete:flyBird});
		}
		
	}
}

