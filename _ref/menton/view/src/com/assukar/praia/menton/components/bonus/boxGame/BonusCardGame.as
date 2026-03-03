package com.assukar.praia.menton.components.bonus.boxGame 
{
	import com.assukar.domain.services.dictio.Dictio;
	import com.assukar.praia.assets.Fonts;
	import com.assukar.praia.menton.assets.MentonAssets;
	import com.assukar.praia.menton.components.bonus.cardGame.CardBonus;
	import com.assukar.praia.menton.domain.FeteDuCitroinBonusSession;
	import com.assukar.view.starling.AssukarJuggler;
	import com.assukar.view.starling.AssukarTextField;
	import com.assukar.view.starling.Component;
	import com.assukar.view.starling.TouchableComponent;
	import flash.geom.Point;
	import starling.events.Touch;


	/**
	 * ...
	 * @author Igor Henrique Santos
	 */
	public class BonusCardGame extends Component
	{
		private var numberLabel:AssukarTextField;
		private var boxList:Vector.<CardBonus>;
		private var boxPos:Vector.<Point>;
		public static const TOTAL_CARDS_BONUS:int = 15; 
		public var callbackFinish:Function;
		public var countCards:int = 0;
		public var maxCardsOpen:int=0; 
		private var totalCardsBomb:Vector.<CardBonus>;
		private var session:FeteDuCitroinBonusSession;
		public var panelTotalRounds:Component;
		public var countLabel:AssukarTextField;
		private var countRoundSession:int = 0;
		
		public function BonusCardGame() {}
		
		public function init(feteDuCitroinBonusSession:FeteDuCitroinBonusSession):void
		{
			this.session = feteDuCitroinBonusSession;
			
			countRoundSession = 0;
			updateCount("0");
			numberLabel.text = this.session.remainingCardsToPick.toString();
			
		}
		
		override public function dispose():void 
		{
			for (var i:int = 0; i < totalCardsBomb.length; i++) 
				AssukarJuggler.ME.removeTweens(totalCardsBomb[i]);
			
			super.dispose();
		}
		
		override protected function draww():void 
		{
			super.draww();
			
			var keyPick:String = Dictio.upper("mentonpickcard");
			var keyCard:String = Dictio.upper("mentoncardspick");
			
			var pickLabel:AssukarTextField = addText(180, 70, keyPick, Fonts.RUMPELSTILTSKIN, {border:false, x:170, y:25, fontSize:40, color:0xffffff, resizeOffset:true } );
			numberLabel = addText(130, 80, "", Fonts.RUMPELSTILTSKIN, {border:false, x:(pickLabel.x+pickLabel.width)-60, y:16, fontSize:80, color:0xffffff, resizeOffset:true } );
			addText(180, 70, keyCard, Fonts.RUMPELSTILTSKIN, {border:false, x:(numberLabel.x + numberLabel.width)-60, y:25, fontSize:40, color:0xffffff, resizeOffset:true } );
			
			boxList = new Vector.<CardBonus>();
			totalCardsBomb = new Vector.<CardBonus>();
			boxPos = new Vector.<Point>();
			
			var countX:int = 0;
			var initialX:int = 80;
			var posX:int = initialX;
			var posY:int = 200;
			
			for (var i:int = 0; i < TOTAL_CARDS_BONUS; i++) 
			{
				var cardBonus:CardBonus = addComp(new CardBonus(i).draw(), { x:posX, y:posY, centerPivots:true } );
				
				boxList.push(cardBonus);
				cardBonus.RELEASE.listen(flipCard);
				countX++;
				
				if (countX == 5)
				{
					countX = 0;
					posX = initialX;
					posY += cardBonus.height+20;
				}
				else
				{
					posX += cardBonus.width+20; 
				}
				
				boxPos.push(new Point(cardBonus.x,cardBonus.y));
			}
			
			panelTotalRounds = addComp(Component, { x:200, y:580 } );
			panelTotalRounds.addImage(MentonAssets.ME.texture("round_pannel"));
			
			var keyRounds:String = Dictio.upper("Rounds");
			countLabel = panelTotalRounds.addText(300, 80, countRoundSession + " " + keyRounds, Fonts.RUMPELSTILTSKIN, {x:20,fontSize:80, resizeOffset:true, color:0xffffff } );
			
		}
		
		public function enableCards():void
		{
			for (var i:int = 0; i < TOTAL_CARDS_BONUS; i++) 
			{
				boxList[i].enable();
				boxList[i].touchable = true;
			}
		}
		
		public function resetCards():void
		{
			for (var i:int = 0; i < TOTAL_CARDS_BONUS; i++) 
			{
				boxList[i].back.visible = true;
				boxList[i].scaleX = boxList[i].scaleY = 1;
				boxList[i].x = boxPos[i].x;
				boxList[i].y = boxPos[i].y;
				boxList[i].hideItens();	
			}
			
			totalCardsBomb = new Vector.<CardBonus>();
		}
		
		public function disableCards():void
		{
			for (var i:int = 0; i < TOTAL_CARDS_BONUS; i++) 
			{
				boxList[i].disable();
				boxList[i].touchable = false;
			}
		}
		
		private function flipCard(tc:TouchableComponent,t:Touch):void
		{
			var currentCard:CardBonus = tc as CardBonus;
			currentCard.disable();
			currentCard.touchable = false;
			
			var symbol:String = this.session.pickCard(currentCard.index);
			totalCardsBomb.push(currentCard);
			AssukarJuggler.ME.tween(currentCard, 0.1, { scaleX:0, onComplete:finishFlip, onCompleteArgs:[currentCard,symbol] } );
			
			countCards++;
			if (countCards >= maxCardsOpen)
			{
				disableCards();
				callbackFinish();
			}
		}
		
		private function finishFlip(currentCard:CardBonus,symbol:String):void
		{
			updateCount(symbol);
			
			currentCard.showSymbol(symbol);
			currentCard.back.visible = false;
			AssukarJuggler.ME.tween(currentCard, 0.1, { scaleX:1 } );
			
//			var pick:String = Dictio.upper("mentonpickcard");
//			var text:String = Dictio.upper("mentoncardspick");
			
			numberLabel.text = this.session.remainingCardsToPick.toString();
		}
		
		
		public function bombCards():void
		{
			for (var i:int = 0; i < totalCardsBomb.length; i++) 
			{
				if(i==(totalCardsBomb.length-1))
					AssukarJuggler.ME.tween(totalCardsBomb[i], 0.1, { scaleX:1.2,scaleY:1.2, onComplete:bombOff } );
				else
					AssukarJuggler.ME.tween(totalCardsBomb[i], 0.1, { scaleX:1.2,scaleY:1.2 } );
			}
		}
		
		public function bombOff():void
		{
			for (var i:int = 0; i < totalCardsBomb.length; i++) 
				AssukarJuggler.ME.tween(totalCardsBomb[i], 0.1, { scaleX:1, scaleY:1 } );
				
			moveWeaponsToHud();
		}
		
		
		private function moveWeaponsToHud():void
		{
			var pointsToHud:Vector.<Point> = new Vector.<Point>();
			pointsToHud.push(new Point(645,-130));//pos1;
			pointsToHud.push(new Point(645, 30));//pos2;
			pointsToHud.push(new Point(645, 175));//pos3;
			
			var symbols:Array = [];
			
			for (var j:int = 0; j < totalCardsBomb.length; j++) 
			{
				if (totalCardsBomb[j].mySymbol == FeteDuCitroinBonusSession.CROWBAR ||
					totalCardsBomb[j].mySymbol == FeteDuCitroinBonusSession.HAMMER ||
					totalCardsBomb[j].mySymbol == FeteDuCitroinBonusSession.SLEDGEHAMMER)
				{
					symbols.push(totalCardsBomb[j].mySymbol);
				}
			}
			
			checkWeaponAvailable(symbols,pointsToHud,totalCardsBomb,FeteDuCitroinBonusSession.CROWBAR);
			checkWeaponAvailable(symbols,pointsToHud,totalCardsBomb,FeteDuCitroinBonusSession.HAMMER);
			checkWeaponAvailable(symbols,pointsToHud,totalCardsBomb,FeteDuCitroinBonusSession.SLEDGEHAMMER);
		}
		
		private function checkWeaponAvailable(symbols:Array,pointsToHud:Vector.<Point>,totalCardsBomb:Vector.<CardBonus>,currentSymbol:String):void
		{
			var scaleComp:Number = 0.7;
			var point:Point;
			if (symbols.indexOf(currentSymbol) != -1)
			{
				point = pointsToHud.shift();
				for (var k:int = 0; k < totalCardsBomb.length; k++) 
				{
					if (totalCardsBomb[k].mySymbol == currentSymbol)
						AssukarJuggler.ME.tween(totalCardsBomb[k], 0.5, { x:point.x, y:point.y, scaleX:scaleComp, scaleY:scaleComp } );
				}
			}
		}
		
		private function updateCount(symbol:String):void
		{
			var roundsCount:int = int(symbol);
			
			var keyRounds:String;
			
			countRoundSession += roundsCount;
			
			if(countRoundSession <= 1)
				keyRounds = Dictio.upper("Round");
			else
				keyRounds = Dictio.upper("Rounds");
				
			
			countLabel.text = countRoundSession.toString() +  " " + keyRounds;
		}
	}

}