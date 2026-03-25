import { COLS, ROWS } from '../../engine/constants';
import type { Card } from '../../engine/Card';
import type { BellPosition } from '../../engine/Round';

interface Props {
  card: Card;
  bellPosition?: BellPosition;
}

function cellClass(card: Card, row: number, col: number): string {
  const matched = card.matches[row][col];
  const inPat = card.inPattern[row][col];
  const hasMissing = card.expectations[row][col] !== null;

  let cls = 'debug-cell';

  if (inPat && matched) {
    cls += ' debug-cell--in-pattern';
  } else if (matched) {
    cls += ' debug-cell--matched';
  } else if (hasMissing) {
    cls += ' debug-cell--missing';
  } else {
    cls += ' debug-cell--empty';
  }

  return cls;
}

export default function CardGridSection({ card, bellPosition }: Props) {
  const patternNames = [...card.completedPatterns].map((p) => p.name);

  return (
    <div className="debug-card">
      <div className="debug-card-header">
        <span>Card {card.index}</span>
        {card.payout > 0 && <span className="payout">+{card.payout}</span>}
      </div>
      <div className="debug-grid">
        {Array.from({ length: ROWS }, (_, row) =>
          Array.from({ length: COLS }, (_, col) => {
            const isBell = bellPosition?.row === row && bellPosition?.col === col;
            return (
              <div key={row * COLS + col} className={cellClass(card, row, col)}>
                {card.numbers[row][col]}
                {isBell && <span className="debug-bell" title="Bell">&#128276;</span>}
              </div>
            );
          }),
        )}
      </div>
      {patternNames.length > 0 && (
        <div className="debug-patterns-list">{patternNames.join(', ')}</div>
      )}
    </div>
  );
}
