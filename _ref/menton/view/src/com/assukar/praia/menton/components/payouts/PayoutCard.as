package com.assukar.praia.menton.components.payouts
{
	import com.assukar.airong.ds.LinkedList;
	import com.assukar.airong.text.TextUtils;
	import com.assukar.praia.assets.Fonts;
	import com.assukar.praia.menton.assets.MentonAssets;
	import com.assukar.praia.menton.components.MissingBallSyncer;
	import com.assukar.praia.menton.components.Syncable;
	import com.assukar.praia.menton.controllers.PatternsController;
	import com.assukar.praia.menton.domain.Pattern;
    import com.assukar.praia.menton.engine.commands.NewRoundControlCommand;
    import com.assukar.praia.menton.main.MentonEngine;
	import com.assukar.view.starling.AssukarJuggler;
	import com.assukar.view.starling.AssukarTextField;
	import com.assukar.view.starling.Component;
    import com.assukar.view.starling.TouchableComponent;

    import flash.geom.Point;
	import flash.utils.Dictionary;
	
	
	import starling.display.Image;
	import starling.display.Quad;
	import com.assukar.view.starling.AssukarTextField;
	import starling.text.TextFieldAutoSize;
	
	public class PayoutCard
	extends TouchableComponent
	implements Syncable
	{
		static private const BLINK_INTERVAL: Number = 1.5;
		private var bg: Image;
		private var bgon: Image;
		private var bgonPrize: Image;
//		private var solidContainer: Component;
		private var prizeContainer: Component;
//		private var slotsbg: Vector.<Image>;
		private var slots: Vector.<Image>;
		private	var patternColorID: int;
		private var alreadyWon: Boolean;
		private var patternsDraw: Vector.<Component>;
		private var index:int = 0;
		private var maxIndex:int = 0;
		private var patternsMissing:Vector.<Pattern>;
		private var delayAnima:uint;
		private var mCardIndex : int;
		private var mVectorAnimMissings : Vector.<Array>;
		private var mTextPrizeNumber : AssukarTextField;
		private var mCompTexts : Component;
		
		static public const PATTERN_COLORS: Vector.<uint> = new <uint> [//
		0x1b1302, // marrom
		0xffffff,  // branco 
		0x119dee // azul
		];
		static public const BLINK_COLORS: Vector.<uint> = new <uint> [//
		0xf63e3b, // vermelho 
		0xffea00 // amarelo
		];
		
		static private const BG_ON_TEXTURES : Vector.<String> = new <String> [//
		"prize2", "prize2", "prize3", "prize4", "prize5", "prize6", "prize7"
		
		];
		static private const MISSING_COLORS : Vector.<uint> = new <uint>[//
		0x521C67, 0x521C67, 0x1F6F1D, 0xD42F88, 0x24688D, 0xA88800, 0xB30625
		];
		
		//coming from interface
		public function tick(count: int):void
		{
			//
		}
		
		public function get interval(): Number
		{
			return BLINK_INTERVAL;
		}
		
		public var patternsList: Array;

		function PayoutCard(cardIndex : int, patternsList: Array)
		{
			mCardIndex = cardIndex;
			this.patternsList = patternsList;
			patternColorID = 0;
			MissingBallSyncer.ME.play(this);
			index = 0;
			maxIndex = this.patternsList.length - 1;
		}

		override public function dispose(): void
		{
			super.dispose();
			alreadyWon = false;
			slotsToBlink = null;
			
			MissingBallSyncer.ME.stop(this);
		}
		
		override protected function draww(): void
		{
			bg = addImage(MentonAssets.ME.texture("prize1"));
			bgon = addImage(MentonAssets.ME.texture(BG_ON_TEXTURES[mCardIndex]), {x:-3, y:-2});//
			bgonPrize = addImage(MentonAssets.ME.texture("prize_won"), {x:-3, y:-2, visible: false});//
			
			slots = new <Image>[];
			patternsDraw = new Vector.<Component>();
			patternsMissing = new Vector.<Pattern>();
			
			var i: int;
			
			prizeContainer = addComp(null, {x:3, y:3});
			
			// pattern container
			for (i = 0; i < 15; i++)
			{
				slots[i] = prizeContainer.addImage(MentonAssets.ME.texture("prizedot1"), {x:((11)*(i%5)) + 1, y:(8+1)*int(i/5), name:int(i/5)+","+(i%5)});
				slots[i].visible = false;
			}
			
			animatePatterns();
			if(maxIndex == 0) setPattern();
			
			mCompTexts = addComp();
			label = mCompTexts.addText(10, 10, "", Fonts.IOWAN_BLACK, {fontSize:18, color:0x1b1302, autoSize:TextFieldAutoSize.BOTH_DIRECTIONS});
			mTextPrizeNumber = mCompTexts.addText(10, 10, "", Fonts.MYRIADPRO_BOLD, {fontSize:18, color:0xfacb25, autoSize:TextFieldAutoSize.BOTH_DIRECTIONS});

            if(NewRoundControlCommand.CHEAT_MODE)
            {
                this.CLICK.listen(setCheatPattern);
                this.enable();
            }
		}

        private function setCheatPattern(tc:*, t:*):void
        {
            NewRoundControlCommand.ME.cheatPattern = this.patternsList[0];
        }

		private var label: AssukarTextField;

		private function setLabel(str: String): void
		{
			label.text = str;
			while (label.bounds.width > 65) label.fontSize--;
			mCompTexts.x = bg.x+bg.width-mCompTexts.bounds.width >> 1;
			mCompTexts.y = bg.y + bg.height - 5;			
		}
		
		public function setPrize(value:int): void
		{
			if (label.text != TextUtils.formatNumber(value))
			{
				setLabel(TextUtils.formatNumber(value));
			}
		}
		
		public function setJackpot(prize:String):void
		{
			this.label.text = prize;
			while (label.bounds.width>55) label.fontSize--;
			label.x = bg.x+bg.width-label.bounds.width >> 1;
			label.y = bg.y+bg.height - 3;
		}
		
		private function setPattern(animate:Boolean = true):void
		{
			var len:int = patternsList[index].matchArray.length;
			index = !animate ? index-1 : index;
			if(index < 0) index = maxIndex;

			for (var i: int = 0; i< len; i++)
			{
				var currentImage:Image = slots[i];
				if (patternsList[index].matchArray[i] == "X") currentImage.visible = true;
				else currentImage.visible = false;
			}
			
			flatten();
		}

		private function animatePatterns(animate:Boolean = true): void
		{
			if (maxIndex == 0) return;
			setPattern(animate);
			index++;
			if (index > maxIndex) index = 0;
			delayAnima = AssukarJuggler.ME.delayCall(animatePatterns, 2);
		}
		
		private function animateMissings(step : int = 0, delay:Number = 1.2) : void
		{
			missing(mVectorAnimMissings[step][0] as int, mVectorAnimMissings[step][1] as Point, mVectorAnimMissings[step][2] as Pattern, true);
			step++;
			if (step >= mVectorAnimMissings.length) step = 0;
			delayCall("animMissings", juggler.delayCall(animateMissings, delay * (delay < 1 && (!MentonEngine.ME.round || MentonEngine.ME.round.roundEnded) ? 2 : 1), step, delay));	  
		}
		
//		private var cc: Cursor;

		// list of Quads
		private var slotsToBlink: LinkedList = new LinkedList();
		// dictio of quads per card index
		private var slotsByCard: Dictionary = null;
		
		public function missing(cardx: int, point: Point, pattern:Pattern, anim:Boolean = false): void
		{
			var i:int;
			var slotTemp: Quad;
			var len: int = slots.length;
			
			
			//TODO: Adjust for missing blink (1 missing)
			cardOnMissing(pattern);
			
			for (i = 0; i<len; i++)
			{
				slotTemp = slots[i];
				if (!slotsByCard) slotsByCard = new Dictionary();
				slotsByCard[slotTemp] = cardx;
				
				if ((""+point.x+","+point.y)===slotTemp.name)
				{
					if (!anim)
					{
						if (!mVectorAnimMissings) mVectorAnimMissings = new Vector.<Array>;
						mVectorAnimMissings.push([cardx, point, pattern]);
						
						//if (mVectorAnimMissings.length > 1) animateMissings();
						animateMissings(0, mVectorAnimMissings.length > 1 ? 1.2 : 0.33);
						slotsToBlink.push(slotTemp);
					}
					
					slotTemp.color = slotTemp.color == BLINK_COLORS[1] ? MISSING_COLORS[mCardIndex] : BLINK_COLORS[1];
					slotTemp.visible = true;
					
					if(!bgonPrize.visible)
					{
						show(bgon);
						hide(bg);
						if (label.color == 0xd11919) label.color = 0x000000;
					}
					
//					if ( !bgon.visible)
//					{
//						show(bgon);
//						hide(bg,bgonPrize);
//						if (label.color == 0xd11919) label.color = 0x000000;
//					}
				}
				else 
				{
					slotTemp.color = MISSING_COLORS[mCardIndex];
//					cc = slotsToBlink.cursor;
//					while (cc.next) 
//					{
//						Quad(cc.current).visible = true;
//						Quad(cc.current).color = BLINK_COLORS[1];
//					}
				}
			}
			
			flatten();
		}
		
		private function cardOnMissing(pattern:Pattern):void
		{
			if (patternsMissing.length == 0)
			{
				patternsMissing.push(pattern);
			}
			else
			{
				var contains:Boolean = false;
				for (var k:int = 0; k < patternsMissing.length; k++) 
				{
					if (patternsMissing[k] == pattern) contains = true;
				}
				if(!contains) patternsMissing.push(pattern);
			}
			
			AssukarJuggler.ME.removeByID(delayAnima);
			var i:int;
//			for (var i:int = 0; i < slots.length; i++) 
//			{
//				slots[i].color = MISSING_COLORS[mCardIndex];
//			}
			
			var len:int = pattern.matchArray.length;

			for (i = 0; i< len; i++)
			{
				slots[i].visible = pattern.matchArray[i] == "X"; 
//				var currentImage:Image = slots[i];
//			
//				if (pattern.matchArray[i] == "X")
//				{
//					currentImage.visible = true;
//				}
//				else
//				{
//					currentImage.visible = false;
//				}					
			}
			
			flatten();
		}
		
		private function cardOnNormal(animate:Boolean = true, restart:Boolean = true):void
		{
			destroyCall("animMissings");
			
			if(restart)
			{
				AssukarJuggler.ME.removeByID(delayAnima);
				animatePatterns(animate);
			}
			
			for (var i:int = 0; i < slots.length; i++) 
				slots[i].color = PATTERN_COLORS[1];
			
			label.color = 0x1b1302;
		}
		
		public function full(cardx: int,patternMatch:Array): void
		{
			cardOnPrize(patternMatch);
			
			alreadyWon = true;
			if (slotsByCard)
			{
				for (var slot: Quad in slotsByCard)
				{
					if (slotsByCard[slot]==cardx)
					{
						slotsToBlink.removeObject(slot);
						slot.visible = false;
					}
				}
			}
			
			flatten();
		}
		
		public function stopAnima():void{
			AssukarJuggler.ME.removeByID(delayAnima);
		}

		public function reset(animate:Boolean = true, restart:Boolean = true): void
		{
			slotsByCard = null;
			while (!slotsToBlink.empty) Quad(slotsToBlink.removeFirst()).visible = false;
			bg.visible = true;
			bgon.visible = false;
			bgonPrize.visible = false;
			mVectorAnimMissings = new Vector.<Array>;
			
			patternsMissing = new Vector.<Pattern>();
			cardOnNormal(animate && !alreadyWon, restart);
			alreadyWon = false;
			
			if(restart) {
				setPattern();
				PatternsController.ME.clearFullCounter();
				
				mTextPrizeNumber.text = "";
				mTextPrizeNumber.color = 0xfacb25;
				ammountt = 0;
				mCompTexts.x = bg.x+bg.width-mCompTexts.bounds.width >> 1;
				mCompTexts.y = bg.y + bg.height - 5;	
			}
			
			flatten();
		}
		
		public function highlightCard() : void
		{
			show(bgon);
			hide(bgonPrize);
		}
		
		public function onPrize():void
		{
			//Utils.wraplog("ON PRIZE");
			//unflatten();
			hide(bgon);
			show(bg, bgonPrize);
			mTextPrizeNumber.color = 0xd11919;
			label.color = 0xd11919;
			AssukarJuggler.ME.removeByID(delayAnima);
		}
		
		private function cardOnPrize(prizeId:Array):void
		{
			onPrize();
			//AssukarJuggler.ME.removeByID(delayAnima);
			//label.color = 0xffffff;
		}
		
		private var ammountt: uint;
		
		public function get ammount(): uint
		{
			return ammountt;
		}
		
		public function set ammount(ammount: uint): void
		{
			this.ammountt = ammount;
			mTextPrizeNumber.text = "(" + (this.ammountt-1) + ")";
			
			if (this.ammountt-1 >= 2) show(mTextPrizeNumber);
			else 
			{
				mTextPrizeNumber.text = "";
				hide(mTextPrizeNumber);
			}
			
			mTextPrizeNumber.x = label.x + label.width - 5;
			mTextPrizeNumber.y = label.y;
			mCompTexts.x = bg.x+bg.width-mCompTexts.bounds.width >> 1;
			mCompTexts.y = bg.y + bg.height - 5;
			
			flatten();
		}
	}
}
