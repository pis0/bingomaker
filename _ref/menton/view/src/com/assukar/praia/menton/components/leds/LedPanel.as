package com.assukar.praia.menton.components.leds
{
	import starling.events.Event;

	import com.assukar.view.starling.Component;
	/**
	 * @author Assukar
	 */
	public class LedPanel
	{
		private var comp: Component;
		internal var leds: Vector.<Led>;
		internal var len: int;
		
		public function LedPanel(comp: Component, leds: Vector.<Led>)
		{
			this.comp = comp;
			this.leds = leds;
			len = leds.length;
		}
		
		public function dispose(): void
		{
			comp.removeEventListener(Event.ENTER_FRAME, frameEnter);
		}
		
		private function frameEnter(event: Event): void
		{
			ledDance.enterFrame();
		}
	
		private var ledDance: LedDance;
		
		public function setDance(ledDance: LedDance) : void
		{
			if (ledDance)
			{
				ledDance.panel = this;
				comp.unflatten();
				if (!this.ledDance) comp.addEventListener(Event.ENTER_FRAME, frameEnter);
			}
			else
			{
				setAll(Led.STATE_OFF);
				comp.flatten();
				if (this.ledDance) comp.removeEventListener(Event.ENTER_FRAME, frameEnter);
			}
			
			this.ledDance = ledDance;
		}
		
		public function setAll(state : int) : void
		{
			for (var i:int = 0; i < len; i++)
			{
				leds[i].setState(state);
			}
		}		
	}
}
