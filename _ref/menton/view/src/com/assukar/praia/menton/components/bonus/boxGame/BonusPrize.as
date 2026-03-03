package com.assukar.praia.menton.components.bonus.boxGame 
{
	import com.assukar.domain.services.dictio.Dictio;
	import com.assukar.praia.assets.Fonts;
    import com.assukar.praia.components.FontResolver;
    import com.assukar.praia.menton.assets.MentonAssets;
	import com.assukar.view.starling.AssukarTextField;
	import com.assukar.view.starling.Component;
	/**
	 * ...
	 * @author Igor Henrique Santos
	 */
	public class BonusPrize extends Component
	{
		private var labelValue:AssukarTextField;
		
		private static const AMOUNT_LEVEL2:int 	= 3;
		private static const AMOUNT_LEVEL3:int 	= 6;
		private static const AMOUNT_LEVEL4:int 	= 7;
		private static const AMOUNT_LEVEL5:int 	= 20;
		private static const AMOUNT_LEVEL6:int  = 200;
		
		private var amountLevel1:Component;
		private var amountLevel2:Component;
		private var amountLevel3:Component;
		private var amountLevel4:Component;
		private var amountLevel5:Component;
		private var amountLevel6:Component;
		
		public function BonusPrize() {}
		
		override protected function draww():void 
		{
			super.draww();
			
			amountLevel1 = addComp();
			amountLevel2 = addComp();
			amountLevel3 = addComp();
			amountLevel4 = addComp();
			amountLevel5 = addComp();
			amountLevel6 = addComp();
			
			amountLevel1.addImage(MentonAssets.ME.texture("motante01"), { x:180, y:0 } );
			
			amountLevel2.addImage(MentonAssets.ME.texture("motante02"),{x:180,y:0});
			
			amountLevel3.addImage(MentonAssets.ME.texture("motante01"),{x:160,y:0});
			amountLevel3.addImage(MentonAssets.ME.texture("motante02"),{x:200,y:0});
			
			amountLevel4.addImage(MentonAssets.ME.texture("motante02"),{x:160,y:0});
			amountLevel4.addImage(MentonAssets.ME.texture("motante02"), { x:200, y:0 } );
			
			amountLevel5.addImage(MentonAssets.ME.texture("motante03"),{x:180,y:0});
			
			amountLevel6.addImage(MentonAssets.ME.texture("motante03"),{x:160,y:0});
			amountLevel6.addImage(MentonAssets.ME.texture("motante03"), { x:200, y:0 } );
			
			// value
			labelValue = addText(550, 80, "", FontResolver.ME.resolveFontName(Fonts.IOWAN_BLACK), {fontSize:60, color:0xffffff, x:80,y:-35,resizeOffset:true} );
		}
		
		override public function dispose():void 
		{
			super.dispose();
		}
		
		public function configure(prize:int):void
		{			
			hide(amountLevel1, amountLevel2, amountLevel3,amountLevel4,amountLevel5,amountLevel6);
			
			var keyYouWin:String = Dictio.upper("bonusSpinPopupTitle");
			var keyCash:String = Dictio.upper("Dindins");
			labelValue.text = keyYouWin + " " + prize.toString() + " " + keyCash;
			
			if (prize>=AMOUNT_LEVEL6)
				show(amountLevel6);
			else if (prize >= AMOUNT_LEVEL5)
				show(amountLevel5);
			else if(prize>=AMOUNT_LEVEL4) 
				show(amountLevel4);
			else if (prize >= AMOUNT_LEVEL3)
				show(amountLevel3);	
			else if (prize >= AMOUNT_LEVEL2)
				show(amountLevel2);
			else 
				show(amountLevel1);
			
		}
		
	}

}