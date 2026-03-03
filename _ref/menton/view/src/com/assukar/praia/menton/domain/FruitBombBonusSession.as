package com.assukar.praia.menton.domain
{
	import com.assukar.airong.ds.LinkedList;
	import com.assukar.airong.error.AssukarError;
	import com.assukar.domain.domain.StatsMoney;
	import com.assukar.praia.domain.PraiaStatsAction;
	import com.assukar.praia.main.PraiaContext;
	/**
	 * @author Assukar
	 */
	public class FruitBombBonusSession
	extends BonusSession
	{
		static public var nilMatches: int = 0;
		static public var trueMatches: int = 0;
		
		private var round : Round;
		public var pendingProcesssing : Boolean = true;

		function FruitBombBonusSession(round : Round)
		{
			this.round = round;
		}
		
		// positions for the top/leftmost slot of the bomb
		public var bombPositions: Vector.<SlotPosition> = new <SlotPosition>[];
		
		public function process(): void
		{
			if (!pendingProcesssing) throw new AssukarError();
			pendingProcesssing = false;
			
			var list: LinkedList = new LinkedList(0,1,2,3,5,6,7,8);
			
			for (var i: int = 0; i < 4; i++)
			{
				var position: SlotPosition = new SlotPosition(round.cards, i);
				
				var s: int = list.getRandom() as int;
				position.line = s/5;
				position.column = s%5;  
				position.resetBall();
				
				bombPositions.push(position);
				
				processBallMatch(position, position.line, position.column);
				processBallMatch(position, position.line, position.column+1);
				processBallMatch(position, position.line+1, position.column+1);
				processBallMatch(position, position.line+1, position.column);
			}
			
//			Utils.wraplog("ballIndex:" + round.ballIndex + " extrasDrawn:" + round.extrasDrawn);
			round.evaluateExtra();
			if (round.extraEnabled) round.calculateExtraStakes();
//			Utils.wraplog("extraStakes:" + round.extraStakes);
		}
		
		private function processBallMatch(position: SlotPosition, line: int, column: int): void
		{
			var ball: int = position.retrieveBall(line, column);
			
			if (position.card.matches[line][column])
			{
				nilMatches++;
			}
			else
			{
				trueMatches++;
				round.draw(ball);
				PraiaContext.ME.hudServices.addLockedMoney(StatsMoney.makeCoins(round.lastDraw.additionalPayout), PraiaStatsAction.MENTON_FRUIT_BOMBS);
				
				if (round.balls.removeObject(ball)) round.trueBonusDraws++;
			}
		}
	}
}
