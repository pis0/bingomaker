package com.assukar.praia.menton.domain
{
	import com.assukar.domain.domain.StatsMoney;
	/**
	 * @author Johnatan
	 */
	public interface PatternLinkage
	{
		function getPayout(): StatsMoney;
		function getExpectation(): int;
		function activate(round: Round): void;
		function reset(): void;
		function isValid(round: Round): Boolean;
		function getFinalPayout(): int;
	}
}
