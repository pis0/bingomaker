import { useState } from 'react';
import { SORTED_PATTERNS } from '../../engine/Pattern';
import { NUM_CARDS } from '../../engine/constants';
import type { DebugEngine } from '../useDebugEngine';

interface Props {
  engine: DebugEngine;
}

export default function PatternTestSection({ engine }: Props) {
  const { state, setPreview, forcePattern } = engine;
  const [patternIndex, setPatternIndex] = useState(0);
  const [cardIndex, setCardIndex] = useState(0);

  const hasRound = state.round !== null;
  const pattern = SORTED_PATTERNS[patternIndex];

  const handlePreview = () => {
    if (!hasRound) return;
    setPreview(pattern, cardIndex);
  };

  const handleForce = () => {
    if (!hasRound) return;
    forcePattern(pattern, cardIndex);
    // Clear preview after forcing
    setPreview(null, 0);
  };

  const handleClearPreview = () => {
    setPreview(null, 0);
  };

  const isPreviewActive = state.patternPreview !== null;

  return (
    <div className="debug-section">
      <h4>Pattern Test</h4>
      <div className="debug-row">
        <label>Pat</label>
        <select
          className="debug-select"
          value={patternIndex}
          onChange={(e) => setPatternIndex(Number(e.target.value))}
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
          onChange={(e) => setCardIndex(Number(e.target.value))}
        >
          {Array.from({ length: NUM_CARDS }, (_, i) => (
            <option key={i} value={i}>
              Card {i}
            </option>
          ))}
        </select>
      </div>
      <div className="debug-btn-row">
        <button className="debug-btn" onClick={handlePreview} disabled={!hasRound}>
          Preview
        </button>
        {isPreviewActive && (
          <button className="debug-btn" onClick={handleClearPreview}>
            Clear
          </button>
        )}
        <button className="debug-btn debug-btn--primary" onClick={handleForce} disabled={!hasRound}>
          Force & Check
        </button>
      </div>
    </div>
  );
}
