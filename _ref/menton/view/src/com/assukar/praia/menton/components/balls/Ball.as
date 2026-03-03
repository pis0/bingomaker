package com.assukar.praia.menton.components.balls
{
    import com.assukar.airong.utils.Utils;

    import starling.animation.Transitions;
	import starling.display.DisplayObject;
	import starling.display.Image;
	import starling.textures.TextureSmoothing;

	import com.assukar.praia.assets.Fonts;
	import com.assukar.praia.main.PraiaContext;
	import com.assukar.praia.menton.assets.MentonAssets;
	import com.assukar.praia.menton.components.Menton;
	import com.assukar.view.starling.AssukarTextField;
	import com.assukar.view.starling.Component;
	import com.assukar.view.starling.StarlingUtils;

	import flash.geom.Point;
	
	public class Ball extends Component
	{
		public function Ball(label:int)
		{
			this.label = label;
		}
		
		override public function dispose():void
		{
			ballContainer.unflatten();
			bg = new <Image>[];
			text = new <AssukarTextField>[];
			juggler.removeTweens(this);
			juggler.removeTweens(ballContainer);
			juggler.removeTweens(ballContainer2);
			juggler.removeTweens(tempObj);
			super.dispose();
		}
		
		// object vars
		public var idle:Boolean = false;
		
		private var label:int;
		
		private var bg:Vector.<Image>;
		private var text:Vector.<AssukarTextField>;
		private var ballContainer:Component;
		private var ballContainer2:Component;
		
		public var water:Image;


		public function flattenMe():void
		{
		//	flatten();
		}

		public function unflattenMe():void
		{
		//	unflatten();
		}
		
		override protected function draww():void
		{
			ballContainer = addComp();
			
			water = ballContainer.addImage(MentonAssets.ME.texture("balljuice"), {centerPivots: true, alpha: 0.6, smoothing: TextureSmoothing.TRILINEAR});
			
			bg = new <Image>[];
			bg[0] = ballContainer.addImage(MentonAssets.ME.texture("ball"), {centerPivots: true, smoothing: TextureSmoothing.TRILINEAR});
			bg[1] = ballContainer.addImage(MentonAssets.ME.texture("extraball"), {centerPivots: true, smoothing: TextureSmoothing.TRILINEAR});
			hide(bg[1]);
			
			var auxText:String = ((label < 10) ? "0" : "") + label;
			
			var fontColor:uint = 0x4d371e;
			
			var bgWidth:int = bg[0].width;
			var bgHeight:int = bg[0].height;
			
			text = new <AssukarTextField>[];
			text[0] = ballContainer.addText(bgWidth, bgHeight, auxText, Fonts.IOWAN_OLD_STYLE_BLACK_33, { centerPivots: true }, { color: fontColor, fontSize:33 //
			});
			StarlingUtils.setText(text[0], text[0].text, -2);
			
			text[1] = ballContainer.addText(bgWidth, bgHeight, auxText, Fonts.IOWAN_OLD_STYLE_BLACK_39, { centerPivots: true }, { color: fontColor, fontSize:39 //
			});
			StarlingUtils.setText(text[1], text[1].text, -2); 
			
			hide(text[1]);
			
			
			//m2
			if (PraiaContext.ME.oneHandDevice) 
			{
				text[0].x = 1;
				text[0].y = 0;
				
				//text[0].letterSpacing = -4;  
				StarlingUtils.setText(text[0], text[0].text, -4); 
			}
			
			
			ballContainer2 = addComp();
			ballContainer2.addChild(ballContainer);

            flattenMe();
		}
		
		private var extraa:Boolean;
		
		public function get extra():Boolean
		{
			return this.extraa;
		}
		
		public function set extra(value:Boolean):void
		{
//			Utils.print("EXTRA:" + value + " NUMBER:" + label);
			
			if (this.extraa != value)
			{
				this.extraa = value;
				bg[1].visible = text[1].visible = value;
				bg[0].visible = text[0].visible = !value;
			}
			
			if (value) unflattenMe();
		}
		
		private var shaking:Boolean = false;
		
		public function shake(isExtraBall:Boolean = false, extraSpot:uint = 0):void
		{
			if (shaking) return;
			shaking = true;
			
			var lastPos:Point = new Point(this.x, this.y);
			//TODO
			//juggler.removeTweens(this);
			
			if (isExtraBall)
			{
				const scaleAux:Number = 1.00 + (0.03 * Math.random()) * (extraSpot < 6 ? -1 : 1);
				juggler.tween(this, .1, {scaleX: scaleAux, scaleY: scaleAux, onCompleteArgs: [this], onComplete: function(target:DisplayObject):void
				{
					juggler.tween(target, .2, {scaleX: 1.0, scaleY: 1.0, transition: Transitions.EASE_OUT_ELASTIC});
				}});
			}
			
			juggler.tween(this, .1, {x: lastPos.x + (Math.random()), y: lastPos.y + (Math.random()), onCompleteArgs: [this], onComplete: function(target:DisplayObject):void
			{
				juggler.tween(target, .2, {x: lastPos.x, y: lastPos.y, onComplete: function():void
				{
					shaking = false;
				}});
			}});
		
		}
		
		public function fitToRegularStake(pos:Point):void
		{
//			var r:Number = this.rotation + ((Math.PI * 2) - this.rotation);
			juggler.removeTweens(this);
			juggler.tween(this, .08 + (.066 * Math.random()), {x: pos.x, y: pos.y, transition: Transitions.EASE_OUT_BACK, onComplete: function():void
			{
				idle = true;
			}});
		}

		public function fitToExtraStake(pos:Point, rotation:Number, callback:Function = null):void
		{
			visible = true;
			unflattenMe();

			juggler.removeTweens(this);
			juggler.tween(this, .6, {x: pos.x, y: pos.y, transition: Transitions.EASE_OUT_BACK});
			juggler.tween(this, .2, {scaleX: 1, scaleY: 1, transition: Transitions.EASE_OUT_BOUNCE});

			ballContainer2.pivotX = ballContainer2.pivotY = 5 + (5 * Math.random());

			juggler.tween(ballContainer2, 1, {pivotX: 0, pivotY: 0, rotation: (rotation * 2), transition: Transitions.EASE_OUT_CUBIC});
			
			juggler.tween(ballContainer, 1 + ((Math.random() * 0.1) * (Math.random() < 0.5 ? 1 : -1)), {rotation: -(rotation * 2), transition: Transitions.EASE_OUT_CUBIC, onComplete: function():void
			{

			//	if (callback) callback();
			}});

            idle = true;
            if (callback) callback();
		}
		
		private var tempObj:Object;
		
		public function fitToLastSuperPosition(pos:uint):void
		{
			Menton.ME.addChild(BallPanelMenton.ME); 
			
			this.scale = 1;
			
			const finalPos:Point = new Point(36, 320 - (bg[1].height * pos) + (PraiaContext.ME.oneHandExtended ? 20 : 0) );
			var target:DisplayObject = this;
			var time:Number = 0.4;
			
			juggler.removeTweens(target);
			juggler.tween(target, time, {x: 340});
			
			// rotation
			juggler.removeTweens(tempObj);
			tempObj = {percent: 0.0};
			juggler.tween(tempObj, time, {percent: 1.0, onUpdate: function():void
			{
				target.rotation = -(Math.PI * 2) * tempObj.percent;
			}});
			
			juggler.tween(target, time, {y: 365+ (PraiaContext.ME.oneHandExtended ? 20 : 0), transition: Transitions.EASE_IN_SINE, onComplete: function():void
			{
				throwObject(target, new Point(340, 365+ (PraiaContext.ME.oneHandExtended ? 20 : 0)), new Point(finalPos.x - 4, finalPos.y - 10), 318 - 200, time + 0.1, null);
				
				// rotation
				juggler.removeTweens(tempObj);
				tempObj = {percent: 0.0};
				juggler.tween(tempObj, time + 0.1, {percent: 1.0, onUpdate: function():void
				{
					target.rotation = -(Math.PI * 2) * tempObj.percent;
				}});
			
			}});
			
			function throwObject(target:Object, start:Point, end:Point, hRange:Number, time:Number, callback:Function):void
			{
				target.x = start.x;
				
				juggler.tween(target, time, {x: end.x});
				
				target.y = target.y;
				juggler.tween(target, time * (.5 + (.1 * pos)), { // 				
					y: hRange, //
					transition: Transitions.EASE_OUT_SINE, //					
					onComplete: function():void
					{ //
						juggler.tween(target, time * (.5 - (.1 * pos)), {y: end.y, transition: Transitions.EASE_IN_SINE,//						
							onComplete: function():void
							{
								juggler.tween(target, .2, {x: finalPos.x, y: finalPos.y, transition: Transitions.EASE_OUT_BOUNCE});
								
								Menton.ME.addChildAt(BallPanelMenton.ME, 4); // back to the original index
								if (callback) callback();
							}}); //
					} //
				});
			}
		
		}
		
		public function reset():void
		{
			Menton.ME.addChildAt(BallPanelMenton.ME, 4); // back to the original index 
			
			juggler.removeTweens(this);
			juggler.removeTweens(ballContainer);
			juggler.removeTweens(ballContainer2);
			
			idle = false;
			shaking = false;
			ballContainer.rotation = ballContainer2.rotation = rotation = 0;
			this.scale = 1;
			
			unflattenMe();
		}
	
	}
}
