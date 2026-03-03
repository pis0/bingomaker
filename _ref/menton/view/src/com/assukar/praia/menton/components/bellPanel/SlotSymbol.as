package com.assukar.praia.menton.components.bellPanel 
{
	import com.assukar.view.starling.Component;
	import starling.textures.Texture;
	import starling.textures.TextureSmoothing;
	
	/**
	 * ...
	 * @author Caian Seiki Murakawa
	 * @date 04/01/2016
	 */
	public class SlotSymbol 
	extends Component 
	{
		// Statics //
		static public const SLOT_TOP 			: int = 0;
		static public const SLOT_MIDDLE			: int = 1;
		static public const SLOT_BOTTOM 		: int = 2;
		static public const SLOT_BELL 			: String = "SLOT_BELL";
		
		
		// Dev Vars //
		private var mSymbolType : String;
		private var mSymbolPos 	: int;
		
		public function SlotSymbol(type : String, pos : int, texture : Texture) 
		{
			mSymbolType = type;
			mSymbolPos = pos;
			drawSym(type, pos, texture);
		}
		
		private function drawSym(type : String, pos : int, texture : Texture) : void
		{
			addImage(texture, {smoothing:TextureSmoothing.BILINEAR});
		}
		
		public function get type() : String
		{
			return mSymbolType;
		}
		
		public function get symPos() : int
		{
			return mSymbolPos;
		}
		
		override public function toString() : String
		{
			return "SlotSymbol[" + mSymbolType + "]";
		}
	}

}