package com.assukar.praia.menton.components
{
	/**
	 * @author Assukar
	 */
	public interface Syncable
	{
		function tick(count: int): void;
		function get interval(): Number;
	}
}
