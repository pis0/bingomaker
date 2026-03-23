# Game Mechanics — Menton

## Bingo Basics (90-ball, Brazilian style)

- **Cards**: 3 rows × 5 columns = 15 numbers per card, drawn from 1–90.
- **4 cards** per round.
- Numbers are distributed column-major (matching the original AS3 convention).
- A ball is drawn, and if it matches a number on any card, that cell is "matched".

## Ball Pools

| Phase | Balls | Cumulative | Notes |
|-------|-------|------------|-------|
| Regular | 30 | 30 | Drawn automatically |
| Extra | 10 | 40 | Player buys each individually |
| Super Extra | 5 | 45 | Player buys, higher price |

Maximum 45 balls per round.

## Stakes

8 stake levels: `[1, 2, 3, 5, 10, 25, 50, 100]`

The stake multiplies all payouts. Extra ball prices also scale with stake.

## Patterns (17 total)

Patterns are winning configurations on a card. They form a **hierarchy** — when a parent pattern completes, child payouts are deducted to avoid double-counting.

### Lines (3)
```
LINE_1: [■ ■ ■ ■ ■]    LINE_2: [· · · · ·]    LINE_3: [· · · · ·]
        [· · · · ·]            [■ ■ ■ ■ ■]            [· · · · ·]
        [· · · · ·]            [· · · · ·]            [■ ■ ■ ■ ■]
```

### Double Columns (4)
```
DC_1: [■ ■ · · ·]  DC_2: [· ■ ■ · ·]  DC_3: [· · ■ ■ ·]  DC_4: [· · · ■ ■]
      [■ ■ · · ·]        [· ■ ■ · ·]        [· · ■ ■ ·]        [· · · ■ ■]
      [■ ■ · · ·]        [· ■ ■ · ·]        [· · ■ ■ ·]        [· · · ■ ■]
```
Each is a **child** of the Triple Column that contains it.

### Triple Columns (3)
```
TC_1: [■ ■ ■ · ·]  TC_2: [· ■ ■ ■ ·]  TC_3: [· · ■ ■ ■]
      [■ ■ ■ · ·]        [· ■ ■ ■ ·]        [· · ■ ■ ■]
      [■ ■ ■ · ·]        [· ■ ■ ■ ·]        [· · ■ ■ ■]
```

### Quads (4)
```
Q_1: [■ ■ · · ·]  Q_2: [· ■ ■ · ·]  Q_3: [· · ■ ■ ·]  Q_4: [· · · ■ ■]
     [■ ■ · · ·]       [· ■ ■ · ·]       [· · ■ ■ ·]       [· · · ■ ■]
     [· · · · ·]       [· · · · ·]       [· · · · ·]       [· · · · ·]
```
Each is a **child** of the Triple Column that contains its columns.

### Full (1)
```
FULL: [■ ■ ■ ■ ■]
      [■ ■ ■ ■ ■]
      [■ ■ ■ ■ ■]
```
All 15 cells matched = BINGO.

### Parent-Child Payout Deduction

When `TRIPLE_COLUMN_1` completes and `DOUBLE_COLUMN_1` was already completed:
- The `DOUBLE_COLUMN_1` payout is **deducted** from the player's total.
- This prevents paying for both the subset and the superset.

## Missing-One Expectations

When a pattern is exactly 1 ball away from completion, the engine tracks this as a "missing-one expectation":
- The cell is visually highlighted (MissingMark component).
- PayoutTable shows which ball is needed and its price.
- This is recalculated after every ball draw.

## Slot Bonus (Bell Mechanic)

1. Each round places 1 bell on a random cell in each of the 4 cards.
2. When a bell cell is matched, it counts as a **bell hit**.
3. After **4 bell hits**, the slot spin bonus triggers.
4. Spin result (weighted probability):
   - **X2**: Doubles the current round payout.
   - **FRUIT**: Triggers Fruit Bomb bonus.
   - **BONUS**: Triggers Fête du Citron bonus (not yet implemented).

## Fruit Bomb Bonus

1. Select a random 2×2 block on each card (8 eligible positions to avoid grid overflow).
2. All 4 cells in each block are force-marked as matched.
3. Pattern checks run after each cell mark (may trigger pattern completions).
4. Cells already matched are tracked separately (`trueMatches` vs `nilMatches`).

## Ball Discharge Timing

Ball discharge speed is **dynamic** based on the highest-priority pattern in play:
- 11-step lookup table maps pattern priority to discharge interval.
- Higher priority → faster discharge.
- At priority ≥ 3 (`HALT_PRIORITY`), discharge **pauses** and waits for the player to manually advance (peel interaction).

## Peel Mechanic

After regular balls are drawn:
1. A cover sits on the discharge tube.
2. Player drags/taps to "peel" the cover open.
3. Peel progress controls how fast remaining balls discharge.
4. Wobble + stagger animation accompanies the opening.

## Round Lifecycle

```
1. Player sets stake
2. Player clicks Play
3. newRound() → generates cards + ball sequence
4. 30 regular balls drawn (animated discharge)
5. After regular phase:
   a. If patterns won → show results
   b. If extra balls available → Extra phase (player buys 1-by-1)
   c. If super extra available → Super Extra phase
6. Player clicks End (or all balls exhausted)
7. Payout collect animation
8. Return to idle
```
