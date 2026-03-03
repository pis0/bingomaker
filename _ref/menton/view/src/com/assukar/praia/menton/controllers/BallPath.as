package com.assukar.praia.menton.controllers
{
	import com.assukar.airong.error.AssukarError;
	import com.assukar.airong.utils.Utils;
	import com.assukar.praia.main.PraiaContext;
	import com.assukar.praia.menton.assets.SoundID;
	import com.assukar.praia.menton.components.balls.Ball;
	import com.assukar.praia.menton.components.balls.BallPanelMenton;
	import com.assukar.praia.menton.domain.Draw;
	import com.assukar.view.sounds.Sounds;
	import com.assukar.view.starling.simplified.SimpleAdvancePath;

	import flash.geom.Point;
	
	public class BallPath 
	extends SimpleAdvancePath
//	extends SimplePath
	{
		function BallPath(index:int)
		{
			movePercent = 0;
			this.index = index;
			extra = index >= 30;
			lastSuper = index >= 30 + 10; 
		}
		
		
		override public function dispose():void 
		{
			super.dispose();	
			ball = null;
		}
		
		public function set draw(drw:Draw):void
		{
			this.drw = drw;
			ball = BallPanelMenton.ME.balls[drw.ball - 1];
		}
		
		private var index:int;
		private var drw:Draw;
		private var b:Ball;
		private var extra:Boolean;
		private var lastSuper:Boolean;
		
		public function set ball(b:Ball):void
		{
			if (b)
			{
				this.b = b;
				
				movePercent = 0;
				moveStep = 0;
				
				b.extra = extra;
				
				if (lastSuper)
				{
					movePointList = new <Point>[ // 
					new Point(130, -70), // 
					new Point(135, -70), // 
					new Point(730, 0) //	  
					];
					moveSpeed = DEFAULT_SUPER_SPEED;
					b.scale = 1.3;
				}
				else if (extra)
				{
					movePointList = new <Point>[ // 
					new Point(130, -70), //
					new Point(135, -70), // 
					new Point(511 - (61+15) * int((index - 30) / 2), -43 - 60 * ((index - 30) % 2)) //	 
					];
					moveSpeed = DEFAULT_EXTRA_SPEED;
					b.scale = 1.3;
				}
				else
				{
					if (index == 0)
					{
						Sounds.ME.playFx(SoundID.BALL_SHOT, null, 1, extra ? Sounds.SOUND_TRANSFORM_VOLUME_50 : Sounds.SOUND_TRANSFORM_VOLUME_30);
					}
					movePointList = new <Point>[ // 
					new Point(35, 30), //				
					new Point(35, 460 - (35 * int(index / 15)) + (PraiaContext.ME.oneHandExtended ? 20 : 0)  ), //					
					new Point((index < 15 ? 685 : 705) - (45 * (index % 15)), 460 - (35 * int(index / 15)) + (PraiaContext.ME.oneHandExtended ? 20 : 0) ) //										
					];
					moveSpeed = DEFAULT_BALL_SPEED;
					b.scale = 1;
				}
				
				b.visible = true;
				b.x = movePointList[0].x;
				b.y = movePointList[0].y;
				b.idle = false;
				finished = false;
				
				reset();
			}
			else
			{
				if (this.b) this.b.visible = false;
				this.b = null;
				cyclesCallback = null;
			}
		}
		
		static private const DEFAULT_BALL_SPEED: Number = 0.06006; // 0.10006
		static private const DEFAULT_EXTRA_SPEED: Number = 0.16006; // 0.30006
		static private const DEFAULT_SUPER_SPEED: Number = 0.05006; // 0.09006
		static private const DEFAULT_EXTRA_MOVE_SPEEDS: Array = [0.25006, DEFAULT_EXTRA_SPEED]; // [0.40006, DEFAULT_EXTRA_SPEED]
		
		private var finished:Boolean;
		internal var finalCallback:Function;
		internal var cyclesCallback:Function;
		
		private function invokeCyclesCallback():void
		{
			if (cyclesCallback != null) cyclesCallback(drw);
			cyclesCallback = null;
		}
		
		private function invokeFinalCallback():void
		{
			if (finalCallback != null) finalCallback();
			finalCallback = null;
		}
		
		private var moveSpeed:Number;// = 0.10006;
		private var movePercent:Number = 0;
		private var moveStep:int = 0;
		private var movePointList:Vector.<Point> = new <Point>[];
		
		override protected function walk():Boolean
		{
			if (!b) 
			{
				Utils.log("draw: " + drw);
				if(drw) Utils.log("draw.ball: " + drw.ball);
				Utils.logError( new AssukarError("ball is null"), false);
				
				return true;
			}
			
			var startPt:Point = movePointList[moveStep];
			var endPt:Point = movePointList[moveStep + 1];
			
			var p:Point = new Point( //
			startPt.x + (endPt.x - startPt.x) * movePercent, //
			startPt.y + (endPt.y - startPt.y) * movePercent //
			);
			
			if (extra) 
			{
				if (moveStep == 0) moveSpeed = DEFAULT_EXTRA_MOVE_SPEEDS[0];
				else moveSpeed = DEFAULT_EXTRA_MOVE_SPEEDS[1];
				
			}
			
			if ((movePercent += moveSpeed) >= 1)
			{
				if (moveStep == 0 && extra)
				{
					Sounds.ME.playFx(SoundID.BALL_SHOT, null, 1, extra ? Sounds.SOUND_TRANSFORM_VOLUME_50 : Sounds.SOUND_TRANSFORM_VOLUME_30);
				}
				
				moveStep++;
				movePercent = 0;
				
				if ((lastSuper && (moveStep == 1)) || (!lastSuper && extra))
				{
					BallPanelMenton.ME.extraWaterParticle();
				}
			}
			
			if (b.water.visible != (!extra && moveStep == 0))
			{
				b.water.visible = (!extra && moveStep == 0);
				if (!b.water.visible) b.flattenMe();
			}
			
			b.rotation = (Math.PI * 2) * ((moveStep == 0 || extra) ? 1 : (1 + int((14 - (index % 15)) * .5))) * movePercent;
			
			b.x = p.x;
			b.y = p.y;

			if (Boolean(finished = (moveStep >=2)))
			{
				b.rotation = 0;
				
				if (lastSuper)
				{ 				
					b.fitToLastSuperPosition(index - 30 - 10);	  				
				}
				else if (extra)
				{
					b.fitToExtraStake(endPt, (Math.PI * 2) * (1 + int(1 * Math.random())), function():void
					{
						BallPanelMenton.ME.mergeExtraBallWith3DContainer(b);
					});
					BallPanelMenton.ME.beatExtraBallContainer(index - 30);
				}				
				else
				{
					b.fitToRegularStake(endPt);
					BallPanelMenton.ME.beatIdleBalls();
				}
				Sounds.ME.playFx(SoundID.BALL_HIT, null, 1, extra ? Sounds.SOUND_TRANSFORM_VOLUME_50 : Sounds.SOUND_TRANSFORM_VOLUME_30);
				invokeCyclesCallback();
				invokeFinalCallback();
			}
			
			return finished;
		
		}
	}
}

