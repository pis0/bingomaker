import { STAKE_LEVELS } from '../../engine/constants';
import type { DebugEngine } from '../useDebugEngine';

interface Props {
  engine: DebugEngine;
}

export default function SimulationSection({ engine }: Props) {
  const { round, seed, lockSeed, setLockSeed, stakeIndex, setSeed, setStakeIndex, newRound, advance, advanceLabel, canAdvance, canEnd, endRound } = engine;

  const drawn = round?.currentBallIndex ?? 0;
  const payout = round?.totalPayout ?? 0;
  const canExtra = round?.extraAvailable ?? false;
  const canSuperExtra = round?.superExtraAvailable ?? false;

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
          style={{ width: lockSeed ? '60px' : undefined }}
        />
        <label style={{ fontSize: 10, display: 'flex', alignItems: 'center', gap: 3 }}>
          <input type="checkbox" checked={lockSeed} onChange={(e) => setLockSeed(e.target.checked)} />
          Lock
        </label>
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

      <div className="debug-btn-row">
        <button className="debug-btn debug-btn--primary" onClick={newRound}>
          New Round
        </button>
      </div>

      {/* Unified advance button — changes label based on game phase */}
      <div className="debug-btn-row">
        <button
          className="debug-btn debug-btn--primary"
          style={{ minWidth: 120 }}
          onClick={advance}
          disabled={!round || !canAdvance}
        >
          {advanceLabel}
        </button>
        {canEnd && (
          <button className="debug-btn" onClick={endRound}>
            End
          </button>
        )}
      </div>

      {round && (
        <div className="debug-status">
          {drawn}/{round.ballSequence.length} drawn | Payout: {payout}
          {canExtra && ' | Extra available'}
          {canSuperExtra && ' | Super available'}
          {engine.isPeeling && ' | Peel'}
        </div>
      )}
    </div>
  );
}
