import { useState } from 'react';
import { DEFAULT_BALLS, NUM_CARDS, STAKE_LEVELS } from '../../engine/constants';
import { SORTED_PATTERNS } from '../../engine/Pattern';
import type { DebugEngine } from '../useDebugEngine';

interface Props {
  engine: DebugEngine;
}

export default function SimulationSection({ engine }: Props) {
  const { round, seed, stakeIndex, setSeed, setStakeIndex, newRound, shuffle, forceNow, drawNext, drawAll, drawExtra, drawSuperExtra, undoDraw, setPreview } = engine;

  const [forceEnabled, setForceEnabled] = useState(false);
  const [patternIndex, setPatternIndex] = useState(0);
  const [cardIndex, setCardIndex] = useState(0);

  const drawn = round?.currentBallIndex ?? 0;
  const payout = round?.totalPayout ?? 0;
  const canDraw = round !== null && drawn < (round.ballSequence.length);
  const canDrawBase = round !== null && drawn < DEFAULT_BALLS;
  const canExtra = round?.extraAvailable ?? false;
  const canSuperExtra = round?.superExtraAvailable ?? false;
  const pattern = SORTED_PATTERNS[patternIndex];

  const handleNewRound = () => {
    if (forceEnabled) {
      newRound({ pattern, cardIndex });
      setPreview(pattern, cardIndex);
    } else {
      newRound();
    }
  };

  const handleForceNow = () => {
    if (!round) return;
    forceNow({ pattern, cardIndex });
    setPreview(pattern, cardIndex);
  };

  const handleToggleForce = () => {
    const next = !forceEnabled;
    setForceEnabled(next);
    if (!next) {
      setPreview(null, 0);
    } else if (round) {
      setPreview(pattern, cardIndex);
    }
  };

  const handlePatternChange = (idx: number) => {
    setPatternIndex(idx);
    if (forceEnabled && round) {
      setPreview(SORTED_PATTERNS[idx], cardIndex);
    }
  };

  const handleCardChange = (idx: number) => {
    setCardIndex(idx);
    if (forceEnabled && round) {
      setPreview(pattern, idx);
    }
  };

  return (
    <div className="debug-section">
      <h4>Simulation</h4>

      <div className="debug-row">
        <label>Seed</label>
        <input
          className="debug-input"
          type="number"
          value={seed}
          onChange={(e) => setSeed(Number(e.target.value) || 0)}
        />
      </div>
      <div className="debug-row">
        <label>Stake</label>
        <select
          className="debug-select"
          value={stakeIndex}
          onChange={(e) => setStakeIndex(Number(e.target.value))}
        >
          {STAKE_LEVELS.map((s, i) => (
            <option key={s} value={i}>{s}</option>
          ))}
        </select>
      </div>

      <div className="debug-row">
        <label>
          <input
            type="checkbox"
            checked={forceEnabled}
            onChange={handleToggleForce}
          />
          {' '}Force Pattern
        </label>
      </div>

      {forceEnabled && (
        <>
          <div className="debug-row">
            <label>Pat</label>
            <select
              className="debug-select"
              value={patternIndex}
              onChange={(e) => handlePatternChange(Number(e.target.value))}
            >
              {SORTED_PATTERNS.map((p, i) => (
                <option key={p.name} value={i}>
                  {p.name} ({p.group.name})
                </option>
              ))}
            </select>
          </div>
          <div className="debug-row">
            <label>Card</label>
            <select
              className="debug-select"
              value={cardIndex}
              onChange={(e) => handleCardChange(Number(e.target.value))}
            >
              {Array.from({ length: NUM_CARDS }, (_, i) => (
                <option key={i} value={i}>
                  Card {i}
                </option>
              ))}
            </select>
          </div>
        </>
      )}

      <div className="debug-btn-row">
        <button className="debug-btn debug-btn--primary" onClick={handleNewRound}>
          New Round
        </button>
        {forceEnabled && round && (
          <button className="debug-btn debug-btn--primary" onClick={handleForceNow}>
            Force Now
          </button>
        )}
        <button className="debug-btn" onClick={shuffle} disabled={!round}>
          Shuffle
        </button>
        <button className="debug-btn" onClick={undoDraw} disabled={!round || drawn === 0}>
          Undo
        </button>
        <button className="debug-btn" onClick={drawNext} disabled={!canDraw}>
          Draw Next
        </button>
        <button className="debug-btn" onClick={drawAll} disabled={!canDrawBase}>
          Draw All 30
        </button>
      </div>
      <div className="debug-btn-row">
        <button className="debug-btn" onClick={drawExtra} disabled={!canExtra || !canDraw}>
          Draw Extra
        </button>
        <button className="debug-btn" onClick={drawSuperExtra} disabled={!canSuperExtra || !canDraw}>
          Draw Super Extra
        </button>
      </div>

      {round && (
        <div className="debug-status">
          {drawn}/{round.ballSequence.length} drawn | Payout: {payout}
          {canExtra && ' | Extra available'}
          {canSuperExtra && ' | Super available'}
          <br />
          Bells: {round.slotBonus.hits}/4
          {round.slotBonus.triggered && ` | Slot: [${round.slotBonus.symbols?.join(', ')}]`}
          {round.slotBonus.prize && ` | Prize: ${round.slotBonus.prize}`}
        </div>
      )}
    </div>
  );
}
