package com.assukar.praia.menton.domain
{
	import com.assukar.airong.ds.LinkedList;
	import com.assukar.domain.domain.RemoteProps;
	import com.assukar.domain.domain.StatsMoney;
	import com.assukar.praia.domain.games.vbs.VBNewRound;

	
	public class NewRound
	extends VBNewRound
	{
		public var cards: LinkedList;
		
		public function NewRound()
		{
			super(RemoteProps.ME.props.asIntVector('Stake.Set.Menton') || new <int>[1,2,3,5,10,25,50,100]);
			walkStake();
			cards = Config.ME.createCards(this);
			shuffle();
		}
		
		private function get multiplier():int {
			return RemoteProps.ME.props.asIntOr('Stake.Cost.Menton', 4);
		}
		
		public function get totalStake(): int
		{
			return unitaryStake * multiplier;
		}
		
		override public function getMoney(): StatsMoney
		{
			return StatsMoney.makeCoins(-unitaryStake).multiply(multiplier);
		}

		override public function shuffle(): void
		{
			Config.ME.shuffle(cards);
		}
	}
}
