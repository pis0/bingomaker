import { useState } from 'react';
import { useDebugEngine } from './useDebugEngine';
import SimulationSection from './sections/SimulationSection';
import CardGridSection from './sections/CardGridSection';
import DrawLogSection from './sections/DrawLogSection';
import PatternTestSection from './sections/PatternTestSection';
import './DebugPanel.css';

export default function DebugPanel() {
  const engine = useDebugEngine();
  const { state } = engine;
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="debug-panel">
      <div className="debug-header" onClick={() => setCollapsed(!collapsed)}>
        <h3>BINGO DEBUG</h3>
        <button>{collapsed ? '+' : '-'}</button>
      </div>
      {!collapsed && (
        <div className="debug-body">
          <SimulationSection engine={engine} />

          {state.round && (
            <>
              <div className="debug-section">
                <h4>Cards</h4>
                <div className="debug-cards">
                  {state.round.cards.map((card) => (
                    <CardGridSection
                      key={card.index}
                      card={card}
                      preview={state.patternPreview}
                    />
                  ))}
                </div>
              </div>

              <DrawLogSection round={state.round} />
              <PatternTestSection engine={engine} />
            </>
          )}
        </div>
      )}
    </div>
  );
}
