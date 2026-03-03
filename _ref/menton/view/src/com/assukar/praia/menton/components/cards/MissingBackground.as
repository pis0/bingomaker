package com.assukar.praia.menton.components.cards
{
	import starling.textures.Texture;

	import com.assukar.airong.ds.Cursor;
	import com.assukar.airong.ds.LinkedList;
	import com.assukar.praia.menton.assets.MentonAssets;
	import com.assukar.praia.menton.components.particles.MentonParticle;
	import com.assukar.praia.menton.domain.Pattern;
	import com.assukar.view.starling.Component;

	import flash.geom.Point;
	import flash.utils.Dictionary;
	
	/**
	 * ...
	 * @author Andre
	 */
	
	public class MissingBackground extends Component
	{
		private var borderPex:MentonParticle;
		
		private var border_DoubleLine:Texture;
		private var border_3Columns:Texture;
		private var border_4Columns:Texture;
		private var border_DoubleBox:Texture;
		private var border_Bingo:Texture;
		
		private var bingoLayer:Component;
		private var doubleBoxLayer:Component;
		private var fourColumnLayer:Component;
		private var tripleColumnLayer:Component;
		private var doubleLineLayer:Component;
		private var hasAddedNewPatten:Boolean;
		
		private var currentPatterSlot:Dictionary;
		private var patternList:Vector.<Pattern>;
		
		override public function dispose():void
		{
			currentPatterSlot = new Dictionary();
			super.dispose();
		}
		
		override protected function draww():void
		{
			currentPatterSlot = new Dictionary();
			patternList = new <Pattern>[];
			
			tripleColumnLayer = addComp();
			fourColumnLayer = addComp();
			doubleBoxLayer = addComp();
			doubleLineLayer = addComp();
			bingoLayer = addComp();
			
			
			border_3Columns = MentonAssets.ME.texture("moldura_3colunas");
			border_4Columns = MentonAssets.ME.texture("moldura_4colunas");
			border_DoubleBox = MentonAssets.ME.texture("moldura_caixadupla");
			border_DoubleLine = MentonAssets.ME.texture("moldura_linhadupla");
			border_Bingo = MentonAssets.ME.texture("moldura_bingo");
		}
		
		public function addMissingPatterns(pCursor:LinkedList, slot:Slot, maxPriority:int):void
		{
			var cursor:Cursor = pCursor.cursor;
			var patternn:Pattern;
			
			if(!currentPatterSlot[slot.number.text])
			{
				currentPatterSlot[slot.number.text] = {priority:maxPriority, patterns:pCursor};
			}
			
			
			var posDouble:Point = new Point(7,(slot.bgDefault.y + slot.bgDefault.height *.5) - 2);
			
			while (cursor.next)
			{
				patternn = Pattern(cursor.current);
			
				switch(patternn)
				{
					case Pattern.FULL: 
					{						
						bingoLayer.addImage(border_Bingo, {x: 10, y: 9});
						hasAddedNewPatten = true;
						
						borderPex = new MentonParticle("menton_4col_bright", bingoLayer);
						borderPex.pos(186, 100);
						borderPex.start();
						borderPex.particle.emitterXVariance = 180;
						borderPex.particle.emitterYVariance = 60;
						hasAddedNewPatten = true;
						break;
					}
					case Pattern.QUAD_COLUMN_3: 
					{
						doubleBoxLayer.addImage(border_DoubleBox, {x: 14, y: 27, scaleY: 1.05, name:Pattern.QUAD_COLUMN_3.id});
						hasAddedNewPatten = true;
						
						currentPatterSlot[slot.number.text].pattern = Pattern.QUAD_COLUMN_3;
						break;
					}
					case Pattern.QUAD_COLUMN_1: 
					{
						if(!fourColumnLayer.numChildren || !fourColumnLayer.contains(fourColumnLayer.getChildByName(Pattern.QUAD_COLUMN_1.id)))
						{
							fourColumnLayer.addImage(border_4Columns, {x: 15, y: 33, scaleX: 1.015, scaleY: 1.07, name:Pattern.QUAD_COLUMN_1.id});
							borderPex = new MentonParticle("menton_4col_bright", fourColumnLayer);
							borderPex.pos(162, 100);
							borderPex.start();
							borderPex.particle.emitterXVariance = 150;
							borderPex.particle.emitterYVariance = 60;
							hasAddedNewPatten = true;
							currentPatterSlot[slot.number.text].pattern = Pattern.QUAD_COLUMN_1;	
						}														
						break;
					}
					case Pattern.QUAD_COLUMN_2: 
					{
						if(!fourColumnLayer.numChildren || !fourColumnLayer.contains(fourColumnLayer.getChildByName(Pattern.QUAD_COLUMN_2.id)))
						{
							fourColumnLayer.addImage(border_4Columns, {x: 79, y: 33, scaleX: 1.015, scaleY: 1.07, name:Pattern.QUAD_COLUMN_2.id});
							
							borderPex = new MentonParticle("menton_4col_bright", fourColumnLayer);
							borderPex.pos(206, 100);
							borderPex.start();
							borderPex.particle.emitterXVariance = 150;
							borderPex.particle.emitterYVariance = 60;
							hasAddedNewPatten = true;		
							currentPatterSlot[slot.number.text].pattern = Pattern.QUAD_COLUMN_2;								
						}
						break;
					}
					case Pattern.TRIPLE_COLUMN_1: 
					{
						if(!tripleColumnLayer.contains(tripleColumnLayer.getChildByName(Pattern.TRIPLE_COLUMN_1.id)))
						{
							tripleColumnLayer.addImage(border_3Columns, {x: 15, y: 33, scaleY: 1.05, name:Pattern.TRIPLE_COLUMN_1.id});
							hasAddedNewPatten = true;	
							if(!currentPatterSlot[slot.number.text].pattern)  currentPatterSlot[slot.number.text].pattern = Pattern.TRIPLE_COLUMN_1;	
						}
															
						break;
					}
					case Pattern.TRIPLE_COLUMN_2: 
					{
						if(!tripleColumnLayer.contains(tripleColumnLayer.getChildByName(Pattern.TRIPLE_COLUMN_2.id)))
						{
							tripleColumnLayer.addImage(border_3Columns, {x: 79, y: 33, scaleY: 1.05, name:Pattern.TRIPLE_COLUMN_2.id});
							hasAddedNewPatten = true;
							if(!currentPatterSlot[slot.number.text].pattern)  currentPatterSlot[slot.number.text].pattern = Pattern.TRIPLE_COLUMN_2;
						}
						break;
					}
					case Pattern.TRIPLE_COLUMN_3: 
					{
						if(!tripleColumnLayer.contains(tripleColumnLayer.getChildByName(Pattern.TRIPLE_COLUMN_3.id)))
						{
							tripleColumnLayer.addImage(border_3Columns, {x: 143, y: 33, scaleY: 1.05, name:Pattern.TRIPLE_COLUMN_3.id});
							hasAddedNewPatten = true;
							if(!currentPatterSlot[slot.number.text].pattern)  currentPatterSlot[slot.number.text].pattern = Pattern.TRIPLE_COLUMN_3;	
						}
						
						break;
					}	
			 		case Pattern.DOUBLE_LINE_1: 
					{
						if(!doubleLineLayer.contains(doubleLineLayer.getChildByName(Pattern.DOUBLE_LINE_1.id)))
						{								
							doubleLineLayer.addImage(border_DoubleLine, {y:posDouble.y, x:posDouble.x, name:Pattern.DOUBLE_LINE_1.id});
							hasAddedNewPatten = true;
							currentPatterSlot[slot.number.text].pattern = Pattern.DOUBLE_LINE_1;
						}
						break;
					}
					case Pattern.DOUBLE_LINE_2: 
					{
						if(!doubleLineLayer.contains(doubleLineLayer.getChildByName(Pattern.DOUBLE_LINE_2.id)))
						{
							doubleLineLayer.addImage(border_DoubleLine, {y:posDouble.y, x:posDouble.x, name:Pattern.DOUBLE_LINE_2.id});
							hasAddedNewPatten = true;
							currentPatterSlot[slot.number.text].pattern = Pattern.DOUBLE_LINE_2;
						}
						break;
					}
					case Pattern.DOUBLE_LINE_3: 
					{
						if(!doubleLineLayer.contains(doubleLineLayer.getChildByName(Pattern.DOUBLE_LINE_3.id)))
						{
							doubleLineLayer.addImage(border_DoubleLine, {y:posDouble.y, x:posDouble.x, name:Pattern.DOUBLE_LINE_3.id});
							hasAddedNewPatten = true;
							currentPatterSlot[slot.number.text].pattern = Pattern.DOUBLE_LINE_3;	
						}
						
						break;
					}					
				}
			}
		}
		
		public function removeBgPattern(slot:Slot):void
		{
			if(!currentPatterSlot[slot.number.text]) return;
			
			var cursor:Cursor = currentPatterSlot[slot.number.text].patterns.cursor; 
			var pattern:Pattern;
			
			while(cursor.next)
			{
				pattern = Pattern(cursor.current);
			
				switch(pattern)
				{
			 		case Pattern.DOUBLE_LINE_1: 
			 		case Pattern.DOUBLE_LINE_2: 
			 		case Pattern.DOUBLE_LINE_3: 
					{
						doubleLineLayer.removeChild(doubleLineLayer.getChildByName(pattern.id));
						break;
					}
			 		case Pattern.TRIPLE_COLUMN_1: 
			 		case Pattern.TRIPLE_COLUMN_2: 
			 		case Pattern.TRIPLE_COLUMN_3: 
					{
						tripleColumnLayer.removeChild(tripleColumnLayer.getChildByName(pattern.id));						
						break;
					}
			 		case Pattern.QUAD_COLUMN_3: 
					{
						doubleBoxLayer.removeChild(doubleBoxLayer.getChildByName(pattern.id));
						break;
					}				
			 		case Pattern.QUAD_COLUMN_1: 
			 		case Pattern.QUAD_COLUMN_2:		 		 
					{
						fourColumnLayer.removeChild(fourColumnLayer.getChildByName(pattern.id));
						
						//!fourColumnLayer.numChildren && 
						if(borderPex)
						{
							borderPex.stop();
							borderPex = null;
						}
						
						break;
					}
				}
			
			}
		}
		
		public function clear():void
		{
			if (borderPex)
			{
				borderPex.stop();
				borderPex = null;
			}
			
			currentPatterSlot = new Dictionary();			
			
			tripleColumnLayer.removeChildren(0, -1, true);
			fourColumnLayer.removeChildren(0, -1, true);
			doubleBoxLayer.removeChildren(0, -1, true);
			doubleLineLayer.removeChildren(0, -1, true);
			bingoLayer.removeChildren(0, -1, true);
		}
	
	}

}