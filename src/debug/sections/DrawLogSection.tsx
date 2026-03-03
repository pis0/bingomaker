import { COLS, ROWS } from '../../engine/constants';
import { MatchType } from '../../engine/types';
import type { Draw } from '../../engine/Draw';
import type { Round } from '../../engine/Round';
import { useEffect, useRef } from 'react';

interface Props {
  round: Round;
}

function formatDraw(draw: Draw): { text: string; className: string } {
  let text = `#${String(draw.index + 1).padStart(2)}: ball ${String(draw.ball).padStart(2)}`;
  let className = 'debug-draw-entry';

  if (draw.affectedCard >= 0 && draw.position) {
    text += ` → C${draw.affectedCard} [${draw.position.row},${draw.position.col}]`;
  }

  if (draw.additionalPayout > 0) {
    text += ` +${draw.additionalPayout}`;
    className += ' debug-draw-entry--payout';
  } else if (draw.cardMatches && draw.affectedCard >= 0) {
    let hasMissing = false;
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        if (draw.cardMatches.matchTypes[row][col] === MatchType.MISSING_BALL) {
          hasMissing = true;
          break;
        }
      }
      if (hasMissing) break;
    }
    if (hasMissing) {
      className += ' debug-draw-entry--missing';
    }
  }

  return { text, className };
}

export default function DrawLogSection({ round }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [round.draws.length]);

  return (
    <div className="debug-section">
      <h4>Draw Log ({round.draws.length})</h4>
      <div className="debug-draw-log" ref={scrollRef}>
        {round.draws.map((draw) => {
          const { text, className } = formatDraw(draw);
          return (
            <div key={draw.index} className={className}>
              {text}
            </div>
          );
        })}
        {round.draws.length === 0 && (
          <div className="debug-draw-entry">No draws yet</div>
        )}
      </div>
    </div>
  );
}
