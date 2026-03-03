package com.assukar.praia.menton.components.buttons
{
	import com.assukar.praia.main.PraiaContext;
	import com.assukar.view.starling.buttons.ButtonComponent;
	/**
	 * @author Johnatan
	 */
	public class MentonButton
	extends ButtonComponent
	{
		function MentonButton()
		{
			super(true, true, false, false, false);
		}		
		
		
		override protected function verifyKeyEvent(): Boolean
		{
			return !PraiaContext.ME.navigator.secondary && !PraiaContext.ME.navigator.popup; 
//			&& !BonusGame.ME.visible;
		}
	}
}
