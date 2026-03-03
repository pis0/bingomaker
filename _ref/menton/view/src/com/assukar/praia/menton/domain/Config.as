package com.assukar.praia.menton.domain
{
	import com.assukar.airong.ds.Cursor;
	import com.assukar.airong.ds.LinkedList;
	import com.assukar.airong.ds.NumberLinkedList;
	import com.assukar.airong.utils.Singleton;
	
	public class Config
	{
		// singleton
		static public const ME: Config = new Config();
		// list of numbers
		private var numbersList: NumberLinkedList = new NumberLinkedList();
		
		function Config()
		{
			Singleton.enforce(ME);
			Pattern.start();
			numbersList.addRange(1, 90);
		}
		
		public function dispose(): void
		{
		}
		
		public function createCards(newRound: NewRound): LinkedList
		{
			var cards: LinkedList = new LinkedList();
			for (var i: int = 0; i < 4; i++) cards.push(new Card(newRound, i));
			return cards;
		}
		
		public function shuffle(cards: LinkedList): void
		{
			var c: Cursor = cards.cursor;
			
			numbersList.shuffle2();
			
			var i: int = 0; 
			while (c.next)
			{
				Card(c.current).setNumbers(numbersList, i*15, (i+1)*15);
				i++;
			}
		}		
	}
}
