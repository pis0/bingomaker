import { COLS, ROWS } from './constants';
import { MatchType } from './types';
import type { Grid } from './types';
import type { MissingPatternsHolder } from './MissingPatternsHolder';

/**
 * Immutable snapshot of a card's state at a specific draw.
 * Classifies each cell into a MatchType.
 */
export class CardMatches {
  readonly matchTypes: Grid<MatchType>;

  constructor(
    matches: Grid<boolean>,
    inPattern: Grid<boolean>,
    newMatch: { row: number; col: number } | null,
    expectations: Grid<MissingPatternsHolder | null>,
  ) {
    this.matchTypes = [];
    for (let row = 0; row < ROWS; row++) {
      this.matchTypes[row] = [];
      for (let col = 0; col < COLS; col++) {
        const isNew = newMatch !== null && newMatch.row === row && newMatch.col === col;
        const matched = matches[row][col];
        const inPat = inPattern[row][col];
        const hasMissing = expectations[row][col] !== null;

        if (isNew && inPat) {
          this.matchTypes[row][col] = MatchType.NEW_MATCH_IN_PATTERN;
        } else if (isNew) {
          this.matchTypes[row][col] = MatchType.NEW_MATCH;
        } else if (matched && inPat) {
          this.matchTypes[row][col] = MatchType.OLD_MATCH_IN_PATTERN;
        } else if (matched) {
          this.matchTypes[row][col] = MatchType.OLD_MATCH;
        } else if (hasMissing) {
          this.matchTypes[row][col] = MatchType.MISSING_BALL;
        } else {
          this.matchTypes[row][col] = MatchType.NO_MATCH;
        }
      }
    }
  }
}
