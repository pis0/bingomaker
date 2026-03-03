import { describe, it, expect } from 'vitest';
import { GameSession } from '../GameSession';
import { COLS, ROWS } from '../constants';
import { MatchType } from '../types';
import type { Card } from '../Card';
import type { Round } from '../Round';
import type { Draw } from '../Draw';

function makeSeededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return s / 2147483647;
  };
}

// ── Visual helpers ──────────────────────────────────────────

const MATCH_SYMBOLS: Record<number, string> = {
  [MatchType.NO_MATCH]: '·',
  [MatchType.OLD_MATCH]: '●',
  [MatchType.OLD_MATCH_IN_PATTERN]: '◆',
  [MatchType.NEW_MATCH]: '★',
  [MatchType.NEW_MATCH_IN_PATTERN]: '◈',
  [MatchType.MISSING_BALL]: '?',
};

function printCardGrid(card: Card, draw: Draw | null): string {
  const lines: string[] = [];
  const cm = draw?.cardMatches;

  for (let row = 0; row < ROWS; row++) {
    const cells: string[] = [];
    for (let col = 0; col < COLS; col++) {
      const num = String(card.numbers[row][col]).padStart(2);
      if (cm && draw.affectedCard === card.index) {
        const sym = MATCH_SYMBOLS[cm.matchTypes[row][col]] ?? ' ';
        cells.push(`${num}${sym}`);
      } else {
        const matched = card.matches[row][col];
        cells.push(`${num}${matched ? '●' : '·'}`);
      }
    }
    lines.push('    │ ' + cells.join('  ') + ' │');
  }

  return lines.join('\n');
}

function printAllCards(round: Round, draw: Draw | null): string {
  const out: string[] = [];
  for (const card of round.cards) {
    const highlight = draw && draw.affectedCard === card.index ? ' ◄' : '';
    out.push(`  Card ${card.index}${highlight}`);
    out.push('    ┌─────────────────────────┐');
    out.push(printCardGrid(card, draw && draw.affectedCard === card.index ? draw : null));
    out.push('    └─────────────────────────┘');
  }
  return out.join('\n');
}

// ── Tests ───────────────────────────────────────────────────

describe('Simulation', () => {
  it('runs a complete round with visual output', () => {
    // Find a seed that produces at least one pattern for a nice visual
    let bestSeed = 42;
    let bestPayout = 0;
    for (let seed = 0; seed < 200; seed++) {
      const s = new GameSession();
      const r = s.createRound({ stake: 1, random: makeSeededRandom(seed) });
      if (r.totalPayout > bestPayout && r.totalPayout <= 120) {
        bestPayout = r.totalPayout;
        bestSeed = seed;
      }
    }

    const session = new GameSession();
    const result = session.createRound({ stake: 1, random: makeSeededRandom(bestSeed) });
    const { round, draws, totalPayout, extraAvailable, superExtraAvailable } = result;

    const log: string[] = [];
    log.push('');
    log.push('╔═══════════════════════════════════════════════════════╗');
    log.push('║              BINGO ENGINE — SIMULATION                ║');
    log.push('╚═══════════════════════════════════════════════════════╝');
    log.push(`  Seed: ${bestSeed}   Stake: 1`);
    log.push('');
    log.push('  Legend: · empty  ● matched  ★ new match  ◆ in pattern  ◈ new+pattern  ? missing-one');
    log.push('');

    // Print initial cards
    log.push('── CARDS (numbers) ──────────────────────────────────────');
    for (const card of round.cards) {
      const rows: string[] = [];
      for (let row = 0; row < ROWS; row++) {
        rows.push(card.numbers[row].map((n) => String(n).padStart(2)).join('  '));
      }
      log.push(`  Card ${card.index}:  ${rows.join('  │  ')}`);
    }

    log.push('');
    log.push('── DRAWS ───────────────────────────────────────────────');

    for (const draw of draws) {
      let line = `  #${String(draw.index).padStart(2)}: 🔵 ${String(draw.ball).padStart(2)}`;

      if (draw.affectedCard >= 0 && draw.position) {
        line += ` → Card ${draw.affectedCard} [${draw.position.row},${draw.position.col}]`;
      } else {
        line += `    (miss)`;
      }

      if (draw.additionalPayout > 0) {
        const card = round.cards[draw.affectedCard];
        const names = [...card.completedPatterns].map((p) => p.name);
        line += `  ✅ +${draw.additionalPayout} (${names.join(', ')})`;
      }

      if (draw.cardMatches && draw.affectedCard >= 0) {
        const missingCells: string[] = [];
        for (let row = 0; row < ROWS; row++) {
          for (let col = 0; col < COLS; col++) {
            if (draw.cardMatches.matchTypes[row][col] === MatchType.MISSING_BALL) {
              const num = round.cards[draw.affectedCard].numbers[row][col];
              missingCells.push(String(num));
            }
          }
        }
        if (missingCells.length > 0) {
          line += `  ⚡ falta: ${missingCells.join(', ')}`;
        }
      }

      log.push(line);

      // On pattern completion, show the card state
      if (draw.additionalPayout > 0) {
        log.push('');
        log.push(printAllCards(round, draw));
        log.push('');
      }
    }

    log.push('');
    log.push('── RESULT ──────────────────────────────────────────────');
    log.push(`  Total payout: ${totalPayout}`);
    log.push(`  Extras available: ${extraAvailable}`);
    log.push(`  Super extras: ${superExtraAvailable}`);
    log.push('');

    // Final card state
    log.push('── FINAL CARD STATE ────────────────────────────────────');
    log.push(printAllCards(round, null));

    // Draw extras if available
    if (extraAvailable) {
      log.push('');
      log.push('── EXTRA BALLS ─────────────────────────────────────────');
      let extraCount = 0;
      while (round.extraAvailable && extraCount < 10) {
        const extra = session.drawExtra(round, 1);
        if (!extra) break;
        extraCount++;
        let line = `  Extra #${extraCount}: 🟡 ${String(extra.ball).padStart(2)}`;
        if (extra.affectedCard >= 0 && extra.position) {
          line += ` → Card ${extra.affectedCard} [${extra.position.row},${extra.position.col}]`;
        }
        if (extra.additionalPayout > 0) {
          line += `  ✅ +${extra.additionalPayout}`;
        }
        log.push(line);
      }
      log.push(`  Total after extras: ${round.totalPayout}`);
    }

    log.push('');
    log.push('═══════════════════════════════════════════════════════');

    console.log(log.join('\n'));

    // draws starts with 30, extras are appended via round.draws
    expect(draws.length).toBeGreaterThanOrEqual(30);
    expect(totalPayout).toBeGreaterThanOrEqual(0);
  });

  it('runs 100 rounds and shows statistics', () => {
    let totalRoundsWithPayout = 0;
    let totalPayout = 0;
    let maxPayout = 0;
    let bestSeed = 0;
    let extraRounds = 0;
    const payoutDist: Record<string, number> = {};

    for (let i = 0; i < 100; i++) {
      const session = new GameSession();
      const result = session.createRound({ stake: 1, random: makeSeededRandom(i * 137) });

      if (result.totalPayout > 0) {
        totalRoundsWithPayout++;
        // Categorize patterns
        for (const card of result.round.cards) {
          for (const p of card.completedPatterns) {
            payoutDist[p.group.name] = (payoutDist[p.group.name] ?? 0) + 1;
          }
        }
      }
      totalPayout += result.totalPayout;
      if (result.totalPayout > maxPayout) {
        maxPayout = result.totalPayout;
        bestSeed = i * 137;
      }
      if (result.extraAvailable) extraRounds++;
    }

    const log: string[] = [];
    log.push('');
    log.push('╔═══════════════════════════════════════════════════════╗');
    log.push('║            100 ROUNDS — STATISTICS                    ║');
    log.push('╚═══════════════════════════════════════════════════════╝');
    log.push(`  Rounds with payout:  ${totalRoundsWithPayout}/100`);
    log.push(`  Total payout:        ${totalPayout}`);
    log.push(`  Average payout:      ${(totalPayout / 100).toFixed(2)}`);
    log.push(`  Max payout:          ${maxPayout} (seed ${bestSeed})`);
    log.push(`  Rounds with extras:  ${extraRounds}`);
    log.push('');
    log.push('  Pattern frequency:');

    const sortedDist = Object.entries(payoutDist).sort((a, b) => b[1] - a[1]);
    for (const [name, count] of sortedDist) {
      const bar = '█'.repeat(Math.min(count, 40));
      log.push(`    ${name.padEnd(16)} ${String(count).padStart(3)}  ${bar}`);
    }

    log.push('');
    log.push('═══════════════════════════════════════════════════════');
    console.log(log.join('\n'));

    expect(totalRoundsWithPayout).toBeGreaterThan(0);
  });
});
