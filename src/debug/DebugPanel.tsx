import { useState, useRef, useCallback } from 'react';
import type { DebugEngine } from './useDebugEngine';
import SimulationSection from './sections/SimulationSection';
import CardGridSection from './sections/CardGridSection';
import DrawLogSection from './sections/DrawLogSection';
import './DebugPanel.css';

interface Props {
  engine: DebugEngine;
}

export default function DebugPanel({ engine }: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{ startX: number; startY: number; originX: number; originY: number } | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const movedRef = useRef(false);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if ((e.target as HTMLElement).tagName === 'BUTTON') return;
    dragRef.current = { startX: e.clientX, startY: e.clientY, originX: pos.x, originY: pos.y };
    movedRef.current = false;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [pos]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) movedRef.current = true;
    setPos({ x: dragRef.current.originX + dx, y: dragRef.current.originY + dy });
  }, []);

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current) return;
    dragRef.current = null;
    if (!movedRef.current) {
      setCollapsed((c) => !c);
    }
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  }, []);

  return (
    <div
      ref={panelRef}
      className="debug-panel"
      style={{ transform: `translate(${pos.x}px, ${pos.y}px)` }}
    >
      <div
        className="debug-header"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        <h3>BINGO DEBUG</h3>
        <button onClick={() => setCollapsed(!collapsed)}>{collapsed ? '+' : '-'}</button>
      </div>
      {!collapsed && (
        <div className="debug-body">
          <SimulationSection engine={engine} />

          {engine.round && (
            <>
              <div className="debug-section">
                <h4>Cards</h4>
                <div className="debug-cards">
                  {engine.round.cards.map((card) => (
                    <CardGridSection
                      key={card.index}
                      card={card}
                      bellPosition={engine.round!.bellPositions[card.index]}
                    />
                  ))}
                </div>
              </div>

              <DrawLogSection round={engine.round} />
            </>
          )}
        </div>
      )}
    </div>
  );
}
