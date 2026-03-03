package com.assukar.praia.menton.main
{
	import com.assukar.airong.utils.Singleton;
	/**
	 * @author Johnatan
	 */
	public class MentonViewProperties
	{
		// singleton
		static public const ME: MentonViewProperties = new MentonViewProperties();
		function MentonViewProperties()
		{
			Singleton.enforce(ME);
		}
		// object vars
		public var turbo: Boolean = true;
	}
}
