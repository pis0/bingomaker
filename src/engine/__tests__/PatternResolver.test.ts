import { describe, expect, it } from 'vitest';
import { Card } from '../Card';
import { checkForPatterns } from '../PatternResolver';
import { LINE_1, DOUBLE_LINE_1, FULL } from '../Pattern';

function makeCard(nums: number[]): Card {
  const card = new Card(0);
  card.setNumbers(nums);
  const cardsByBall = new Map<number, Card>();
  card.reset(cardsByBall);
  return card;
}

describe('PatternResolver', () => {
  // Card layout with nums [1..15]:
  // [0][0]=1  [0][1]=4  [0][2]=7  [0][3]=10  [0][4]=13
  // [1][0]=2  [1][1]=5  [1][2]=8  [1][3]=11  [1][4]=14
  // [2][0]=3  [2][1]=6  [2][2]=9  [2][3]=12  [2][4]=15
  const NUMS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
  const STAKE = 1;

  it('detects LINE_1 when row 0 is complete', () => {
    const card = makeCard(NUMS);
    // Match all of row 0: balls 1,4,7,10,13
    [1, 4, 7, 10, 13].forEach((b) => card.setMatch(b));

    const payout = checkForPatterns(card, STAKE);
    expect(card.completedPatterns.has(LINE_1)).toBe(true);
    expect(payout).toBe(4); // LINE payout = 4
  });

  it('detects missing-one for LINE_1', () => {
    const card = makeCard(NUMS);
    // Match 4 of 5 in row 0
    [1, 4, 7, 10].forEach((b) => card.setMatch(b));

    checkForPatterns(card, STAKE);
    // Should have expectation at [0][4] (ball 13)
    expect(card.expectations[0][4]).not.toBeNull();
    expect(card.completedPatterns.has(LINE_1)).toBe(false);
  });

  it('detects DOUBLE_LINE_1 with hierarchy deduction', () => {
    const card = makeCard(NUMS);
    // Match rows 0 and 1: DOUBLE_LINE_1 = XXXXXXXXXX_____
    [1, 4, 7, 10, 13, 2, 5, 8, 11, 14].forEach((b) => card.setMatch(b));

    const payout = checkForPatterns(card, STAKE);

    expect(card.completedPatterns.has(DOUBLE_LINE_1)).toBe(true);
    // DOUBLE_LINE pays 80, but children LINE_1(4) and LINE_2(4) are deducted
    // Total = 80 - 4 - 4 = 72 for double_line + we don't get the lines since they're children
    // But LINE_1 and LINE_2 are also checked independently and completed
    // The hierarchy: DOUBLE_LINE_1 is checked first (higher priority)
    // When it completes, removeChildren removes LINE_1 and LINE_2 from completedPatterns
    // So payout = 80 (DOUBLE_LINE_1 only, no deduction since children aren't matched yet)
    // Actually LINE_1 and LINE_2 are lower priority, processed after.
    // But DOUBLE_LINE_1.removeChildren removes them from completedPatterns...
    // The children are marked (pattern.marked=true) so they're skipped.
    // So total payout = 80 (just the DOUBLE_LINE_1)
    expect(payout).toBe(80);
  });

  it('detects FULL pattern', () => {
    const card = makeCard(NUMS);
    // Match everything
    NUMS.forEach((b) => card.setMatch(b));

    const payout = checkForPatterns(card, STAKE);
    expect(card.completedPatterns.has(FULL)).toBe(true);
    // FULL is checked first, marks all children, so only FULL payout
    expect(payout).toBe(500);
  });

  it('accumulates payout across multiple draws', () => {
    const card = makeCard(NUMS);

    // First: complete LINE_1
    [1, 4, 7, 10, 13].forEach((b) => card.setMatch(b));
    const payout1 = checkForPatterns(card, STAKE);
    expect(payout1).toBe(4);

    // Then: complete LINE_2 (row 1) → triggers DOUBLE_LINE_1
    [2, 5, 8, 11, 14].forEach((b) => card.setMatch(b));
    const payout2 = checkForPatterns(card, STAKE);

    // DOUBLE_LINE_1 completes, deducts LINE_1(4) + LINE_2(4) = 8
    // Payout = 80 - 4(LINE_1) - 4(LINE_2) = 72
    // LINE_2 also completes on its own = 4
    // But wait — marked children are skipped. Let's trace:
    // DOUBLE_LINE_1 checked first, distance=0, setPattern:
    //   - completedPatterns: {LINE_1, DOUBLE_LINE_1}
    //   - removeChildren: LINE_1 is in set → deduct 4, remove; LINE_2 not in set yet → 0
    //   - payout for DOUBLE_LINE_1 = 80 - 4 = 76
    //   - markChildren: LINE_1.marked=true, LINE_2.marked=true
    // LINE_1 checked: already in completedPatterns → skip (marked)
    // LINE_2 checked: marked=true → skip
    // Total = 76
    expect(payout2).toBe(76);
  });
});
