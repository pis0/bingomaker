export const MatchType = {
  NO_MATCH: 0,
  OLD_MATCH: 1,
  OLD_MATCH_IN_PATTERN: 2,
  NEW_MATCH: 3,
  NEW_MATCH_IN_PATTERN: 4,
  MISSING_BALL: 5,
} as const;

export type MatchType = (typeof MatchType)[keyof typeof MatchType];

export type Grid<T> = T[][];

export type RandomFn = () => number;
