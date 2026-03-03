# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

BingoMaker é uma engine/plataforma web para construir jogos de bingo. O primeiro jogo sendo portado é o **Menton** (tema citrus/frutas), originalmente em AS3/AIR/Starling no Praia Bingo. O app roda dentro de **WebView** (não browser) em iOS (WKWebView, min iOS 14+) e Android (System WebView, min Android 5+).

## Commands

- `npm run dev` — Start dev server with HMR
- `npm run build` — Type-check with `tsc -b` then bundle with Vite
- `npm run lint` — Run ESLint
- `npm run preview` — Preview production build locally

## Tech Stack

| Camada | Tech |
|--------|------|
| Framework | React 19 + TypeScript (strict mode) |
| Rendering | PixiJS 8 via `@pixi/react` (dual renderer: WebGPU + WebGL fallback) |
| Estado | React hooks + Context (sem Zustand) |
| Build | Vite 7 + `@vitejs/plugin-react` (Babel) |
| Testes | Vitest (a configurar) |
| Lint | ESLint 9 flat config (typescript-eslint, react-hooks, react-refresh) |

## Architecture

- `src/main.tsx` — Entry point, renders `<App />` into `#root`
- `src/App.tsx` — Root component
- `_ref/` — Referência: assets e código AS3 do Menton original

### TypeScript Config

Project references: `tsconfig.app.json` (src/) e `tsconfig.node.json` (Vite config). Strict mode com `noUnusedLocals`, `noUnusedParameters`, `erasableSyntaxOnly`.

## Menton — Jogo Original (AS3/Starling)

O código fonte AS3 fica em `~/workspace/pipa/praia/dev/client/menton/`. Referência para o port.

### Mecânicas do Jogo
- Cartela **3x5** (bingo 90 bolas, estilo brasileiro)
- **30 bolas** base + **12 extras** + **3 super extras** = 45 max
- Até **4 cartelas** por rodada
- Padrões de bingo: linhas, colunas, quads, etc
- 3 tipos de bônus: Fruit Bomb, Fête du Citron, Slot/Box Game
- Jackpot progressivo compartilhado
- Auto Play (jogo contínuo)

### Arquitetura Original (MVC)
- **MentonEngine** — Game logic, state, player actions
- **MentonView** — View updates from game events
- **MentonController** — Controller orchestration
- **Round** — Round state, ball draws, pattern matching
- **RoundMotion** — Animation choreography
- 75 classes de componentes UI, 9 controllers, 31 domain models

### Data Flow Original
1. Server → `GameWelcome`, `MentonJackpot` notifications
2. Client → `MentonHello`, `MentonRequest`
3. `NewRound` recebido → `setNewRound()`
4. `Round` recebido → `processRound()` → `RoundMotion.triggerRound()`
5. Bolas sorteadas sequencialmente → animações
6. Card matches → Pattern checking → Visual updates
7. Extras disponíveis → Extra balls
8. Round ends → Payout calculation

## Assets Strategy

- **Imagens**: WebP com transparência (@1x e @2x)
- **Assets existentes do AS3**: converter XML Starling → JSON PixiJS, PNG → WebP
- **Assets novos**: exportar direto em JSON PixiJS + WebP
- **Carregamento**: tudo pré-carregado antes de renderizar componentes

## Texto & Áudio

- **Texto**: PixiJS Text (Canvas). Se performance na WebView for ruim, migrar para BitmapText
- **Áudio**: Web Audio API direto (sem lib externa). AudioManager wrapper leve com: play, pause, stop, loop, volume, seek. Listeners: onPlay, onPause, onStop, onEnd, onUpdate (tick), onLoop. Sem filtros além de volume
- **Voice-overs**: 5 idiomas (PT, EN, ES, FR, IT)

## Development Approach

- Componente por componente, conversando antes de cada um
- Ordem planejada: **BG → ButtonPanel → PayoutPanel → componentes periféricos → BallPanel → CardPanel**
- Código será mantido por agentes IA — manter legível e bem estruturado
