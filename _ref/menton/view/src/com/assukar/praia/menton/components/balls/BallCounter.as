package com.assukar.praia.menton.components.balls
{
	import com.assukar.airong.text.TextUtils;
	import com.assukar.praia.assets.Fonts;
	import com.assukar.view.starling.Component;
	import com.assukar.view.starling.AssukarTextField;
	import starling.text.TextFieldAutoSize;
	
	public class BallCounter extends Component
	{
		//private var shadow	:AssukarTextField;
		private var label:AssukarTextField;
		private var labelShadow:AssukarTextField;
		
		override protected function draww():void
		{
			//shadow = addText(10, 10, "", Fonts.IOWAN_BLACK, {centerPivots:true}, {fontSize:30, color:0x000000, autoSize:TextFieldAutoSize.BOTH_DIRECTIONS},{xd:-1, yd:-1});
			labelShadow = addText(10, 10, "", Fonts.IOWAN_BLACK, {centerPivots: true}, {fontSize: 25, color: 0x37393c, autoSize: TextFieldAutoSize.BOTH_DIRECTIONS, y:2});
			label = addText(10, 10, "", Fonts.IOWAN_BLACK, {centerPivots: true}, {fontSize: 25, color: 0xc1c0ae, autoSize: TextFieldAutoSize.BOTH_DIRECTIONS});
		}
		
		public function reset():void
		{
			//shadow.text = 
			label.text = "";
			labelShadow.text = "";
		}
		
		public function setTriggersBalls(value:int):void
		{
			//shadow.text = 
			label.text = TextUtils.formatWithHeadingZeros(value, 2);
			labelShadow.text = TextUtils.formatWithHeadingZeros(value, 2);
		}
	}
}
