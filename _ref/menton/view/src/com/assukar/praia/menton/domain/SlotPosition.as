package com.assukar.praia.menton.domain
{
	import com.assukar.airong.ds.LinkedList;
	/**
	 * @author Assukar
	 */
	public class SlotPosition
	{
		public var card: Card;
		public var cardIndex: int;
		public var line: int;
		public var column: int;
		public var ball: int;
		public var hit: Boolean = false;
		
		public function toString(): String
		{
			return "SlotPosition[" + cardIndex + "," + line + "," + column + "," + ball + "," + hit + "]";
		}
		
		public function resetBall(): void
		{
			ball = -1;
		}
		
		function SlotPosition(cards: LinkedList, cardIndex: int)
		{
			this.cardIndex = cardIndex;
			
			line = int(Math.random() * 9999) % 3;			
			column = int(Math.random() * 9999) % 5;
			
			card = cards.get(cardIndex);
			ball = retrieveBall(line, column);
			 	 
//			Utils.wraplog("line:" + line + " column:" + column + " ball:" + ball + " balls::" + card.numbersList + " ix::" + (line + column*3));
		}

		public function retrieveBall(line : int, column : int) : int
		{
			return card.numbersList.get(line + column*3) as int;
		}
	}
}
