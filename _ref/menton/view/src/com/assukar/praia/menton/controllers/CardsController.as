package com.assukar.praia.menton.controllers 
{
	import com.assukar.airong.ds.Cursor;
	import com.assukar.airong.ds.Hashtable;
	import com.assukar.airong.utils.Singleton;
	import com.assukar.praia.menton.components.bellPanel.BellPanel;
	import com.assukar.praia.menton.components.cards.CardPanel;
	import com.assukar.praia.menton.components.cards.Cardd;
	import com.assukar.praia.menton.components.cards.Slot;
	import com.assukar.praia.menton.domain.Card;
	import com.assukar.praia.menton.domain.Draw;
	import com.assukar.praia.menton.domain.NewRound;
	import com.assukar.praia.menton.domain.SlotBonusSession;

	/**
	 * @author Johnatan
	 */
	public class CardsController
	{
		// singleton
		static public var ME: CardsController;
		// map of Card to Cardd
		private var cardHash: Hashtable = new Hashtable();
		private var showMissingg: Boolean;
		private var blink: Boolean;
		
		public function dispose(): void
		{
			ME = null;
		}

		public function CardsController()
		{
			Singleton.enforce(ME);
		}

		public function clear(): void
		{
//			for (var i: int = 0; i<4; i++) CardPanel.ME.getCard(i).clear();
			CardPanel.ME.clear();
			BellPanel.ME.resetPanel();
//			Slot.missingMotion.clearAndStop();
			showMissingg = true;//false;
			blink = false;
		}

		public function setNumbers(newRound: NewRound): void
		{
			for (var i: int = 0; i<4; i++)
			{
				var c: Card = newRound.cards.get(i);
				var cc: Cardd = CardPanel.ME.getCard(i);
				cc.card = c;
				cardHash.put(c, cc);
				cc.setNumbers(c.numbersList);
			}
			
			setBells();
		}
		
		private function setBells():void
		{
			//reset all bells
			for (var j:int = 0; j < 4; j++) 
			{
				var card:Vector.<Vector.<Slot>>= CardPanel.ME.getCard(j).getAllSlots();
				for (var k:int = 0; k < card.length; k++) 
				{
					for (var l:int = 0; l < card[k].length; l++) 
						card[k][l].bellState.visible = false;
				}	
			}
			
			//insert bell in card
			for (var i:int = 0; i < SlotBonusSession.ME.positions.length; i++) 
			{
				var currentCard:Cardd = CardPanel.ME.getCard(SlotBonusSession.ME.positions[i].cardIndex);
				var bellSlot:Slot = currentCard.getSlotByNumber(SlotBonusSession.ME.positions[i].ball);
				
				if (bellSlot)
					bellSlot.bellState.visible = true;
			}
			
		}

		public function showMissing(): void
		{
			if (!showMissingg)
			{
				var c: Cursor = cardHash.keys;
				while (c.next) Cardd(cardHash.get(c.current)).showHoldingMissingBalls();
				showMissingg = true;
			}
		}
		
		public function get showingMissing(): Boolean
		{
			return showMissingg;
		}
		
		public function startBlinking(): void
		{
			blink = true;
		}
		
		public function processDraw(draw: Draw): void
		{
			if (draw.affectedCard)
			{
				var cc: Cardd = cardHash.get(draw.affectedCard);
				cc.setCardMatches(draw.cardMatches, showMissingg, blink);
			}
		}

		public function registerPressListeners(cardPressHandler: Function): void
		{
			for (var i: int = 0; i<4; i++)
			{
				CardPanel.ME.getCard(i).PRESS.listen(cardPressHandler);
			}
		}
	}
}
