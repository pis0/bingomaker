package com.assukar.praia.menton.domain
{
	import com.assukar.airong.ds.LinkedList;
	import com.assukar.airong.error.AssukarError;
	import com.assukar.airong.utils.Singleton;
	import com.assukar.airong.utils.Utils;
	import com.assukar.praia.menton.main.MentonEngine;

	import flash.utils.Dictionary;

	public class SlotBonusSession extends BonusSession
	{
		static public const X2:String = "x";
		static public const FRUIT:String = "F";
		static public const BONUS:String = "@";
		
		static private const HITS:int = 4; // 4
		
		static private const BUCKET:LinkedList = new LinkedList(X2, X2, X2, X2, FRUIT, FRUIT, FRUIT, FRUIT, BONUS, BONUS, BONUS, BONUS);

		// TODO comment me - use to force slots
		//static private const BUCKET: LinkedList = new LinkedList(X2);
		
		static private const BUCKETS2:Dictionary = new Dictionary();
		static private var buckets2Started:Boolean = false; 
		
		static public function start():void 
		{
			buckets2Started = true;
			
			BUCKETS2[X2] = new LinkedList(X2, X2, X2, X2, FRUIT, FRUIT, BONUS, BONUS);
			BUCKETS2[FRUIT] = new LinkedList(X2, X2, FRUIT, FRUIT, FRUIT, FRUIT, BONUS, BONUS);
			BUCKETS2[BONUS] = new LinkedList(X2, X2, FRUIT, FRUIT, BONUS, BONUS, BONUS, BONUS);
		
			// TODO comment me- use to force slots
			//BUCKETS2[BUCKET.getFirst()] = new LinkedList(X2, X2, X2, X2, X2, X2, X2, X2);
		}
		
		// singleton
		static public const ME:SlotBonusSession = new SlotBonusSession();
		
		function SlotBonusSession()
		{
			Singleton.enforce(ME);
			if (!buckets2Started) start();
		}
		
		public var positions:Vector.<SlotPosition>;
		public var hits:int;
		public var triggered:Boolean;
		public var symbols:Vector.<String>;
		public var prize:String;
		private var drawCount:int;
		
		public var feteDuCitroinBonus:FeteDuCitroinBonusSession;
		public var fruitBombBonus:FruitBombBonusSession;
		public var doubleWinBonus:DoubleWinBonusSession;
		
		public function get winMultiplier():int
		{
			if (doubleWinBonus) return 2;
			else return 1;
		}
		
		public function shuffle():void
		{
			positions = new <SlotPosition>[];
			for (var i:int = 0; i < HITS; i++) positions.push(new SlotPosition(MentonEngine.ME.newRound.cards, i));
		}
		
		public function reset():void
		{
			if (positions)
				for each (var position:SlotPosition in positions) position.hit = false;
			hits = 0;
			triggered = false;
			symbols = null;
			drawCount = 0;
			
			if (feteDuCitroinBonus && !feteDuCitroinBonus.collected)
			{
				Utils.logError(new AssukarError("leaved menton without completing feteDuCitroinBonus."),false);
			}
			
			feteDuCitroinBonus = null;
			fruitBombBonus = null;
			doubleWinBonus = null;
		}
		
		private function checkPrize(symbol:String):Boolean
		{
			return symbols[0] == symbol && symbols[1] == symbol && symbols[2] == symbol;
		}
		
		private function trigger(draw:Draw):void
		{
			if (draw.ix >= 30) draw.slotTriggered = true;
			triggered = true;
			BUCKET.shuffle2();
			symbols = new <String>[BUCKET.getRandom() as String];
			var list: LinkedList = BUCKETS2[symbols[0]] as LinkedList;
			list.shuffle2();
			symbols[1] = list.getRandom() as String;
			symbols[2] = list.getRandom() as String;
			
			if (checkPrize(X2))
			{
				prize = X2;
				doubleWinBonus = new DoubleWinBonusSession();
			}
			else if (checkPrize(FRUIT))
			{
				prize = FRUIT;
				fruitBombBonus = new FruitBombBonusSession(draw.round);
			}
			else if (checkPrize(BONUS))
			{
				prize = BONUS;
				feteDuCitroinBonus = new FeteDuCitroinBonusSession();
			}
			else prize = null;
		}
		
		public function processRound(round:Round):void
		{
			round.draws.apply(process);
			if (triggered) Draw(round.draws.getLast()).slotTriggered = true;
		}
		
		public function process(draw:Draw):void
		{
			if (!triggered)
			{
				drawCount++;
				for each (var position:SlotPosition in positions)
					if (position.ball == draw.ball && !position.hit)
					{
						position.hit = true;
						hits++;
						if (hits == HITS) trigger(draw);
						break;
					}
			}
		}
	}
}
