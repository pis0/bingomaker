# BingoMaker — Project Overview

## What is BingoMaker?

BingoMaker is a web-based game engine for building bingo games. It runs inside **WebView** containers (iOS WKWebView, Android System WebView) — not a traditional browser. The first game being ported is **Menton**, a citrus/fruit-themed bingo originally built in AS3/AIR/Starling for Praia Bingo (Pipa Studios).

The port is a **faithful recreation**: all visual behavior, animations, timing, easing, layout, and game mechanics match the original AS3 legacy code 1:1. The implementation approach (React, PixiJS, Web Audio) is modern, but the **visual output is identical** to the legacy.

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | React + TypeScript (strict mode) | 19 / 5.9 |
| Rendering | PixiJS via `@pixi/react` | 8.x |
| State | Zustand | 5.x |
| Build | Vite + `@vitejs/plugin-react` (Babel) | 7.x |
| Tests | Vitest | 4.x |
| Lint | ESLint 9 flat config (typescript-eslint, react-hooks, react-refresh) | 9.x |
| Audio | Web Audio API (no external library) | — |

**Runtime target**: WebGPU preferred, WebGL2/WebGL fallback. Canvas as last resort.

## How to Run

```bash
# Install dependencies
npm install

# Pull LFS assets (required — without this, binary files are 130-byte pointers)
git lfs pull

# Start dev server with HMR
npm run dev

# Build for production (type-check + bundle)
npm run build

# Run tests
npm run test:run

# Run simulation tests (verbose)
npm run test:sim
```

## Project Structure

```
src/
├── main.tsx                    # Entry point — renders <App /> into #root
├── App.tsx                     # Root: preloader, viewport scaling, PixiJS app
├── index.css                   # Global styles (viewport scaling, font-face)
│
├── engine/                     # Pure game logic (no UI, no React)
│   ├── Card.ts                 # Single card state (3×5 grid, matches, patterns)
│   ├── CardDistributor.ts      # Generates 4 cards + ball draw sequence
│   ├── Draw.ts                 # Single ball draw record
│   ├── GameSession.ts          # Session container (creates rounds)
│   ├── Round.ts                # Round state (balls, cards, payouts, extras)
│   ├── Pattern.ts              # 17 hierarchical pattern definitions
│   ├── PatternResolver.ts      # Pattern matching after each draw
│   ├── SlotBonusSession.ts     # Bell hits → slot spin bonus
│   ├── FruitBombBonusSession.ts # Fruit bomb 2×2 bonus
│   ├── constants.ts            # Grid size, ball counts, stakes
│   ├── types.ts                # MatchType, Grid<T>, RandomFn
│   ├── utils.ts                # range(), shuffle()
│   └── __tests__/              # 8 test files (comprehensive coverage)
│
├── store/
│   └── gameStore.ts            # Zustand store — animation flags + engine state
│
├── components/menton/          # All game UI components (28 files)
│   ├── Menton.tsx              # Root orchestrator (bell→slot chain, BG music, bonuses)
│   ├── Scenery.tsx             # Background sprite
│   ├── CardPanel.tsx           # 2×2 card grid
│   ├── CardView.tsx            # Single card (3×5)
│   ├── SlotCell.tsx            # Individual number cell
│   ├── BallPanel.tsx           # Ball discharge tube + launch + peel
│   ├── AnimatedBall.tsx        # Ball trajectory animation
│   ├── BellPanel.tsx           # Bell visual + ring trigger
│   ├── ButtonPanel.tsx         # Play/Extra/End buttons + stake selector
│   ├── PayoutTable.tsx         # 7-card payout display
│   ├── JackpotPanel.tsx        # Progressive jackpot
│   ├── PatternMovie.tsx        # Pattern win animation
│   ├── BingoMovie.tsx          # FULL pattern burst
│   ├── MovieSplash.tsx         # Prize splash label
│   ├── FruitBombAnimation.tsx  # Fruit bomb effect
│   ├── ChipFlyAnimation.tsx    # Chips flying to payout
│   ├── MultiplierCollect.tsx   # X2 multiplier animation
│   ├── *Constants.ts           # Layout, ball, card, payout position constants
│   └── ...                     # Supporting components
│
├── animations/                 # MovieBytes binary animation system
│   ├── MovieBytesPlayer.ts     # PixiJS player (sprite pool, matrix transforms)
│   ├── parseMovieBytes.ts      # Binary .bytes file parser
│   └── loadMovieBytes.ts       # Fetch + parse
│
├── particles/                  # Particle emitter system
│   ├── ParticleEmitter.ts      # Sprite pool physics (velocity, gravity, color lerp)
│   ├── parsePex.ts             # Parse .pex XML (Starling format) → JSON config
│   ├── useParticleEmitter.ts   # React hook + cleanup
│   └── configs/                # 6 pre-configured emitters
│
├── assets/                     # Asset loading pipeline
│   ├── AssetManager.ts         # GPU detection + KTX2 transcoder setup
│   ├── manifest.ts             # Bundle manifest (core, panels, movies)
│   ├── atlas.ts                # Texture lookup helpers (tex, textures, texFrom)
│   ├── bitmapFonts.ts          # 23 BitmapFont installations (3x resolution)
│   └── useAssets.ts            # Multi-stage preloader with retry/recovery
│
├── audio/                      # Audio system
│   ├── AudioManager.ts         # 3-channel Web Audio API (BG, SFX, VO)
│   └── SoundID.ts              # Audio URL constants
│
└── debug/                      # Debug tools (activated via ?devtools URL param)
    ├── DebugPanel.tsx           # Devtools UI container
    ├── useDebugEngine.ts        # Mock game engine for testing
    ├── PixiStats.tsx            # FPS + GPU memory stats
    ├── SoundToggles.tsx         # Music/SFX/VO toggles
    ├── helpers/                 # Formatters, pattern forcing
    └── sections/               # DrawLog, CardGrid, Simulation, Bonus panels
```

## What's NOT in This Repo

- **Server-side logic**: No backend. The engine runs entirely client-side. In production, round data (cards, ball sequences) comes from the game server via the native WebView bridge.
- **Native shell**: The iOS/Android/Windows/macOS native apps that host the WebView are in separate repositories.
- **Other games**: BingoMaker is designed as a platform, but currently only Menton is implemented.
