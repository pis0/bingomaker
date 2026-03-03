package com.assukar.praia.menton.components.leds
{
	import com.assukar.airong.error.AbstractError;

	/**
	 * @author Assukar
	 */
	public class LedDance
	{
		internal var panel : LedPanel;

		// protected function setAll(state: int):void
		// {
		// for (var i: int = 0; i < len; i++)
		// {
		// leds[i].setState(state);
		// }
		// }
		public function enterFrame() : void
		{
			throw new AbstractError();
		}
	}
}
