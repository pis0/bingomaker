import { COLS, ROWS } from '../../engine/constants';
import { MatchType } from '../../engine/types';
import type { Card } from '../../engine/Card';
import type { Draw } from '../../engine/Draw';
import type { Round } from '../../engine/Round';

function cardGridAscii(card: Card): string {
  const lines: string[] = [];
  for (let row = 0; row < ROWS; row++) {
    const cells: string[] = [];
    for (let col = 0; col < COLS; col++) {
      const num = String(card.numbers[row][col]).padStart(2);
      const sym = card.matches[row][col]
        ? card.inPattern[row][col] ? '◆' : '●'
        : card.expectations[row][col] ? '?' : '·';
      cells.push(`${num}${sym}`);
    }
    lines.push('│ ' + cells.join('  ') + ' │');
  }
  return '┌─────────────────────────┐\n' + lines.join('\n') + '\n└─────────────────────────┘';
}

export function logDraw(draw: Draw, round: Round): void {
  let msg = `#${String(draw.index).padStart(2)}: ball ${String(draw.ball).padStart(2)}`;

  if (draw.affectedCard >= 0 && draw.position) {
    msg += ` → Card ${draw.affectedCard} [${draw.position.row},${draw.position.col}]`;
  }

  if (draw.additionalPayout > 0) {
    const card = round.cards[draw.affectedCard];
    const names = [...card.completedPatterns].map((p) => p.name);
    console.log(
      `%c${msg}  +${draw.additionalPayout} (${names.join(', ')})`,
      'color: #00c853; font-weight: bold;',
    );
    console.log(cardGridAscii(card));
  } else {
    // Check for missing-one
    if (draw.cardMatches && draw.affectedCard >= 0) {
      const missing: string[] = [];
      for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
          if (draw.cardMatches.matchTypes[row][col] === MatchType.MISSING_BALL) {
            missing.push(String(round.cards[draw.affectedCard].numbers[row][col]));
          }
        }
      }
      if (missing.length > 0) {
        console.log(`%c${msg}  falta: ${missing.join(', ')}`, 'color: #ffeb3b;');
        return;
      }
    }
    console.log(msg);
  }
}

export function logNewRound(round: Round, seed: number): void {
  console.log(
    `%c BINGO DEBUG — New Round (seed: ${seed}) `,
    'background: #6200ea; color: white; font-size: 13px; padding: 3px 8px; border-radius: 4px;',
  );
  console.group('Cards');
  for (const card of round.cards) {
    console.log(`Card ${card.index}:`);
    console.log(cardGridAscii(card));
  }
  console.groupEnd();
}
