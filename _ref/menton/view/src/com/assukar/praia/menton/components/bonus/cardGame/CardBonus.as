package com.assukar.praia.menton.components.bonus.cardGame 
{
	import starling.display.Image;
	import starling.textures.TextureSmoothing;

	import com.assukar.airong.error.AssukarError;
	import com.assukar.domain.services.dictio.Dictio;
	import com.assukar.praia.assets.Fonts;
	import com.assukar.praia.menton.assets.MentonAssets;
	import com.assukar.praia.menton.domain.FeteDuCitroinBonusSession;
	import com.assukar.view.starling.AssukarTextField;
	import com.assukar.view.starling.Component;
	import com.assukar.view.starling.TouchableComponent;
	/**
	 * ...
	 * @author Igor Henrique Santos
	 */
	public class CardBonus extends TouchableComponent
	{
		
		public var front:Component;
		public var back:Component;
		public var index:int;
		private var roundsComp:Component;
		private var valueRound:AssukarTextField;
		private var weaponComp:Component;
		private var weaponsList:Vector.<Image>;
		public var mySymbol:String;
		
		public function CardBonus(p_index:int) 
		{
			this.index = p_index;
		}
		
		override protected function draww():void 
		{
			super.draww();
			
			front = addComp();
			front.addImage(MentonAssets.ME.texture("card2"));
			back = addComp();
			back.addImage(MentonAssets.ME.texture("card1"));
			
			var keyRound:String = Dictio.upper("Rounds");
			roundsComp = addComp();
			valueRound = roundsComp.addText(this.width, 100, "", Fonts.RUMPELSTILTSKIN, { color:0x0033FF, fontSize:70 } );
			roundsComp.addText(this.width, 50, keyRound, Fonts.RUMPELSTILTSKIN, { color:0x0033FF, fontSize:30, y:70 } );
			
			weaponComp = addComp();
			weaponsList = new Vector.<Image>();
			
			for (var i:int = 0; i < 3; i++) 
				weaponsList.push(weaponComp.addImage(MentonAssets.ME.texture("tool"+(i+1)),{x:40,y:20,scaleX:0.7,scaleY:0.7,smoothing: TextureSmoothing.BILINEAR}));
			
			hideItens();
		}
		
		override public function dispose():void 
		{
			super.dispose();
		}
		
		public function showSymbol(symbol:String):void
		{
			hideItens();
			
			switch (symbol) 
			{
				case FeteDuCitroinBonusSession._1_ROUND:
					show(roundsComp);
					valueRound.text = "+" + FeteDuCitroinBonusSession._1_ROUND;
				break;
				case FeteDuCitroinBonusSession._2_ROUNDS:
					show(roundsComp);
					valueRound.text = "+" + FeteDuCitroinBonusSession._2_ROUNDS;
				break;
				case FeteDuCitroinBonusSession._3_ROUNDS:
					show(roundsComp);
					valueRound.text = "+" + FeteDuCitroinBonusSession._3_ROUNDS;
				break;
				case FeteDuCitroinBonusSession.CROWBAR:
					show(weaponsList[0]);
				break;
				case FeteDuCitroinBonusSession.HAMMER:
					show(weaponsList[1]);
				break;
				case FeteDuCitroinBonusSession.SLEDGEHAMMER:
					show(weaponsList[2]);
				break;
				default:
					throw new AssukarError("WRONG TYPE OF CARD:>>> " + symbol + " <<<");
				break;
			}
			
			mySymbol = symbol;
		}
		
		public function hideItens():void
		{
			hide(roundsComp);
			
			for (var i:int = 0; i < weaponsList.length; i++) 
				hide(weaponsList[i]);
		}
		
	}

}