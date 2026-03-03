package com.assukar.praia.menton.components.cards
{
	import com.assukar.view.starling.AssukarTextField;

	import com.assukar.view.starling.simplified.FramedMovie;

	/**
	 * @author	- Diogo Carlomagno
	 * 
	 */
	public class MarkTextMotion
	extends FramedMovie
	{
		private var label: AssukarTextField;

		public function MarkTextMotion(label: AssukarTextField)
		{
			this.label = label;
			createMovieFrame(3, PropertiesTextMotion.P1);
		}

		override protected function drawFrame(obj: *): void
		{
			var p: PropertiesTextMotion = obj as PropertiesTextMotion;
			this.label.color = p.color;
		}
	}
}

class PropertiesTextMotion
{
	static public const P1: PropertiesTextMotion = new PropertiesTextMotion(1, 0x456196);
	static public const P2: PropertiesTextMotion = new PropertiesTextMotion(1, 0x456196);
	static public const P3: PropertiesTextMotion = new PropertiesTextMotion(1, 0x456196); 
	
	public var scale: Number;
	public var color: uint;
	
	function PropertiesTextMotion(scale: Number, color: uint)
	{
		this.scale = scale;
		this.color = color;
	}
}
