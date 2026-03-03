package com.assukar.praia.menton.components
{
import com.assukar.view.starling.AssukarJuggler;

import starling.animation.Juggler;

	import com.assukar.airong.ds.Cursor;
	import com.assukar.airong.ds.LinkedList;
	import com.assukar.airong.ds.Queue;
	import com.assukar.airong.utils.Singleton;
	import com.assukar.view.starling.Animatables;
	/**
	 * @author Johnatan
	 */
	public class MissingBallSyncer
	extends Juggler
	{
		// singleton
		static public var ME: MissingBallSyncer;

		public function MissingBallSyncer()
		{
			ME = Singleton.enforce(ME, this);
			Animatables.play(this);
		}

		public function dispose(): void
		{
			AssukarJuggler.ME.remove(this);

			purge();
			queue.clear();
			ME = null;
		}
		
		// lists of Syncable
		private const queue: Queue = new LinkedList();
		
		public function set frequency(freq: Number): void
		{
			frequencyMultiple = freq;
		}
		
		public function play(sync: Syncable): void
		{
			if (!queue.contains(sync)) queue.push(sync);
		}
		
		public function stop(sync: Syncable): void
		{
			queue.removeObject(sync);
		}
		
		public function clear():void
		{
			queue.clear();
		}
		
		private var frequencyMultiple: Number = 1;
		
		private var c: Cursor;
		private var ptotalTime: Number = 0;
		private var totalTime: Number = 0;
		private var s: Syncable;
		private var interval: Number;
		
		override public function advanceTime(time: Number): void
		{
			ptotalTime = totalTime;
			totalTime += time/frequencyMultiple;
			c = queue.cursor;
			
//			Utils.print("totalTime:" + totalTime);
			
			while (c.next)
			{
				s = Syncable(c.current);
				interval = s.interval;
				if (int(totalTime/interval) > int(ptotalTime/interval)) s.tick(int(totalTime/interval));
			}
		}
	}
}
