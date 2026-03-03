package com.assukar.praia.menton.components.cards
{
	import com.assukar.airong.text.TextUtils;
	import com.assukar.airong.utils.Utils;
	import com.assukar.praia.assets.Fonts;
	import com.assukar.praia.menton.assets.MentonAssets;
	import com.assukar.praia.menton.components.MissingBallSyncer;
	import com.assukar.praia.menton.components.Syncable;
	import com.assukar.praia.menton.domain.PatternGroup;
	import com.assukar.view.starling.Component;
	import com.assukar.view.starling.StarlingUtils;
	import flash.geom.Point;
	
	import starling.animation.Transitions;
	import starling.display.Image;
	import starling.display.Quad;
	import com.assukar.view.starling.AssukarTextField;
	import starling.text.TextFieldAutoSize;
	import starling.textures.TextureSmoothing;
	
	/**
	 * @author Diogo
	 */
	public class MissingMarkMovie extends Component implements Syncable
	{
		public function tick(count:int):void
		{
		}
		
		public function get interval():Number
		{
			return 2 * freq;
		}
		
		private var label:AssukarTextField;
		private var title:AssukarTextField;
		private var freq:Number;
		static public const MARKED_BG_COLORS:Vector.<uint> = new <uint>[0x1e6c17]; //
		private var selectedColor:uint;
		private var bg:Quad;
		private var bgPrice:Quad;
		
		private var missing_Double:Image;
		private var missing_3Columns:Image;
		private var missing_4Columns:Image;
		private var missing_DoubleBox:Image;
		private var missing_Bingo:Image;
		
		private var missing_Bel:Image;
		
		private var missing_DoublePos:Point = new Point(-6, -7);
		private var missing_3ColumnsPos:Point = new Point(-6, -7);
		private var missing_4ColumnsPos:Point = new Point(-10, -10);
		private var missing_DoubleBoxPos:Point = new Point(-10, -10);
		private var missing_BingoPos:Point = new Point(-15, -17);
		
		private var titlePos:Point = new Point(-2, -6);
		private var labelPos:Point = new Point(-1, 24);
		
		private var rCall:uint;
		
		override public function dispose():void
		{
			if (rCall)
				juggler.removeByID(rCall);
			super.dispose();
		}
		
		override protected function draww():void
		{
			bg = addQuad(Cardd.SLOT_WIDTH + 3, Cardd.SLOT_HEIGHT, 0xffffff, {x: -1, y: 0}); //Cardd.SLOT_HEIGHT
			bgPrice = addQuad(Cardd.SLOT_WIDTH + 3, 16, 0x1e6c17, {x: -1, y: 28}); //Cardd.SLOT_HEIGHT
			
			missing_Double = addImage(MentonAssets.ME.texture("missing_linhadupla"), {x: missing_DoublePos.x, y: missing_DoublePos.y});
			missing_3Columns = addImage(MentonAssets.ME.texture("missing_3colunas"), {x: missing_3ColumnsPos.x, y: missing_3ColumnsPos.y});
			missing_4Columns = addImage(MentonAssets.ME.texture("missing_4colunas"), {x: missing_4ColumnsPos.x, y: missing_4ColumnsPos.y});
			missing_DoubleBox = addImage(MentonAssets.ME.texture("missing_caixadupla"), {x: missing_DoubleBoxPos.x, y: missing_DoubleBoxPos.y});
			missing_Bingo = addImage(MentonAssets.ME.texture("missing_bingo"), {x: missing_BingoPos.x, y: missing_BingoPos.y});
			
			missing_Bel = addImage(MentonAssets.ME.texture("cardbell1"), {centerPivots: true}, {scaleX: .5, scaleY: .5, smoothing: TextureSmoothing.BILINEAR, x: bg.x + bg.width / 2, y: (bg.y + bg.height / 2) - 5, alpha: .6});
			
			label = addText(Cardd.SLOT_WIDTH + 4, 25, "", Fonts.IOWAN_BLACK, {fontSize: 18, color: 0xFFFFFF, x: labelPos.x, y: labelPos.y});
			title = addText(Cardd.SLOT_WIDTH + 4, Cardd.SLOT_HEIGHT + 1, "", Fonts.IOWAN_BLACK, {fontSize: 30, visible: false, color: 0x332d11, x: titlePos.x, y: titlePos.y, autoSize: TextFieldAutoSize.BOTH_DIRECTIONS});
			
			hide(missing_Double, missing_3Columns, missing_4Columns, missing_DoubleBox, missing_Bingo, missing_Bel);
			
			freq = 1;
		}
		
		private var markActive:Boolean;
		
		public function clear():void
		{
			
			if (rCall)
				juggler.removeByID(rCall);
			
			removeChild(light1);
			removeChild(light2);
			
			if (markActive)
			{
				markActive = false;
				hide(missing_Double, missing_3Columns, missing_4Columns, missing_DoubleBox, missing_Bingo);
			}
			
			label.color = 0xffffff;
			title.color = 0x332d11;
			
			title.width = Cardd.SLOT_WIDTH + 4;
			label.width = Cardd.SLOT_WIDTH + 4;
			
			labelPos.setTo(-1, 24);
			titlePos.setTo(-2, -6);
			
			label.x = labelPos.x;
			label.y = labelPos.y;
			
			title.x = titlePos.x;
			title.y = titlePos.y;
			
			hide(missing_Bel);
			currentPriority = 0;
		}
		
		//		private var mainPriority:int;
		private var currentPriority:int;
		
		private var frozen:Boolean = false;
		private var light1:Image;
		private var light2:Image;
		
		public function freeze(i:int, j:int):void
		{
			if (!frozen)
			{
				//				flatten();
				frozen = true;
			}
		}
		
		public function unfreeze(i:int, j:int):void
		{
			if (frozen)
			{
				unflatten();
				frozen = false;
			}
		}
		
		public function playBg(maxPriority:int):void
		{
			
			
			var line:String = "";			
			try
			{
				
				line += ".1";
				if (maxPriority < currentPriority) return;
				
				line += ".2";
				currentPriority = maxPriority;
				
				line += ".3";
				clear();
				
				freq = 1;
				
				line += ".4";
				hide(title, label);
				
				line += ".5";
				title.color = 0x332d11;
				
				line += ".6";
				switch (maxPriority)
				{
				case PatternGroup.LINE.priority: 
				case PatternGroup.DOUBLE_COLUMN.priority: 
					
					line += ".7";
					title.color = 0x1e6c17;
					bg.color = 0xffffff;
					break;
				case PatternGroup.TRIPLE_COLUMN.priority: 
					
					line += ".8";
					titlePos.y = -10;
					labelPos.y = 21;
					
					line += ".9";
					showMark(missing_3Columns, missing_3ColumnsPos);
					break;
				case PatternGroup.DOUBLE_LINE.priority: 
					
					line += ".10";
					titlePos.y = -10;
					labelPos.y = 23;
					
					line += ".11";
					showMark(missing_Double, missing_DoublePos);
					break;
				case PatternGroup.QUAD_COLUMN.priority: 
					
					line += ".12";
					titlePos.y = -10;
					labelPos.y = 23;
					
					line += ".13";
					showMark(missing_4Columns, missing_4ColumnsPos);
					break;
				case PatternGroup.QUAD_COLUMN_3.priority: 
					
					line += ".14";
					titlePos.y = -10;
					labelPos.y = 23;
					
					line += ".15";
					showMark(missing_DoubleBox, missing_DoubleBoxPos);
					break;
				case PatternGroup.FULL.priority: 
					
					line += ".16";
					title.width = missing_Bingo.width - 16;
					label.width = missing_Bingo.width - 16;
					
					line += ".17";
					labelPos.setTo(-9, 21);
					titlePos.setTo(-9, -15);
					
					line += ".18";
					createLight();
					
					line += ".19";
					showMark(missing_Bingo, missing_BingoPos);
					freq = .5;
					break;
				}
				
				line += ".20";
				selectedColor = MARKED_BG_COLORS[0];
				
				markActive = true;
				
				line += ".21"; 
				MissingBallSyncer.ME.play(this);
				
				//if (frozen) frozen = false;
				//freeze(0, 0); 
				
			}
			catch (err:Error)
			{
				
				Utils.log("line: ", line); 
				Utils.logError(err, false); 
			}
		
		}
		
		private function createLight():void
		{
			light1 = addImage(MentonAssets.ME.texture("missing_holofote"), {centerPivots: true, x: (Math.random() * 50) - 10, y: (Math.random() * 50) - 10});
			light2 = addImage(MentonAssets.ME.texture("missing_holofote"), {centerPivots: true, x: (Math.random() * 50) - 5, y: (Math.random() * 50) - 5});
			
			bottomChild(light1);
			bottomChild(light2);
			
			rCall = juggler.repeatCall(animatelLight, 1.7);
		}
		
		private function animatelLight():void
		{
			juggler.tween(light1, 1.6, {x: (Math.random() * 50) - 10, y: (Math.random() * 50) - 10, transition: Transitions.EASE_IN_OUT_CIRC});
			juggler.tween(light2, 1.6, {x: (Math.random() * 50) - 5, y: (Math.random() * 50) - 5, transition: Transitions.EASE_IN_OUT_CIRC});
		}
		
		private function showMark(target:Image, p:Point):void
		{
			target.alpha = 0;
			show(target);
			
			juggler.removeTweens(target);
			juggler.removeTweens(title);
			juggler.removeTweens(label);
			
			juggler.tween(target, .2, {y: p.y - 10, transition: Transitions.EASE_IN_CUBIC, alpha: 1});
			juggler.tween(title, .2, {y: titlePos.y - 10, transition: Transitions.EASE_IN_CUBIC, alpha: 1});
			juggler.tween(label, .2, {y: labelPos.y - 10, transition: Transitions.EASE_IN_CUBIC, alpha: 1});
			
			juggler.tween(target, .2, {delay: .2, y: p.y, transition: Transitions.EASE_OUT_BOUNCE});
			juggler.tween(title, .2, {delay: .2, y: titlePos.y, transition: Transitions.EASE_OUT_BOUNCE});
			juggler.tween(label, .2, {delay: .2, y: labelPos.y, transition: Transitions.EASE_OUT_BOUNCE});
		}
		
		public function setPrizeValue(value:int, number:String):void
		{
			if (value < 0)
				label.visible = false;
			else
				label.visible = true;
			
			switch (value)
			{
			case 0: 
			{
				label.text = "BONUS";
				label.color = 0xfff770;
				break;
			}
			case -1: 
			{
				label.text = "";
				hide(label);
				break;
			}
			default: 
			{
				label.text = TextUtils.formatNumber(value);
			}
			}
			
			title.visible = true;
			title.text = number;
			StarlingUtils.centerXRelativeTo(title, bg);
			
			if (frozen)
				frozen = false;
			freeze(0, 0);
		}
		
		public function showBel():void
		{
			show(missing_Bel);
		}
	}
}
