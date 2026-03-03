package com.assukar.praia.menton.domain
{
	import com.assukar.airong.ds.LinkedList;
	import com.assukar.airong.error.AssukarError;
	import com.assukar.domain.domain.StatsMoney;
	import com.assukar.engine.utils.AntiCheatInt;
	import com.assukar.praia.domain.PraiaStatsAction;
	import com.assukar.praia.main.PraiaContext;
	import com.assukar.praia.menton.main.MentonEngine;
	/**
	 * @author Assukar
	 */
	public class FeteDuCitroinBonusSession
	extends BonusSession
	{
		static public const _1_ROUND: String = "1";
		static public const _2_ROUNDS: String = "2";
		static public const _3_ROUNDS: String = "3";
		static public const CROWBAR: String = "W";
		static public const HAMMER: String = "H";
		static public const SLEDGEHAMMER: String = "S";

		static private const CARD_LIST: LinkedList = new LinkedList(
			_1_ROUND,_1_ROUND,_1_ROUND,_1_ROUND,_1_ROUND, // 4
			_2_ROUNDS,_2_ROUNDS,_2_ROUNDS,_2_ROUNDS, // 3
			_3_ROUNDS, _3_ROUNDS,_3_ROUNDS, // 2
			HAMMER, // 1
			CROWBAR, // 1
			SLEDGEHAMMER);//, // 1
			
		// type of boxes
		static public const LEMON_BOX_SMALL: int = 1;
		static public const LEMON_BOX_MEDIUM: int = 3;
		static public const LEMON_BOX_LARGE: int = 5;
			
		static private const LEMON_BOXES: LinkedList = new LinkedList(LEMON_BOX_SMALL,LEMON_BOX_MEDIUM,LEMON_BOX_LARGE);
			
		static private const CARDS_TO_PICK_UP: int = 5;//5
		static public const STAR_LEMONS: int = 5;
		static public const TUCAN_LEMONS: int = 11;
		static public const CRAB_LEMONS: int = 16;
		
		static private const STAR_PAYOUT: int = 2;
		static private const TUCAN_PAYOUT: int = 5;
		static private const CRAB_PAYOUT: int = 20;
		
		static public function get starPayout(): int
		{
			return STAR_PAYOUT * MentonEngine.ME.unitaryStake; 
		}
		
		static public function get tucanPayout(): int
		{
			return TUCAN_PAYOUT * MentonEngine.ME.unitaryStake; 
		}
		
		static public function get crabPayout(): int
		{
			return CRAB_PAYOUT * MentonEngine.ME.unitaryStake; 
		}
		
		public var starCompleted: Boolean = false;
		public var tucanCompleted: Boolean = false;
		public var crabCompleted: Boolean = false;
		
		private var cardList: LinkedList;
		private var pickedIndexes: LinkedList = new LinkedList();
		private var pickedList: LinkedList = new LinkedList();
		
		private var _lemons: AntiCheatInt = AntiCheatInt.ZERO;
		
		private var _rounds: AntiCheatInt = AntiCheatInt.ZERO;
		private var _pendingBoxesToOpen: AntiCheatInt = AntiCheatInt.ZERO;
		
		private var lemonBoxes: Vector.<int> = new <int>[];
		
		public var collected: Boolean = false;
		private var powerUsedThisRound: Boolean = false;
		
		public function toString(): String
		{
			var str: String = "";
			for (var i: int = 0; i < 3; i++)
			{
				for (var j: int = 0; j < 5; j++)
				{
					var index: int = i*5+j;
					var revealed: Boolean = pickedIndexes.contains(index);
					str += (revealed?"[":" ") + cardList.get(index) + (revealed?"]":" ") + " ";
				}
				str += "\n";
			}
			str += "--------------------------\n";
			if (hasCrowbar) str += "CROWBAR" + (canUseCrowbar?" USABLE":"") + "\n";
			if (hasHammer) str += "HAMMER" + (canUseHammer?" USABLE":"") + "\n";
			if (hasSledgehammer) str += "SLEDGEHAMMER" + (canUseSledgehammer?" USABLE":"") + "\n";
			if (starCompleted) str += "STAR COMPLETED\n";
			if (tucanCompleted) str += "TUCAN COMPLETED\n";
			if (crabCompleted) str += "CRAB COMPLETED\n";
			str += "ROUNDS:" + rounds + " PENDING:" + pendingBoxesToOpen + "\n";
			str += "PAYOUT:" + payout + " COLLECTED:" + collected + "\n";
			return "FeteDuCitroinBonusSession[\n" + str + "]";
		}
		
		public function FeteDuCitroinBonusSession()
		{
			CARD_LIST.shuffle2();
			cardList = CARD_LIST.clone() as LinkedList;
		}
		
		public function get remainingCardsToPick(): int
		{
			return CARDS_TO_PICK_UP - pickedIndexes.size;
		}
		
		// return a card. index from 0 to 14
		public function pickCard(index: int): String
		{
			if (!remainingCardsToPick) throw new AssukarError();
			if (pickedIndexes.contains(index)) throw new AssukarError();
			pickedIndexes.push(index);
			var symbol: String = cardList.get(index) as String;
			pickedList.push(symbol);
			switch (symbol)
			{
				case _1_ROUND: rounds += 1; break;
				case _2_ROUNDS: rounds += 2; break;
				case _3_ROUNDS: rounds += 3; break;
			}
			return symbol;
		}
		
		public function get canUseCrowbar(): Boolean
		{
			return hasCrowbar && !powerUsedThisRound; 
		}
		
		public function get canUseHammer(): Boolean
		{
			return hasHammer && !powerUsedThisRound; 
		}
		
		public function get canUseSledgehammer(): Boolean
		{
			return hasSledgehammer && !powerUsedThisRound;
		}
		
		public function get hasCrowbar(): Boolean
		{
			return pickedList.contains(CROWBAR);
		}
		
		public function get hasHammer(): Boolean
		{
			return pickedList.contains(HAMMER);
		}
		
		public function get hasSledgehammer(): Boolean
		{
			return pickedList.contains(SLEDGEHAMMER);
		}
		
		// returns an array of 2 positions:
		// 0: index of the box (from 0 to 2)
		// 1: type of box
		public function useCrowbar(ix: int): int
		{
			if (!canUseCrowbar) throw new AssukarError();
			pickedList.removeObject(CROWBAR);
			return lemonBoxes[ix];
		}
		
		public function useHammer(): void
		{
			if (!canUseHammer) throw new AssukarError();
			pickedList.removeObject(HAMMER);
			powerUsedThisRound = true;
			pendingBoxesToOpen = 2;
		}
		
		public function useSledgehammer(): void
		{
			if (!canUseSledgehammer) throw new AssukarError();
			pickedList.removeObject(SLEDGEHAMMER);
			powerUsedThisRound = true;
			pendingBoxesToOpen = 3;
		}
		
		public function get over(): Boolean
		{
			return rounds == 0 && pendingBoxesToOpen == 0;
		}
		
		public function walkTreadmill(): void
		{
			if (!rounds) throw new AssukarError();
			if (pendingBoxesToOpen) throw new AssukarError("pendingBoxesToOpen:" + pendingBoxesToOpen);
			
			rounds--;
			pendingBoxesToOpen = 1;
			powerUsedThisRound = false;
			
			LEMON_BOXES.shuffle2();
			lemonBoxes[0] = LEMON_BOXES.get(0);			
			lemonBoxes[1] = LEMON_BOXES.get(1);
			lemonBoxes[2] = LEMON_BOXES.get(2);
		}
		
		public function collect(): void
		{
			if (collected) throw new AssukarError();
			collected = true;
			PraiaContext.ME.hudServices.addMoney(new StatsMoney(payout), PraiaStatsAction.MENTON_PAYOUTBONUS);
		}
		
		public function get payout(): int
		{
			var payoutt: int = 0;
			if (starCompleted) payoutt += STAR_PAYOUT; 
			if (tucanCompleted) payoutt += TUCAN_PAYOUT;
			if (crabCompleted) payoutt += CRAB_PAYOUT;
			payoutt *= MentonEngine.ME.newRound.unitaryStake;
			return payoutt;	
		}
		
		public function get lemons():int {
			return _lemons.value;
		}
		
		public function set lemons(value:int):void {
			_lemons.value = value;
		}
		
		public function get rounds():int {
			return _rounds.value;
		}
		
		public function set rounds(value:int):void {
			_rounds.value = value;
		}
		
		public function get pendingBoxesToOpen():int {
			return _pendingBoxesToOpen.value;
		}
		
		public function set pendingBoxesToOpen(value:int):void {
			_pendingBoxesToOpen.value = value;
		}
		
		private function addLemons(lemonsAdded: int): void
		{
			var lemons1: int = lemons;	
			lemons += lemonsAdded;
			
			if (!starCompleted)
			{
				if (lemons1 < STAR_LEMONS && lemons >= STAR_LEMONS)
				{
					starCompleted = true;
					pendingBoxesToOpen = 0;
					lemons = 0;
				}
			}
			else if (!tucanCompleted)
			{
				if (lemons1 < TUCAN_LEMONS && lemons >= TUCAN_LEMONS)
				{
					tucanCompleted = true;
					pendingBoxesToOpen = 0;
					lemons = 0;
				}
			}
			else if (!crabCompleted)
			{
				if (lemons1 < CRAB_LEMONS && lemons >= CRAB_LEMONS)
				{
					crabCompleted = true;
					pendingBoxesToOpen = 0;
					lemons = 0;
					rounds = 0;
				}
			}
		}
		
		public function getLemonBoxes(index: int): int
		{
			return lemonBoxes[index];
		}
		
		public function chooseBox(index: int): int
		{
			if (!pendingBoxesToOpen) throw new AssukarError("!pendingBoxesToOpen");
			if (lemonBoxes[index] <= 0) throw new AssukarError();
			pendingBoxesToOpen--;
			addLemons(lemonBoxes[index]);
//			Utils.print("lemonBoxes[" + index + "]:" + lemonBoxes[index]);
			return lemonBoxes[index]; //
		}
	}
}
