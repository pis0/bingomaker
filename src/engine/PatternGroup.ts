export class PatternGroup {
  readonly name: string;
  readonly payout: number;
  readonly priority: number;

  constructor(name: string, payout: number, priority: number) {
    this.name = name;
    this.payout = payout;
    this.priority = priority;
  }

  get extra(): boolean {
    return this.priority >= 2;
  }

  get superExtra(): boolean {
    return this.priority >= 4;
  }

  getPayout(stake: number): number {
    return this.payout * stake;
  }

  static readonly LINE = new PatternGroup('LINE', 4, 1);
  static readonly DOUBLE_COLUMN = new PatternGroup('DOUBLE_COLUMN', 4, 1);
  static readonly TRIPLE_COLUMN = new PatternGroup('TRIPLE_COLUMN', 30, 2);
  static readonly DOUBLE_LINE = new PatternGroup('DOUBLE_LINE', 80, 3);
  static readonly QUAD_COLUMN = new PatternGroup('QUAD_COLUMN', 120, 4);
  static readonly QUAD_COLUMN_3 = new PatternGroup('QUAD_COLUMN_3', 250, 5);
  static readonly FULL = new PatternGroup('FULL', 500, 6);
}
