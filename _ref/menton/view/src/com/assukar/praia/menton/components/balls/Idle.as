package com.assukar.praia.menton.components.balls
{
import starling.rendering.Painter;

/**
	 * @author Diogo
	 */
	public interface Idle
	{
		function play(... animas:*):void;
		
		function stop(... animas:*):void;

		function render(painter:Painter):void;
	}
}
