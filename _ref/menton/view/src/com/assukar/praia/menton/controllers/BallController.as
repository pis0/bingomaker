package com.assukar.praia.menton.controllers
{
	import com.assukar.airong.utils.Singleton;
	import com.assukar.praia.menton.components.balls.BallPanelMenton;
	import com.assukar.praia.menton.domain.Draw;
	import com.assukar.view.starling.Animatables;
	
	/**
	 * @author Johnatan
	 */
	public class BallController
	{
		// singleton
		static public var ME:BallController;
		
		function BallController()
		{
			ME = Singleton.enforce(ME, this);
			
			//for (var i: int = 0; i < 40; i++)
			for (var i:int = 0; i < 30 + 12 + 3; i++)
			{
				paths[i] = new BallPath(i);
			}
		}
		
		public function dispose():void
		{
			for each (var p:BallPath in paths) p.dispose();
			ME = null;
		}
		
		// object vars
		private var paths:Vector.<BallPath> = new Vector.<BallPath>();
		private var ix:int;
		
		public function get triggers():int
		{
			return ix;
		}
		
		public function reset():void
		{
			for (var i:int = 0; i < ix; i++) paths[i].ball = null;
			ix = 0;
			
			BallPanelMenton.ME.reset();
		}
		
		//public function notifyDrawHalt(draw:Draw):void
		//{		
		//BallPanelMenton.ME.setLargeBall(draw.ball, true); 
		//}
		
		public function trigger(draw:Draw, cycles:int, cyclesCallback:Function, finalCallback:Function):void
		{
			
			//BallPanelMenton.ME.setLargeBall(draw.ball, ix >= 29 || RoundMotion.ME.haltedForUser);
			
			BallPanelMenton.ME.updateLargeBall(draw.ball);
			
			//if (ix < 40)
			//if (ix < 30 + 12 + 1)  
			//{
			//var isExtra:Boolean = ix >= 30 || RoundMotion.ME.haltedForUser;
			//
			//if (isExtra)
			//{
			//Utils.wraplog("EXTRA BALL TREATMENT");
			//ix++;
			//BallPanelMenton.ME.callExtraBall(ix,draw,cyclesCallback,finalCallback);
			//}
			//else
			//{
			var path:BallPath = paths[ix];
			ix++;
			path.draw = draw;
			//path.cycles = cycles;
			path.cyclesCallback = cyclesCallback;
			path.finalCallback = finalCallback;
			//if (RoundMotion.ME.haltedForUser && ix <= 30) path.setNext(); 
			Animatables.play(path);
			//}
			//}
			//else
			//{
			//cyclesCallback(draw); 
			//finalCallback(); 
			//}
			
			BallPanelMenton.ME.setTriggersBalls(ix);
		}
	}
}
