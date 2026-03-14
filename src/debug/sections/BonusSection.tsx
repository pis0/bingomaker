import { SLOT_X2, SLOT_FRUIT, SLOT_BONUS, type SlotSymbol } from '../../engine/SlotBonusSession';
import type { DebugEngine } from '../useDebugEngine';

const PRIZE_OPTIONS: { label: string; value: SlotSymbol | null }[] = [
  { label: 'None (random)', value: null },
  { label: 'x2 (multiply)', value: SLOT_X2 },
  { label: 'Fruit Bomb', value: SLOT_FRUIT },
  { label: 'Bonus (Citron)', value: SLOT_BONUS },
];

interface Props {
  engine: DebugEngine;
}

export default function BonusSection({ engine }: Props) {
  const { round, forceSlotPrize, setForceSlotPrize, triggerSlot, bonusActive, isSettling } = engine;
  const slot = round?.slotBonus;

  return (
    <div className="debug-section">
      <h4>Bonus</h4>

      <div className="debug-row">
        <label>Force Slot</label>
        <select
          className="debug-select"
          value={forceSlotPrize ?? ''}
          onChange={(e) => {
            const val = e.target.value;
            setForceSlotPrize(val === '' ? null : val as SlotSymbol);
          }}
        >
          {PRIZE_OPTIONS.map((opt) => (
            <option key={opt.label} value={opt.value ?? ''}>{opt.label}</option>
          ))}
        </select>
      </div>

      <div className="debug-btn-row">
        <button
          className="debug-btn"
          onClick={triggerSlot}
          disabled={!round || (slot?.triggered ?? false) || bonusActive || isSettling}
        >
          Trigger Slot
        </button>
      </div>

      {slot && (
        <div className="debug-status">
          Bells: {slot.hits}/{slot.positions.length}
          {slot.triggered && ` | Symbols: [${slot.symbols?.join(', ')}]`}
          {slot.prize && ` | Prize: ${slot.prize === SLOT_X2 ? 'x2' : slot.prize === SLOT_FRUIT ? 'Fruit Bomb' : 'Bonus'}`}
          {slot.triggered && !slot.prize && ' | No prize'}
        </div>
      )}
    </div>
  );
}
