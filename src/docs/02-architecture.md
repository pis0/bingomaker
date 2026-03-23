# Architecture

## Separation of Concerns

The codebase is split into three layers:

```
┌─────────────────────────────────────────────┐
│              Components (React + PixiJS)     │  UI, animations, user interaction
├─────────────────────────────────────────────┤
│              Store (Zustand)                 │  Shared state, animation flags
├─────────────────────────────────────────────┤
│              Engine (pure TypeScript)        │  Game logic, no UI dependency
└─────────────────────────────────────────────┘
```

### Engine (`src/engine/`)

Pure game logic with **zero UI dependencies**. Can be tested independently. Key classes:

- **GameSession** — Creates rounds, delegates ball draws.
- **Round** — Holds 4 Cards, ball sequence, draw history, payout accumulation. **Mutable** object (important — see Design Decisions below).
- **Card** — 3×5 grid with match tracking, pattern completion, and payout calculation.
- **Pattern** — 17 predefined patterns with parent-child hierarchy. A `QUAD` is a child of `TRIPLE_COLUMN` — when the parent completes, the child's payout is deducted.
- **PatternResolver** — Scans all patterns after each ball draw, marks completions and "missing-one" expectations.
- **SlotBonusSession** — Tracks 4 bell positions; 4 hits trigger the slot spin bonus with weighted symbol probabilities.
- **FruitBombBonusSession** — Selects random 2×2 blocks per card, marks cells, checks patterns.

### Store (`src/store/gameStore.ts`)

Single Zustand store. Contains:

- **Engine state**: current Round, stake, ball count target.
- **Animation flags**: `bellRingActive`, `splashActive`, `fruitBombActive`, `multiplierActive`, etc. Components set these to coordinate complex animation chains.
- **Button state**: current phase (`play` | `halt` | `peel` | `extra` | `super`), enabled flag.
- **Derived**: `bonusActive` computed from all animation flags; `drawing` from target ball count.

Components subscribe to fine-grained slices to avoid unnecessary re-renders.

### Components (`src/components/menton/`)

React + PixiJS components. The root orchestrator is `Menton.tsx`, which:
1. Syncs engine state to Zustand on each frame.
2. Manages animation chains (bell ring → slot spin → multiplier/fruit bomb).
3. Controls BG music volume transitions during rounds.
4. Cycles idle pattern highlights when not drawing.

## Data Flow

### New Round
```
DebugEngine.newRound()
  → GameSession.createRound(stake)
    → CardDistributor.distribute(seed)     // generates 4 cards + ball sequence
    → Round.process(stake)                 // pre-simulates all draws
  → setRound(round)                        // pushes to Zustand
  → Components re-render with new round
```

### Ball Draw
```
User clicks Play
  → DebugEngine.advance()
    → targetBallCount++                    // Zustand flag
  → BallPanel detects targetBallCount > drawn
    → Round.drawNext()                     // mutates Round
    → AnimatedBall launches               // tube → roll → discharge
    → Cards check matches                 // MatchType: NEW_MATCH, NEW_MATCH_IN_PATTERN, etc.
    → PatternResolver checks patterns     // may complete patterns
    → PayoutTable updates                 // payout animation
    → If pattern completed:
      → PatternMovie plays                // animation
      → MovieSplash shows                 // prize label + VO
      → ChipFlyAnimation                  // chips fly to payout
```

### Bonus Chain
```
Bell hit (4th) → BellRingAnimation
  → SlotBonusSession.spin()
    → Symbol result: X2 | FRUIT | BONUS
  → If X2: MultiplierCollect animation
  → If FRUIT: FruitBombAnimation (2×2 marks + pattern checks)
  → If BONUS: Fête du Citron (TODO)
```

## Key Design Decisions

### Mutable Round + useRef (not useReducer)

Round and Card objects are **mutable**. React's StrictMode runs reducers twice, which corrupts mutable state. Instead:
- `useRef` holds the mutable Round.
- `useState` holds a tick counter.
- After mutation, bump the tick to trigger re-renders.
- Zustand's `bumpTick()` action serves this purpose globally.

### Time-Based Animations (never frame-based)

All animations use `deltaMS` (elapsed milliseconds), not frame counts. This ensures consistent behavior across 60Hz, 90Hz, and 120Hz displays — critical for mobile WebViews where refresh rate varies by device.

### Atlas Per Panel

Each major UI panel has its own spritesheet atlas:
- `menton_ballpanel`, `menton_cardpanel`, `menton_pattern`, `menton_payoutpanel`, `menton_bellpanel`, `menton_jackpot`, `menton_button`, `menton_common`
- Self-contained: no name collisions between panels.
- Can be loaded/unloaded independently.
- Format: KTX2 (GPU-compressed) for WebGL/WebGPU; WebP fallback for Canvas.

### BitmapFont Strategy

All in-game text uses PixiJS BitmapFont (not Canvas Text):
- **Resolution**: 3x (sharp on all densities).
- **Color**: All fonts installed as WHITE, tinted per-component via `tint` prop. This cuts GPU memory ~50% (one atlas shared across all color variants).
- **Texture size**: 256px pages (~4MB each).
- **23 font variants** across 3 families: Iowan Old Style Black, Myriad Pro, Clarendon Black BT.

### Three-Channel Audio

Web Audio API, no external library:
- **BG**: 1 exclusive looping source with crossfade.
- **VO**: 1 exclusive source (new playback cancels previous). Supports random variant selection (5 languages).
- **SFX**: N parallel fire-and-forget sources.
- Independent toggle for each channel (persisted in localStorage).
- AudioContext resumed on first user gesture (iOS/Android requirement).

## Component Hierarchy

```
App
└── Menton (root orchestrator)
    ├── Scenery (background)
    ├── CardPanel
    │   ├── CardView × 4
    │   │   ├── SlotCell × 15
    │   │   └── MissingMark (conditional)
    │   └── BingoMovie (on FULL pattern)
    ├── BallPanel
    │   ├── AnimatedBall × N
    │   ├── BallCounter
    │   ├── TubeWater
    │   └── IdleLemon
    ├── BellPanel
    │   ├── BellRingAnimation
    │   └── BellFlyAnimation
    ├── ButtonPanel (Play/Extra/End + stakes)
    ├── PayoutTable
    │   └── PayoutCard × 7
    ├── JackpotPanel
    ├── PatternMovie
    ├── MovieSplash
    ├── SliceMovie
    ├── FruitBombAnimation
    ├── ChipFlyAnimation
    ├── MultiplierCollect
    └── Payout (end-of-round collect)
```
