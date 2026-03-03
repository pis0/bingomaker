import { DEFAULT_BALLS } from '../../engine/constants';
import type { DebugEngine } from '../useDebugEngine';

interface Props {
  engine: DebugEngine;
}

export default function SimulationSection({ engine }: Props) {
  const { state, setSeed, setStake, newRound, drawNext, drawAll, drawExtra, drawSuperExtra } = engine;
  const { round, seed, stake } = state;

  const drawn = round?.currentBallIndex ?? 0;
  const payout = round?.totalPayout ?? 0;
  const canDraw = round !== null && drawn < (round.ballSequence.length);
  const canDrawBase = round !== null && drawn < DEFAULT_BALLS;
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
        />
      </div>
      <div className="debug-row">
        <label>Stake</label>
        <input
          className="debug-input"
          type="number"
          value={stake}
          min={1}
          onChange={(e) => setStake(Math.max(1, Number(e.target.value) || 1))}
        />
      </div>
      <div className="debug-btn-row">
        <button className="debug-btn debug-btn--primary" onClick={newRound}>
          New Round
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
        </div>
      )}
    </div>
  );
}
