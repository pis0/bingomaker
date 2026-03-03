package com.assukar.praia.menton.components.bellPanel 
{
	import com.assukar.airong.error.AssukarError;
	import com.assukar.airong.utils.Singleton;
	import com.assukar.praia.menton.assets.MentonAssets;
	import com.assukar.praia.menton.domain.SlotBonusSession;
	import com.assukar.view.starling.Component;
	import flash.utils.Dictionary;
	import starling.textures.Texture;
	
	/**
	 * ...
	 * @author Caian Seiki Murakawa
	 * @date 04/01/2016
	 */
	public class SlotSymbolPool 
	{
		// Singleton //
		static public const ME 		: SlotSymbolPool = new SlotSymbolPool();
		
		// Dev Vars //
		private var mDictioTextures : Dictionary;
		private var mDictioPool		: Dictionary;
		
		public function SlotSymbolPool() 
		{
			Singleton.enforce(ME);
		}
		
		public function dispose() : void
		{
			mDictioPool = null;
			mDictioTextures = null;
		}
		
		public function reset() : void
		{
			if (mDictioPool) throw new AssukarError();
			
			mDictioPool = new Dictionary();
			mDictioTextures = new Dictionary();
			
			mDictioTextures[SlotBonusSession.FRUIT + SlotSymbol.SLOT_TOP] 		= MentonAssets.ME.texture("bomb1");
			mDictioTextures[SlotBonusSession.FRUIT + SlotSymbol.SLOT_MIDDLE] 	= MentonAssets.ME.texture("bomb2");
			mDictioTextures[SlotBonusSession.FRUIT + SlotSymbol.SLOT_BOTTOM] 	= MentonAssets.ME.texture("bomb3");
			mDictioTextures[SlotBonusSession.BONUS + SlotSymbol.SLOT_TOP] 		= MentonAssets.ME.texture("lemon1");
			mDictioTextures[SlotBonusSession.BONUS + SlotSymbol.SLOT_MIDDLE] 	= MentonAssets.ME.texture("lemon2");
			mDictioTextures[SlotBonusSession.BONUS + SlotSymbol.SLOT_BOTTOM] 	= MentonAssets.ME.texture("lemon3");
			mDictioTextures[SlotBonusSession.X2 + SlotSymbol.SLOT_TOP] 			= MentonAssets.ME.texture("multiply1");
			mDictioTextures[SlotBonusSession.X2 + SlotSymbol.SLOT_MIDDLE] 		= MentonAssets.ME.texture("multiply2");
			mDictioTextures[SlotBonusSession.X2 + SlotSymbol.SLOT_BOTTOM] 		= MentonAssets.ME.texture("multiply3");
			mDictioTextures[SlotSymbol.SLOT_BELL + SlotSymbol.SLOT_TOP] 		= MentonAssets.ME.texture("bell1_on");
			mDictioTextures[SlotSymbol.SLOT_BELL + SlotSymbol.SLOT_MIDDLE] 		= MentonAssets.ME.texture("bell2_on");
			mDictioTextures[SlotSymbol.SLOT_BELL + SlotSymbol.SLOT_BOTTOM] 		= MentonAssets.ME.texture("bell3_on");
		}
		
		public function recycle(slot : SlotSymbol) : void
		{
			if (!mDictioPool[slot.type + slot.symPos]) mDictioPool[slot.type + slot.symPos] = new <SlotSymbol>[];
			mDictioPool[slot.type + slot.symPos].push(slot);
			if (slot.parent) slot.parent.removeChild(slot);
		}
		
		public function retrieve(symbol : String, pos : int, container : Component = null) : SlotSymbol
		{
			var slot : SlotSymbol;
			
			if (!mDictioPool[symbol + pos]) mDictioPool[symbol + pos] = new <SlotSymbol>[];
			if (mDictioPool[symbol + pos].length == 0)
			{
				slot = new SlotSymbol(symbol, pos, mDictioTextures[symbol + pos]);
				if(container) slot = container.addComp(slot);
			} else {
				slot = mDictioPool[symbol + pos].pop();
				if(container) container.addComp(slot);
			}
			
			return slot;
		}
		
		public function getTexture(symbol : String, pos : int) : Texture
		{
			return mDictioTextures[symbol + pos];
		}
	}
}