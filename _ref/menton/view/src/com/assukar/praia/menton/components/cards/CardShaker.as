package com.assukar.praia.menton.components.cards
{
	import starling.animation.Transitions;

	import com.assukar.airong.ds.LinkedList;
	import com.assukar.airong.error.AssukarError;
	/**
	 * @author Assukar
	 */
	public class CardShaker
	{
		private var cardd: Cardd;
		public function CardShaker(cardd: Cardd)
		{
			this.cardd = cardd;
		}
		
		public function dispose(): void
		{
			while (!tweens.empty) juggler.removeByID(tweens.removeFirst());
		}
		
		private var tweens: LinkedList = new LinkedList();
		
		public function shake(type: int): void
		{
			dispose();
			
			switch (type)
			{
				case 1:
					tweens.push(juggler.tween(cardd, .05, {x:cardd.initPos.x - 2, y:cardd.initPos.y - 2}));
					tweens.push(juggler.tween(cardd, .05, {delay:.05, x:cardd.initPos.x + 4, y:cardd.initPos.y + 4}));
					tweens.push(juggler.tween(cardd, .05, {delay:.1, x:cardd.initPos.x - 2, y:cardd.initPos.y + 2}));
					tweens.push(juggler.tween(cardd, .05, {delay:.17, x:cardd.initPos.x, y:cardd.initPos.y, onComplete:cardd.resetPos, onCompleteArgs:[cardd.initPos]}));
					break;
				case 2:
				case 3:
				case 4:
					var scale: Number = type-1;
					tweens.push(juggler.tween(cardd, .10+.03*scale, {scaleY:1+(scale*0.05), scaleX:1+(scale*0.03), transition:Transitions.EASE_IN_CUBIC}));
					tweens.push(juggler.tween(cardd, .10+.03*scale, {delay:.10+.03*scale, scaleY:1-(scale*0.035), scaleX:1-(scale*0.02), transition:Transitions.EASE_IN_OUT_CUBIC}));
					tweens.push(juggler.tween(cardd, .10+.03*scale, {delay:2*(.10+.03*scale), scaleY:1, scaleX:1, transition:Transitions.EASE_OUT_CUBIC}));
					break;
				default:
					throw new AssukarError("type:"+type);
			}			
		}
	}
}
