package com.assukar.praia.menton.components.cards
{
	import starling.text.BitmapFont;
	import com.assukar.airong.ds.Cursor;
	import com.assukar.airong.ds.HashSet;
	import com.assukar.praia.assets.Fonts;
	import com.assukar.view.starling.Animatables;
	import com.assukar.view.starling.simplified.FramedMovie;

	/**
	 * @author	- Diogo Carlomagno
	 * @date	- Aug 17, 2012
	 */
	public class MissingTextMotion
	extends FramedMovie 
	{
		private var slots: HashSet = new HashSet();//LinkedList = new LinkedList();

		public function MissingTextMotion()
		{
			loop();
			clearMovieFrames();
			createMovieFrame(20, PropertiesTextMotion.PF);
		}

		public function clearAndStop(): void
		{
			slots.clear();
			stop();
		}
		
		public function removeSlot(slot: Slot): void
		{
			slots.removeObject(slot);
			
			slot.missingMark.visible = false;
			slot.number.fontName = Fonts.IOWAN_OLD_STYLE_BLACK_43;
			slot.number.fontSize = BitmapFont.NATIVE_SIZE;//36;
			slot.number.y = slot.initTextY;
			slot.number.alpha = 1;
			if (slots.size == 0) Animatables.stop(this);
		}

		public function addSlot(slot: Slot): Boolean
		{
			if (!slots.contains(slot)) 
			{
				if (slots.size == 0) Animatables.play(this);
				slots.push(slot);
				slot.missingMark.visible = true;
				slot.number.fontName = Fonts.IOWAN_OLD_STYLE_BLACK_43;
				slot.number.fontSize = BitmapFont.NATIVE_SIZE;//36;
				slot.number.color = 0xFFFFFF;
				slot.number.y = slot.initTextY-7;
				
								
				return true;
			}
			else return false;
		}

		override protected function drawFrame(obj: *): void
		{
			var p: PropertiesTextMotion = obj as PropertiesTextMotion;
			
			var c: Cursor = slots.cursorUnsorted;
			while (c.next)
			{
				var s: Slot = c.current as Slot;
				s.missingMark.scaleX = s.missingMark.scaleY = p.scale;
				s.number.alpha = p.alpha;
			}
		}
	}
}

class PropertiesTextMotion
{
	static public const P1: PropertiesTextMotion = new PropertiesTextMotion(.95,1);
	static public const P2: PropertiesTextMotion = new PropertiesTextMotion(.90, .9);
	static public const P3: PropertiesTextMotion = new PropertiesTextMotion(.85, .8);
	static public const P4: PropertiesTextMotion = new PropertiesTextMotion(.80, .7);
	static public const P5: PropertiesTextMotion = new PropertiesTextMotion(.85, .65);
	static public const P6: PropertiesTextMotion = new PropertiesTextMotion(.90, .6);
	static public const P7: PropertiesTextMotion = new PropertiesTextMotion(.95, .6);
	static public const P8: PropertiesTextMotion = new PropertiesTextMotion(1, .65);
	static public const P9: PropertiesTextMotion = new PropertiesTextMotion(1.05, .7);
	static public const P10: PropertiesTextMotion = new PropertiesTextMotion(1.10, .8);
	static public const P11: PropertiesTextMotion = new PropertiesTextMotion(1.05, .9);
	static public const PF: PropertiesTextMotion = new PropertiesTextMotion(1, 1);
				
	public var scale: Number;
	//public var color: uint;
	public var alpha: Number;
	
	//function PropertiesTextMotion(scale: Number, color: uint = 0): void
	function PropertiesTextMotion(scale: Number, alpha: Number = 0): void
	{
		this.scale = scale;
		//this.color = color;
		this.alpha = alpha;
	}
}


