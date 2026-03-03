import { COLS, ROWS } from '../../engine/constants';
import type { Card } from '../../engine/Card';
import type { Pattern } from '../../engine/Pattern';

interface Props {
  card: Card;
  preview: { pattern: Pattern; cardIndex: number } | null;
}

function cellClass(card: Card, row: number, col: number, preview: Props['preview']): string {
  const matched = card.matches[row][col];
  const inPat = card.inPattern[row][col];
  const hasMissing = card.expectations[row][col] !== null;
  const isPreview = preview && preview.cardIndex === card.index && preview.pattern.getMaskIndex(row, col);

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

  if (isPreview) {
    cls += ' debug-cell--preview';
  }

  return cls;
}

/**
 * For "last draw" highlighting, we check the most recent draw that affected this card.
 * We use the card's current MatchType state via produceCardMatches-like logic,
 * but since the card's lastMatch is already cleared, we rely on matches + inPattern.
 * The NEW_MATCH highlight only appears on the tick where the draw happened.
 * For simplicity in the debug panel, we just use matched/inPattern/expectations.
 */
export default function CardGridSection({ card, preview }: Props) {
  const patternNames = [...card.completedPatterns].map((p) => p.name);

  return (
    <div className="debug-card">
      <div className="debug-card-header">
        <span>Card {card.index}</span>
        {card.payout > 0 && <span className="payout">+{card.payout}</span>}
      </div>
      <div className="debug-grid">
        {Array.from({ length: ROWS }, (_, row) =>
          Array.from({ length: COLS }, (_, col) => (
            <div key={row * COLS + col} className={cellClass(card, row, col, preview)}>
              {card.numbers[row][col]}
            </div>
          )),
        )}
      </div>
      {patternNames.length > 0 && (
        <div className="debug-patterns-list">{patternNames.join(', ')}</div>
      )}
    </div>
  );
}
