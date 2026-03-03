package com.assukar.praia.menton.domain
{
	import com.assukar.airong.ds.Cursor;
	import com.assukar.airong.ds.LinkedList;
	import com.assukar.airong.ds.NumberLinkedList;
	import com.assukar.airong.error.AssukarError;
    import com.assukar.domain.domain.RemoteProps;
    import com.assukar.domain.domain.StatsMoney;
	import com.assukar.engine.utils.AntiCheatInt;
	import com.assukar.praia.domain.games.PraiaControlInfo;
	import com.assukar.praia.domain.games.vbs.VBRound;
	import com.assukar.praia.main.PraiaStatics;
	import com.assukar.praia.menton.main.MentonEngine;

	public class Round
	implements VBRound
	{
		// list of balls
		public var balls: NumberLinkedList = new NumberLinkedList();
		// ball index
		public var ballIndex : int;
		public var jackpot : Boolean = false;

		// new round request
		private function get newRound() : NewRound
		{
			return MentonEngine.ME.newRound;
		}
		// list of Card
		public var cards: LinkedList = new LinkedList();
		// cards sorted by balls	
		private var cardsByBalls: Vector.<Card> = new Vector.<Card>(91);
		// list of Draw
		public var draws: LinkedList = new LinkedList();
		// extras enabled?
		public var extraEnabled: Boolean = false;
		public var extraEverEnabled: Boolean = false;
		public var superExtraEnabledd: Boolean = false;
		public var superExtraEverEnabledd: Boolean = false;
		// extra stakes
		public var extraStakes: Vector.<StatsMoney> = new Vector.<StatsMoney>(MentonStatics.TOTAL_EXTRA_BALLS+2);//+1
		// round ended by force
		public var roundEnded: Boolean = false;
		
		public function get superExtraEnabled(): Boolean
		{
			return superExtraEnabledd;
		}
		
		public function dispose(): void
		{
			draws.applyTo("dispose");
			draws.clear();
		}
		
		public function end(): void
		{
			extraEnabled = false;
			extraEverEnabled = false;
			superExtraEnabledd = false;
			superExtraEverEnabledd = false;
			roundEnded = true;
		}
		
		private function ballsToString(): String
		{
			var str: String = "";
			for (var i: int = 0; i < ballIndex; i++) str += balls.get(i) + ",";
			return str;
		}
		
		public function toString(): String
		{
			var str: String = "";
			str += ballsToString() + "\n";
			str += cards + "\n";
			return str;
		}

		private function enableExtra(): void
		{
			if (roundEnded) throw new AssukarError();
			
			extraEnabled = true;
			extraEverEnabled = true;
			
			var c: Cursor = cards.cursor;
			while (c.next)
			{
				var card: Card = c.current;
				if (card && card.hasSuperExtraEnablingPattern())
				{
					superExtraEverEnabledd = true;
				}
			}

			var freeExtras: int = PraiaControlInfo.ME.mentonFreeExtraProbs[int(PraiaControlInfo.ME.mentonFreeExtraProbs.length*Math.random())];

			var freeExtraIndexes: NumberLinkedList = new NumberLinkedList().addRange(1,MentonStatics.EXTRA_BALLS-1);
			freeExtraIndexes.shuffle2();
			var freeExtraIndex: int;
			for (var i: int = 0; i < freeExtras; i++)
			{
				extraStakes[freeExtraIndex = freeExtraIndexes.removeRandom()] = new StatsMoney();
				freeExtraIndexes.removeObject(freeExtraIndex-1);
				freeExtraIndexes.removeObject(freeExtraIndex+1);
			}			
		}

		public function retrieveMissingBalls(): Vector.<int>
		{
			var missingBalls: Vector.<int> = new <int>[];

			var mbs: Vector.<MissingPatternsHolder>;
			var ns: Vector.<int>;
			
			var c: Cursor = cards.cursor;
			while (c.next)
			{
				var card: Card = c.current;
				if (card)
				{
					for (var i: int = 0; i<3; i++)
					{
						mbs = card.expectations[i];
						ns = card.numbers[i];
						
						for (var j: int = 0; j<5; j++)
						{
							if (mbs[j])
							{
								missingBalls.push(ns[j]);
							}
						}
					}
				}
			}

			return missingBalls;
		}
		
		public function Round()
		{
		}

		private function createCards(): void
		{
			var c: Cursor = newRound.cards.cursor;
			while (c.next)
			{
				var cardd: Card = c.current;

				if (cardd.isActive())
				{
					cards.push(cardd);
					cardd.reset(cardsByBalls);
				}
				else
				{
					cards.push(null);
				}
			}
		}
		
		public function get ballsDrawn(): int
		{
			return draws.size-trueBonusDraws;
		}

		public function get extrasDrawn(): int
		{
			return draws.size-trueBonusDraws-MentonStatics.DEFAULT_BALLS;
		}

		private function drawBallInCard(ball: int, card: Card): void
		{
			card.setMatch(ball);
			PatternResolver.ME.checkForPattern(card, this);
		}
		
		public var trueBonusDraws: int = 0;
		public function draw(ball: int): void
		{
			var card: Card = cardsByBalls[ball];
			if (card) drawBallInCard(ball, card);
			draws.push(new Draw(this, draws.size, ball, card, draws.getLast()));
		}

		public function process(): void
		{
			createCards();

            //reset vip hours matches
            PatternGroup.ALL.apply(function (pg: PatternGroup): void
			{
				pg.resetVipHoursMatches();
			});

			var c: Cursor = balls.cursor;
			var i: int = 0;

			while (c.next && i<ballIndex)
			{
				draw(int(c.current));
				i++;
			}

			evaluateExtra();
			if (extraEnabled) calculateExtraStakes();
		}

		public function getDraws(): LinkedList
		{
			return draws;
		}

		public function evaluateExtra(): Boolean
		{
			if (ballIndex<MentonStatics.DEFAULT_BALLS+MentonStatics.EXTRA_BALLS && !roundEnded)
			{
				if (!extraEnabled)
				{
					if (newRound.freeSpin) enableExtra();
					else
					{
						var c: Cursor = cards.cursor;
						while (c.next)
						{
							var card: Card = c.current;
							if (card && card.hasExtraEnablingPattern())
							{
								enableExtra();
								break;
							}
						}
					}
				}
			}
			else
			{
				extraEnabled = false;
			}
			
			return extraEnabled;
		}
		
		public function evaluateSuperExtra(): Boolean
		{
			if (roundEnded
            || ballIndex>=MentonStatics.DEFAULT_BALLS+MentonStatics.TOTAL_EXTRA_BALLS
            || (RemoteProps.ME.props.asBooleanOrFalse("MentonTrueBonusDrawCheck") && trueBonusDraws >= 10))
			{
				superExtraEnabledd = false;
			}
			else if (superExtraEverEnabledd)
			{
				superExtraEnabledd = true;
			}
			else
			{
				superExtraEnabledd = false;
				
				var c: Cursor = cards.cursor;
				while (c.next)
				{
					var card: Card = c.current;
					if (card && card.hasSuperExtraEnablingPattern())
					{
						superExtraEverEnabledd = true;
						superExtraEnabledd = true;
						break;
					}
				}
			}
			
			return superExtraEnabledd;
		}
		
		public function get payoutMoney(): StatsMoney
		{
			return new StatsMoney(0, payout);
		}		

		private var _payoutt: AntiCheatInt = new AntiCheatInt(0);
		private var c: Cursor;
		public function get payout(): int
		{
			return straightPayout;
		}
		
		public function get straightPayout(): int
		{
			payoutt = 0;
			c = cards.cursor;
			while (c.next) payoutt += Card(c.current).getPayout(newRound.unitaryStake);
			return payoutt;
		}
		
		public function get winMultiplierPayout(): int
		{
			return straightPayout * (SlotBonusSession.ME.winMultiplier-1);
		}

		public function get extraStake(): StatsMoney
		{
			return extraStakes[extrasDrawn];
		}

		internal function calculateExtraStakes(): void
		{
			if (extraStake) return;

			var missingOnePayoutInCoins: Number = cards.sum(function(card: Card): int 
			{
				return card.calculateXp();
			});
						
			missingOnePayoutInCoins /= (60-draws.size-1);
			
			if (SlotBonusSession.ME.winMultiplier>1) missingOnePayoutInCoins *= 1 + (0.90);
			if (SlotBonusSession.ME.hits == 3) missingOnePayoutInCoins *= 1 + (8 / (60-draws.size-2));
			
			var lastExtraStakes: StatsMoney;
			
			if (missingOnePayoutInCoins<=0) missingOnePayoutInCoins = 1;
			
			if (extrasDrawn >= MentonStatics.EXTRA_BALLS)
			{
				missingOnePayoutInCoins *= 1 + (PraiaControlInfo.ME.mentonSuperExtraMultiple-1) * (newRound.unitaryStake/newRound.maxStake);
				lastExtraStakes = new StatsMoney(Math.max(1, missingOnePayoutInCoins/PraiaStatics.CASH_TO_COINS));  
			}
			else
			{
				lastExtraStakes = new StatsMoney(0, Math.ceil(missingOnePayoutInCoins*PraiaControlInfo.ME.mentonExtraMultiple));
			}
			
			extraStakes[extrasDrawn] = lastExtraStakes;
		}

		public function get lastDraw(): Draw
		{
			return draws.getLast();
		}
		
		public function get payoutt():int {
			return _payoutt.value;
		}
		
		public function set payoutt(value:int):void {
			_payoutt.value = value;
		}
	}
}
