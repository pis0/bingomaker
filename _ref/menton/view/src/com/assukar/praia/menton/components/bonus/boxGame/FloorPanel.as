package com.assukar.praia.menton.components.bonus.boxGame 
{
	import com.assukar.praia.assets.Fonts;
	import com.assukar.praia.menton.assets.MentonAssets;
	import com.assukar.praia.menton.domain.FeteDuCitroinBonusSession;
	import com.assukar.view.starling.AssukarTextField;
	import com.assukar.view.starling.Component;
	import starling.display.Image;
	import starling.utils.Align;
	/**
	 * ...
	 * @author Igor Henrique Santos
	 */
	public class FloorPanel extends Component
	{
		private var prizeStar:Component;
		private var prizeTucan:Component;
		private var prizeCrab:Component;
		private var starLabel:AssukarTextField;
		private var tucanLabel:AssukarTextField;
		private var crabLabel:AssukarTextField;
		private var starOn:Component;
		private var tucanOn:Component;
		private var crabOn:Component;
		private var cashStar:Image;
		private var cashTucan:Image;
		private var cashCrab:Image;
		
		public function FloorPanel() {}
		
		override protected function draww():void 
		{
			super.draww();
			
			addImage(MentonAssets.ME.texture("track"));
			
			var onBorder:Boolean = false;
			var posY:int = 240;
			
			prizeStar = addComp(Component,{x:15,y:posY});
			prizeStar.addImage(MentonAssets.ME.texture("payout_bonus"),{x:50});
			starLabel  = prizeStar.addText(130, 65, "0000", Fonts.RUMPELSTILTSKIN, {hAlign:Align.LEFT, border:onBorder,x:86,fontSize:50, color:0xcccccc, resizeOffset:true} );
			prizeStar.addImage(MentonAssets.ME.texture("star_payout"),{y:-10});
			
			starOn = prizeStar.addComp();
			starOn.addImage(MentonAssets.ME.texture("star2_payout"),{y:-10});
			cashStar = prizeStar.addImage(MentonAssets.ME.texture("smallcashpayout"),{x:184, y:15});
			starOn.addImage(MentonAssets.ME.texture("checkpayout"),{x:171, y:-26});
			
			prizeTucan = addComp(Component,{x:250,y:posY});
			prizeTucan.addImage(MentonAssets.ME.texture("payout_bonus"),{x:50});
			tucanLabel = prizeTucan.addText(130, 65, "0000", Fonts.RUMPELSTILTSKIN,{hAlign:Align.LEFT,border:onBorder,x:96,fontSize:50, color:0xcccccc, resizeOffset:true} );
			prizeTucan.addImage(MentonAssets.ME.texture("tucano_payout"),{y:-10});
			
			tucanOn = prizeTucan.addComp();
			tucanOn.addImage(MentonAssets.ME.texture("tucano2_payout"),{y:-10});
			cashTucan = prizeTucan.addImage(MentonAssets.ME.texture("smallcashpayout"),{x:184, y:15});
			tucanOn.addImage(MentonAssets.ME.texture("checkpayout"), { x:171, y:-26 } );
			
			prizeCrab = addComp(Component,{x:490, y:posY});
			prizeCrab.addImage(MentonAssets.ME.texture("payout_bonus"),{x:50});
			crabLabel  = prizeCrab.addText(130, 65, "0000", Fonts.RUMPELSTILTSKIN, {hAlign:Align.LEFT,border:onBorder,x:103,fontSize:50, color:0xcccccc, resizeOffset:true } );
			prizeCrab.addImage(MentonAssets.ME.texture("crab_payout"),{y:-10});
			
			crabOn = prizeCrab.addComp();
			crabOn.addImage(MentonAssets.ME.texture("crab2_payout"),{y:-10});
			cashCrab = prizeCrab.addImage(MentonAssets.ME.texture("smallcashpayout"),{x:184, y:15});
			crabOn.addImage(MentonAssets.ME.texture("checkpayout"), { x:171, y:-26 } );
			
		}
		
		override public function dispose():void 
		{
			super.dispose();
		}
		
		public function updateValue():void
		{
			starLabel.text = FeteDuCitroinBonusSession.starPayout + "";
			tucanLabel.text = FeteDuCitroinBonusSession.tucanPayout + "";
			crabLabel.text = FeteDuCitroinBonusSession.crabPayout + "";
		}
		
		public function resetDisplay():void
		{
			cashStar.alpha = cashTucan.alpha = cashCrab.alpha = 0.5;
			starLabel.alpha = tucanLabel.alpha = crabLabel.alpha = 0.8;
			
			//prizeStar.alpha = prizeTucan.alpha = prizeCrab.alpha = 0.8;
			starLabel.fontSize = tucanLabel.fontSize = crabLabel.fontSize = 55;
			
			starLabel.width = tucanLabel.width = crabLabel.width = 130;
			starLabel.height = tucanLabel.height = crabLabel.height = 65;
			
			hide(starOn, tucanOn, crabOn);
			starLabel.color = tucanLabel.color = crabLabel.color = 0xcccccc;
		}
		
		public function turnOnPanel(id:int):void
		{
			if (id == 0)
			{
				starLabel.color = 0x94d408;
				show(starOn);
				cashStar.alpha = 1;
				starLabel.fontSize = 70;
				
				starLabel.alpha = 1;
				
				starLabel.width = 140;
				starLabel.height = 75;
			}
			else if (id == 1)
			{
				tucanLabel.color = 0x94d408;
				show(tucanOn);
				cashTucan.alpha = 1;
				tucanLabel.fontSize = 70;
				
				tucanLabel.alpha = 1;
				
				tucanLabel.width = 140;
				tucanLabel.height = 75;
			}
			else if (id == 2)
			{
				crabLabel.color = 0x94d408;
				show(crabOn);
				cashCrab.alpha = 1;
				crabLabel.fontSize = 70;
				
				crabLabel.alpha = 1;
				
				crabLabel.width = 140;
				crabLabel.height = 75;
			}
		}
		
	}

}