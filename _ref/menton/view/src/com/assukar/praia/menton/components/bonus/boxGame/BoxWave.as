package com.assukar.praia.menton.components.bonus.boxGame 
{
	import com.assukar.view.starling.Component;
	/**
	 * ...
	 * @author Igor Henrique Santos
	 */
	public class BoxWave extends Component
	{
		public var boxList:Vector.<BoxM>;
		
		public function BoxWave() {}
		
		override protected function draww():void 
		{
			super.draww();
			
			boxList = new Vector.<BoxM>();
			boxList.push(addComp(new BoxM(0).draw(),{x:0}));
			boxList.push(addComp(new BoxM(1).draw(),{x:240}));
			boxList.push(addComp(new BoxM(2).draw(),{x:490}));
		}
		
		
		override public function dispose():void 
		{
			super.dispose();
		}
		
	}

}