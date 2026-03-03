import { describe, expect, it } from 'vitest';
import { Card } from '../Card';
import { ROWS, COLS } from '../constants';

describe('Card', () => {
  it('distributes numbers in column-major order', () => {
    const card = new Card(0);
    // 15 numbers sorted
    const nums = [3, 7, 12, 15, 23, 31, 44, 51, 60, 67, 72, 78, 82, 87, 90];
    card.setNumbers(nums);

    // Column-major: row = i % 3, col = floor(i / 3)
    // i=0: [0][0]=3   i=3: [0][1]=15  i=6: [0][2]=44  i=9:  [0][3]=67  i=12: [0][4]=82
    // i=1: [1][0]=7   i=4: [1][1]=23  i=7: [1][2]=51  i=10: [1][3]=72  i=13: [1][4]=87
    // i=2: [2][0]=12  i=5: [2][1]=31  i=8: [2][2]=60  i=11: [2][3]=78  i=14: [2][4]=90
    expect(card.numbers[0]).toEqual([3, 15, 44, 67, 82]);
    expect(card.numbers[1]).toEqual([7, 23, 51, 72, 87]);
    expect(card.numbers[2]).toEqual([12, 31, 60, 78, 90]);
  });

  it('hasBall returns true for contained numbers', () => {
    const card = new Card(0);
    card.setNumbers([3, 7, 12, 15, 23, 31, 44, 51, 60, 67, 72, 78, 82, 87, 90]);

    expect(card.hasBall(44)).toBe(true);
    expect(card.hasBall(99)).toBe(false);
  });

  it('getPosition returns correct position', () => {
    const card = new Card(0);
    card.setNumbers([3, 7, 12, 15, 23, 31, 44, 51, 60, 67, 72, 78, 82, 87, 90]);

    expect(card.getPosition(44)).toEqual({ row: 0, col: 2 });
    expect(card.getPosition(7)).toEqual({ row: 1, col: 0 });
    expect(card.getPosition(90)).toEqual({ row: 2, col: 4 });
  });

  it('setMatch marks the correct cell', () => {
    const card = new Card(0);
    card.setNumbers([3, 7, 12, 15, 23, 31, 44, 51, 60, 67, 72, 78, 82, 87, 90]);
    const cardsByBall = new Map<number, Card>();
    card.reset(cardsByBall);

    card.setMatch(44);
    expect(card.matches[0][2]).toBe(true);
    // Other cells still false
    expect(card.matches[0][0]).toBe(false);
  });

  it('reset clears all state', () => {
    const card = new Card(0);
    card.setNumbers([3, 7, 12, 15, 23, 31, 44, 51, 60, 67, 72, 78, 82, 87, 90]);
    const cardsByBall = new Map<number, Card>();
    card.reset(cardsByBall);
    card.setMatch(44);

    card.reset(cardsByBall);
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        expect(card.matches[row][col]).toBe(false);
      }
    }
  });

  it('produces CardMatches snapshot', () => {
    const card = new Card(0);
    card.setNumbers([3, 7, 12, 15, 23, 31, 44, 51, 60, 67, 72, 78, 82, 87, 90]);
    const cardsByBall = new Map<number, Card>();
    card.reset(cardsByBall);
    card.setMatch(44);

    const snapshot = card.produceCardMatches();
    expect(snapshot.matchTypes).toHaveLength(ROWS);
    expect(snapshot.matchTypes[0]).toHaveLength(COLS);
  });
});
