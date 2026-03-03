/**
 * Browser DevTools helpers — exposes engine on window for console usage.
 *
 * Usage (browser console):
 *   bingo.sim()          — roda uma simulação com seed aleatório
 *   bingo.sim(42)        — roda com seed específico
 *   bingo.sim100()       — stats de 100 rodadas
 *   bingo.round(1, 42)   — createRound(stake=1, seed=42) retorna o objeto
 */

import { GameSession } from './GameSession';
import { COLS, ROWS } from './constants';
import { MatchType } from './types';
import type { Card } from './Card';
import type { Draw } from './Draw';

function makeSeededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return s / 2147483647;
  };
}

const SYMBOLS: Record<number, string> = {
  [MatchType.NO_MATCH]: '·',
  [MatchType.OLD_MATCH]: '●',
  [MatchType.OLD_MATCH_IN_PATTERN]: '◆',
  [MatchType.NEW_MATCH]: '★',
  [MatchType.NEW_MATCH_IN_PATTERN]: '◈',
  [MatchType.MISSING_BALL]: '?',
};

function cardGrid(card: Card, draw: Draw | null): string {
  const lines: string[] = [];
  const cm = draw?.cardMatches;
  for (let row = 0; row < ROWS; row++) {
    const cells: string[] = [];
    for (let col = 0; col < COLS; col++) {
      const num = String(card.numbers[row][col]).padStart(2);
      if (cm && draw!.affectedCard === card.index) {
        cells.push(`${num}${SYMBOLS[cm.matchTypes[row][col]] ?? ' '}`);
      } else {
        cells.push(`${num}${card.matches[row][col] ? '●' : '·'}`);
      }
    }
    lines.push('│ ' + cells.join('  ') + ' │');
  }
  return '┌─────────────────────────┐\n' + lines.join('\n') + '\n└─────────────────────────┘';
}

function sim(seed?: number) {
  const actualSeed = seed ?? Math.floor(Math.random() * 100000);
  const session = new GameSession();
  const result = session.createRound({ stake: 1, random: makeSeededRandom(actualSeed) });
  const { round, draws, totalPayout, extraAvailable, superExtraAvailable } = result;

  console.log(`%c BINGO ENGINE — seed: ${actualSeed} `, 'background: #6200ea; color: white; font-size: 14px; padding: 4px 8px; border-radius: 4px;');

  // Cards
  console.group('🎴 Cards');
  for (const card of round.cards) {
    const rows: string[] = [];
    for (let row = 0; row < ROWS; row++) {
      rows.push(card.numbers[row].map((n) => String(n).padStart(2)).join('  '));
    }
    console.log(`Card ${card.index}:  ${rows.join('  │  ')}`);
  }
  console.groupEnd();

  // Draws
  console.group('🔵 Draws (30 balls)');
  for (const draw of draws) {
    let msg = `#${String(draw.index).padStart(2)}: ball ${String(draw.ball).padStart(2)}`;
    let style = '';

    if (draw.affectedCard >= 0 && draw.position) {
      msg += ` → Card ${draw.affectedCard} [${draw.position.row},${draw.position.col}]`;
    }

    if (draw.additionalPayout > 0) {
      const card = round.cards[draw.affectedCard];
      const names = [...card.completedPatterns].map((p) => p.name);
      msg = `%c${msg}  ✅ +${draw.additionalPayout} (${names.join(', ')})`;
      style = 'color: #00c853; font-weight: bold;';
    }

    // Missing-one
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
        msg += `  ⚡ falta: ${missing.join(', ')}`;
      }
    }

    if (style) {
      console.log(msg, style);
    } else {
      console.log(msg);
    }

    // Show card grid on pattern complete
    if (draw.additionalPayout > 0) {
      console.log(cardGrid(round.cards[draw.affectedCard], draw));
    }
  }
  console.groupEnd();

  // Extras
  if (extraAvailable) {
    console.group('🟡 Extra Balls');
    let extraCount = 0;
    while (round.extraAvailable && extraCount < 15) {
      const extra = session.drawExtra(round, 1);
      if (!extra) break;
      extraCount++;
      let msg = `Extra #${extraCount}: ball ${String(extra.ball).padStart(2)}`;
      if (extra.affectedCard >= 0 && extra.position) {
        msg += ` → Card ${extra.affectedCard} [${extra.position.row},${extra.position.col}]`;
      }
      if (extra.additionalPayout > 0) {
        console.log(`%c${msg}  ✅ +${extra.additionalPayout}`, 'color: #ffab00; font-weight: bold;');
      } else {
        console.log(msg);
      }
    }
    console.log(`Total after extras: ${round.totalPayout}`);
    console.groupEnd();
  }

  // Final state
  console.group('📋 Final State');
  for (const card of round.cards) {
    console.log(`Card ${card.index}:`);
    console.log(cardGrid(card, null));
  }
  console.groupEnd();

  // Result
  const resultStyle = totalPayout > 0
    ? 'background: #00c853; color: white; font-size: 13px; padding: 3px 8px; border-radius: 4px;'
    : 'background: #616161; color: white; font-size: 13px; padding: 3px 8px; border-radius: 4px;';
  console.log(`%c Payout: ${round.totalPayout} | Extras: ${extraAvailable} | Super: ${superExtraAvailable} `, resultStyle);

  return result;
}

function sim100() {
  let withPayout = 0;
  let total = 0;
  let max = 0;
  let maxSeed = 0;
  let extras = 0;
  const freq: Record<string, number> = {};

  for (let i = 0; i < 100; i++) {
    const seed = i * 137;
    const session = new GameSession();
    const r = session.createRound({ stake: 1, random: makeSeededRandom(seed) });
    if (r.totalPayout > 0) {
      withPayout++;
      for (const card of r.round.cards) {
        for (const p of card.completedPatterns) {
          freq[p.group.name] = (freq[p.group.name] ?? 0) + 1;
        }
      }
    }
    total += r.totalPayout;
    if (r.totalPayout > max) { max = r.totalPayout; maxSeed = seed; }
    if (r.extraAvailable) extras++;
  }

  console.log('%c 100 ROUNDS STATS ', 'background: #6200ea; color: white; font-size: 14px; padding: 4px 8px; border-radius: 4px;');
  console.table({
    'Rounds with payout': `${withPayout}/100`,
    'Total payout': total,
    'Average': (total / 100).toFixed(2),
    'Max payout': `${max} (seed ${maxSeed})`,
    'Rounds with extras': extras,
  });

  console.log('%cPattern frequency:', 'font-weight: bold;');
  console.table(freq);
}

function round(stake = 1, seed?: number) {
  const actualSeed = seed ?? Math.floor(Math.random() * 100000);
  const session = new GameSession();
  return session.createRound({ stake, random: makeSeededRandom(actualSeed) });
}

export function installDevtools() {
  const api = { sim, sim100, round, GameSession };
  (window as unknown as Record<string, unknown>).bingo = api;

  console.log(
    '%c🎱 Bingo Engine loaded! %cTry: bingo.sim() or bingo.sim(42) or bingo.sim100()',
    'color: #6200ea; font-weight: bold; font-size: 13px;',
    'color: #888; font-size: 12px;',
  );
}
