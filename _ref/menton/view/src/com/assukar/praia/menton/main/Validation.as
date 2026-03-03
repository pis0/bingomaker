package com.assukar.praia.menton.main
{
	import com.assukar.airong.ds.Cursor;
	import com.assukar.airong.ds.NumberLinkedList;
	import com.assukar.airong.error.AssukarError;
import com.assukar.engine.utils.AntiCheatInt;
import com.assukar.praia.domain.games.PraiaControlInfo;
	import com.assukar.praia.domain.vip.VipStatus2;
	import com.assukar.praia.menton.domain.Card;
	import com.assukar.praia.menton.domain.FeteDuCitroinBonusSession;
	import com.assukar.praia.menton.domain.FruitBombBonusSession;
	import com.assukar.praia.menton.domain.MentonJackpotSession;
	import com.assukar.praia.menton.domain.MentonStatics;
	import com.assukar.praia.menton.domain.NewExtra;
	import com.assukar.praia.menton.domain.NewSuperExtra;
	import com.assukar.praia.menton.domain.Pattern;
	import com.assukar.praia.menton.domain.PatternGroup;
	import com.assukar.praia.menton.domain.Round;
	import com.assukar.praia.menton.domain.SlotBonusSession;
	import com.assukar.praia.menton.engine.commands.ExtraControlCommand;
	import com.assukar.praia.menton.engine.commands.NewRoundControlCommand;
	import com.assukar.praia.menton.engine.commands.SuperExtraControlCommand;
	import com.assukar.praia.validation.PraiaValidation;

	/**
	 * @author Johnatan
	 */
	[SWF(width="600", height="600", frameRate="60", backgroundColor="#ccccff")]
	public class Validation
	extends PraiaValidation
	{
		static private var BUY_EXTRAS: Boolean = true;
		static private var BUY_SUPER: Boolean = true;
		static private var PROCESS_BONUSES: Boolean = true;
		
		private function processExtra(): void
		{
			if (round.extrasDrawn == 0) {
				extraEntries++;
				trace(_alignTextLeft("EXTRAS ROUND #" + extraEntries,  18), _alignTextLeft("PRIZE SUM"), _alignTextLeft("PRIZE"), _alignTextLeft("COST SUM"), _alignTextLeft("COST"), _alignTextLeft("NET"));
			} else if (round.extrasDrawn == MentonStatics.EXTRA_BALLS) {
				superEntries++;
			}
			
			var extraCall: Boolean = round.extrasDrawn < MentonStatics.EXTRA_BALLS;
			var superExtraCall: Boolean = !extraCall && round.extrasDrawn < MentonStatics.EXTRA_BALLS+MentonStatics.SUPER_EXTRA_BALLS;
			var payoutt:int;
			var cost:int;
			
			if (extraCall)
			{
				extras++;
				if (round.extraStake.coinsEquivalent > 0) {
					cost = round.extraStake.coinsEquivalent;
					extraStake -= cost;
				}
				else extraFreeStakes++;
				ExtraControlCommand.ME.execute(new NewExtra(round));
				if (SlotBonusSession.ME.triggered && !bonusProcessed && PROCESS_BONUSES) processBonus();
				if (!((round.extraEnabled) || (round.superExtraEnabled && BUY_SUPER))) endRound();
				payoutt = round.lastDraw.additionalPayout;
				if (payoutt > 0){
					extraPayout += payoutt;
				}
				trace(_alignTextLeft("EXTRA " + round.extrasDrawn, 18), _alignTextLeft(extraPayout), _alignTextLeft(payoutt), _alignTextLeft(extraStake), _alignTextLeft(cost == 0 ? "FREE" : cost), "net extra " + ((extraPayout+extraStake)/extraStake).toFixed(2));
				
			}
			else if (superExtraCall)
			{
				supers++;
				if (round.extraStake.coinsEquivalent > 0) {
					cost = round.extraStake.coinsEquivalent;
					superStake -= cost;
				}
				else throw new AssukarError("round.extrasDrawn:" + round.extrasDrawn + " trueBonusDraws:" + round.trueBonusDraws);
				SuperExtraControlCommand.ME.execute(new NewSuperExtra(round));
				if (SlotBonusSession.ME.triggered && !bonusProcessed && PROCESS_BONUSES) processBonus();
				if (!((round.extraEnabled) || (round.superExtraEnabled && BUY_SUPER))) endRound();
				payoutt = round.lastDraw.additionalPayout;
				if (payoutt > 0){
					superPayout += payoutt;
				}
				trace(_alignTextLeft("SUPER " + round.extrasDrawn, 18), _alignTextLeft(superPayout), _alignTextLeft(payoutt), _alignTextLeft(superStake), _alignTextLeft(cost + ' (' + ((cost/20)>>0) + ')'), "net super " + ((superPayout+superStake)/superStake).toFixed(2));
				
			}
			else
			{
				throw new AssukarError(round.extrasDrawn);
			}
			

			if (round.extraEnabled || (round.superExtraEnabled && BUY_SUPER))
			{
				processExtra();
			}
		}
		
		private var round: Round;
		private var previousPayout: int;
		private var bonusProcessed: Boolean;
		
		override protected function processRound(): void
		{
			bonusProcessed = false;
			
			defaultRounds++;
			
			round = NewRoundControlCommand.ME.execute();

			if (SlotBonusSession.ME.triggered && !bonusProcessed && PROCESS_BONUSES) processBonus();
			
			if (!(round.extraEnabled && BUY_EXTRAS))
			{
				endRound();
			}
			
			defaultStake -= MentonEngine.ME.newRound.totalStake;
			defaultPayout += round.payout;
			
			previousPayout = round.payout;
			if (previousPayout>0) defaultPositivePayouts++;
			
			if (round.extraEnabled && BUY_EXTRAS)
			{
				processExtra();
			}
		}
		
		private function processBonus(): void
		{
			bonusProcessed = true;
			
			slotTriggers++;
			switch (SlotBonusSession.ME.prize)
			{
				case SlotBonusSession.X2:
					multiplierBonuses++;
					break;
				case SlotBonusSession.FRUIT:
					fruitBonuses++;
					break;
				case SlotBonusSession.BONUS:
					feteDuCitroinBonuses++;
					break;
			}
			
			if (SlotBonusSession.ME.fruitBombBonus && SlotBonusSession.ME.fruitBombBonus.pendingProcesssing)
			{
				SlotBonusSession.ME.fruitBombBonus.process();
			}
		}
		
		private function endRound(): void
		{
			var c: Cursor = round.cards.cursor;
			var c2: Cursor;
			while (c.next)
			{
				c2 = Card(c.current).patterns.cursor;
				while (c2.next) Pattern(c2.current).stats_fullMatches++;
			}
			
			winMultiplierPayout += round.winMultiplierPayout;
			
			if (SlotBonusSession.ME.feteDuCitroinBonus && !SlotBonusSession.ME.feteDuCitroinBonus.collected)
			{
				var bonus: FeteDuCitroinBonusSession = SlotBonusSession.ME.feteDuCitroinBonus;
				var indexes: NumberLinkedList = new NumberLinkedList().addRange(0,14);
				while (bonus.remainingCardsToPick > 0)
				{
					bonus.pickCard(indexes.removeRandom() as int);
				}
				
				while (!bonus.over)
				{
					feteDuCitroinBonusRounds++;
					bonus.walkTreadmill();
					bonus.chooseBox(int(Math.random()*3));
				}
				
				if (bonus.starCompleted) feteDuCitroinStars++;
				if (bonus.tucanCompleted) feteDuCitroinTucans++;
				if (bonus.crabCompleted) feteDuCitroinCrabs++;
				
				feteDuCitroinBonusPayout += bonus.payout*20;
				bonus.collect();
			}
		}

		// bonus
		private var slotTriggers: int = 0;

		// win multiplier bonus
		private var multiplierBonuses: int = 0;

		private var winMultiplierPayout: int = 0;

		// fruit bonuses
		private var fruitBonuses: int = 0;

		// main bonuses
		private var feteDuCitroinBonuses: int = 0;

		private var feteDuCitroinBonusPayout: int = 0;

		private var feteDuCitroinBonusRounds: int = 0;

		private var feteDuCitroinStars: int = 0;

		private var feteDuCitroinTucans: int = 0;

		private var feteDuCitroinCrabs: int = 0;


		override protected function start(): void
		{
			MentonEngine.ME.initiate();

			ROUNDS = 5000;
			PROCESS_BONUSES = true;
			BUY_EXTRAS = true;
			BUY_SUPER = true;
			MentonEngine.ME.newRound.unitaryStake = 100;
			VipStatus2.ME = new VipStatus2(0);
			
			PraiaControlInfo.ME.mentonFloat = 0.05;
			PraiaControlInfo.ME.mentonExtraMultiplee = 1.175;
			PraiaControlInfo.ME.mentonSuperExtraMultiplee = 1.088;
			PraiaControlInfo.ME.mentonFreeExtraProbs = [1,1,1,1,1,1,2,2,2];
		}
		
		override protected function finalize(i: int): void
		{
			Pattern.sortedPatterns.apply(function(p: Pattern): void
			{
				p.printStats(i*4);
			});
			
			if (defaultStake > 0) defaultStake *= -1;
			if (extraStake > 0) extraStake *= -1;
			if (superStake > 0) superStake *= -1;
			var stake: int = defaultStake+extraStake+superStake;
			var payout: int = defaultPayout+extraPayout+superPayout+feteDuCitroinBonusPayout+winMultiplierPayout;
			
			print(defaultRounds + " rounds in " + timestamp.elapsed + " ms. " + ((timestamp.elapsed)/i)+" ms:round maxStake:" + MentonEngine.ME.newRound.maxStake);
			print("DEFAULT\nrounds:" + defaultRounds + " stake:"+defaultStake+" payout:"+defaultPayout+" positives:"+(defaultPositivePayouts/defaultRounds).toFixed(2)+" net:"+((defaultPayout+defaultStake)/defaultStake).toFixed(2));
			print("EXTRA\nentries:" + extraEntries + " extras:" + extras + " stake:"+extraStake+" payout:"+extraPayout+" net:"+((extraPayout+extraStake)/extraStake).toFixed(2));
			print("SUPER\nentries:" + superEntries + " extras:" + supers + " stake:"+superStake+" payout:"+superPayout+" net:"+((superPayout+superStake)/superStake).toFixed(2));
			print("SLOT\ntriggers:" + slotTriggers + " " + (slotTriggers/defaultRounds).toFixed(2));
			print("MULTIPLIER\ntriggers:" + multiplierBonuses + " " + (multiplierBonuses/defaultRounds).toFixed(3) + " payout:" + winMultiplierPayout);
			print("FRUIT\ntriggers:" + fruitBonuses + " " + (fruitBonuses/defaultRounds).toFixed(3) + " nilMatches:" + FruitBombBonusSession.nilMatches + " trueMatches:" + FruitBombBonusSession.trueMatches);
			print("FETEDUCITROIN\ntriggers:" + feteDuCitroinBonuses + " " + (feteDuCitroinBonuses/defaultRounds).toFixed(3) + " rounds:" + feteDuCitroinBonusRounds + " payout:" + feteDuCitroinBonusPayout + " stars:" + feteDuCitroinStars + " tucans:" + feteDuCitroinTucans + " crabs:" + feteDuCitroinCrabs);
			print("OVERALL\nstake:"+stake+" payout:"+payout+" net:"+((payout+stake)/stake).toFixed(3));
			
			print("\njackpotxp: " + MentonJackpotSession.ME.getExpectation() + " " + PatternGroup.FULL.getPayoutExpectation(10));

			print(printStats(stake));
		}

		private function printStatsBatch(stake : int, ...patterns) : String
		{
			var payout : int = 0;
			var occs : int = 0;
			for each (var p : Pattern in patterns)
			{
				if (p.group.basePayout) payout += p.stats_fullMatches * p.group.basePayout.coinsEquivalent;
				occs += p.stats_fullMatches;
			}
			return "$" + payout + " " + occs + " " + Number(Number(100*-payout)/stake).toFixed(2) + "%";
		}

		private function printStats(stake : int) : String
		{
			var str : String = "";
			str += "\nLINE: " + printStatsBatch(stake, Pattern.LINE_1, Pattern.LINE_2, Pattern.LINE_3);
			str += "\nDOUBLE_COLUMN: " + printStatsBatch(stake, Pattern.DOUBLE_COLUMN_1, Pattern.DOUBLE_COLUMN_2, Pattern.DOUBLE_COLUMN_3, Pattern.DOUBLE_COLUMN_4);
			str += "\nTRIPLE_COLUMN: " + printStatsBatch(stake, Pattern.TRIPLE_COLUMN_1, Pattern.TRIPLE_COLUMN_2, Pattern.TRIPLE_COLUMN_3);
			str += "\nDOUBLE_LINE: " + printStatsBatch(stake, Pattern.DOUBLE_LINE_1, Pattern.DOUBLE_LINE_2, Pattern.DOUBLE_LINE_3);
			str += "\nQUAD_COLUMN: " + printStatsBatch(stake, Pattern.QUAD_COLUMN_1, Pattern.QUAD_COLUMN_2);
			str += "\nQUAD_COLUMN_3: " + printStatsBatch(stake, Pattern.QUAD_COLUMN_3);
			str += "\nFULL: " + printStatsBatch(stake, Pattern.FULL);
			return str;
		}
	}
}
