package com.assukar.praia.menton.engine.commands
{
	import com.assukar.airong.ds.LinkedList;
	import com.assukar.airong.ds.NumberLinkedList;
	import com.assukar.airong.error.AssukarError;
	import com.assukar.airong.utils.Singleton;
import com.assukar.praia.domain.console.CheatInjector;
	import com.assukar.domain.main.AssukarContext;
	import com.assukar.praia.domain.games.PraiaControlInfo;
	import com.assukar.praia.main.PraiaStatics;
	import com.assukar.praia.menton.domain.Card;
	import com.assukar.praia.menton.domain.MentonStatics;
	import com.assukar.praia.menton.domain.NewRound;
	import com.assukar.praia.menton.domain.Pattern;
	import com.assukar.praia.menton.domain.Round;
	import com.assukar.praia.menton.domain.SlotBonusSession;
	import com.assukar.praia.menton.main.MentonEngine;
	
	public class NewRoundControlCommand
	{
        public static const CHEAT_MODE:Boolean = false; //false
        private var currentCheatPattern:Pattern = null;

		// singleton
		static public const ME:NewRoundControlCommand = new NewRoundControlCommand();
		// class vars
		static public var lastRound:Round;
		// object vars
		private var cardIndexList:LinkedList;
		private var i:int;
		
		function NewRoundControlCommand()
		{
			Singleton.enforce(ME);
			reset();
		}
		
		private function reset():void
		{
			lastRound = null;
			cardIndexList = null;
			i = 0;
		}
		
		public function dispose():void
		{
			reset();
		}
		
		private var list:NumberLinkedList;

        public function set cheatPattern(pattern:Pattern):void
        {
            if(CHEAT_MODE)
                currentCheatPattern = currentCheatPattern == pattern ? null : pattern;
        }

		private function forceBall(pos:int, cardix:int, i:int, j:int):void
		{
			//TODO uncomment to deploy
			if (AssukarContext.ME.platformServicess.profile.production) throw new AssukarError("production");
			
			list.add(pos, removeBall(i, j, cardix));
		}
		
		private function removeBall(i:int, j:int, cardix:int = 0):int
		{
			var newRound:NewRound = MentonEngine.ME.newRound;
			var c:Card = newRound.cards.get(cardix) as Card;
			var n:int = c.numbersList.get(i + j * 3);
			list.removeObject(n);
			return n;
		}
		
		private function generateBallList():NumberLinkedList
		{
			list = new NumberLinkedList();
			cardIndexList = new LinkedList();
			cardIndexList.addArray([0, 1, 2, 3]);
			for (i = 0; i < 4; i++) list.addAll(Card(MentonEngine.ME.newRound.cards.get(cardIndexList.removeRandom())).numbersList);
			
			if(CheatInjector.isCheatEnabled("menton")){
				list = CheatInjector.inject("menton", list, MentonEngine.ME.newRound, Pattern, null);
			}else{
				list.shuffle2();
			}
			
			return list;
		}
		
		private var round1:Round;
		private var list1:NumberLinkedList;
		private var float:Number;
		private var condition:Boolean;
		private var r1Output:int;
		private var process2nRound:Boolean;
		private var round2:Round;
		private var list2:NumberLinkedList;
		
		public function execute():Round
		{
			SlotBonusSession.ME.reset();
			
			// round 1
			round1 = new Round();
			list1 = generateBallList();
			round1.balls = list1;
			round1.ballIndex = MentonStatics.DEFAULT_BALLS;
			round1.process();
			
			lastRound = round1;
			
			float = PraiaControlInfo.ME.mentonFloat + PraiaControlInfo.ME.elasticity;
			condition = Math.random() < Math.abs(float) && !round1.jackpot;
			
			if (condition || PraiaStatics.FLOAT_CONDITIONS)
			{
				r1Output = round1.payout;
				
				process2nRound = (float > 0 && r1Output == 0) || (float < 0 && r1Output > 0);
				
				// round 2
				if (process2nRound)
				{
					round1.dispose();
					round2 = new Round();
					list2 = generateBallList();
					round2.balls = list2;
					round2.ballIndex = MentonStatics.DEFAULT_BALLS;
					round2.process();
					
					lastRound = round2;
				}
			}
			
			{
				SlotBonusSession.ME.processRound(lastRound);
			}
			
			return lastRound;
		}
	}
}
