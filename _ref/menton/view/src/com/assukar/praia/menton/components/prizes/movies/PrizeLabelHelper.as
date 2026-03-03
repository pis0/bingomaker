package com.assukar.praia.menton.components.prizes.movies
{
	import com.assukar.airong.utils.Singleton;
	import com.assukar.view.starling.Component;
	/**
	 * @author User
	 */
	public class PrizeLabelHelper extends Component
	{
		static public const ME: PrizeLabelHelper = new PrizeLabelHelper();
		private var theReturn:Vector.<Array>;
		private var label:String;
		
		public static const mentonDoubleLine:int = 0;
		public static const mentonOthers:int = 1;
		
		public function PrizeLabelHelper() : void
		{
			Singleton.enforce(ME);
		}
		
		public function getCharacterVector(label:String, group:int) : Vector.<Array>
		{
			this.label = label.toLowerCase();
			
			theReturn = new Vector.<Array>();
			
			var temp:Vector.<Array> = new Vector.<Array>();
			
			switch (group)
			{
				case mentonDoubleLine:
					temp = PrizeLabelList.mentonDoubleLine;
				break;
				case mentonOthers:
					temp = PrizeLabelList.mentonOthers;
				break;
			}
			
			for(var i:int = 0 ; i < this.label.length ; i++)
			{
				for (var j:int = 0 ; j < temp.length ; j++ )
				{
					if ( temp[j][0] == this.label.charAt(i))
					{
						theReturn.push([temp[j][1],temp[j][2],temp[j][3],temp[j][4],temp[j][5]]);
					}
				}
			}
			
			temp = null;
			
			return theReturn;
		}
	}
}
