# Asset Pipeline

## Overview

Assets are pre-loaded before any game component renders. The system handles GPU-compressed textures (KTX2), WebP fallback, BitmapFonts, audio preloading, and multi-stage recovery for mobile WebViews.

## Texture Formats

| Renderer | Format | Why |
|----------|--------|-----|
| WebGL / WebGPU | KTX2 (UASTC) | GPU-compressed — stays compressed in VRAM, ~4× less GPU memory |
| Canvas (fallback) | WebP | No GPU compression support in Canvas renderer |

Detection is automatic via `AssetManager.init()` which probes for WebGL/WebGPU support.

### KTX2 Transcoder

The KTX2 transcoder (basis_transcoder) is **self-hosted** — not loaded from a CDN. This is critical for WebView environments where CDN access may be restricted or slow.

Files: `public/ktx2/basis_transcoder.wasm` + `basis_transcoder.js`

### Alpha Channel Fix

KTX2/UASTC textures require **premultiplied alpha** in the source PNG and `premultiplied-alpha` mode in PixiJS. After loading, `useAssets.ts` post-processes all textures to set `alphaMode = 'premultiplied-alpha'` and update the GPU resource.

## Atlas Organization

One atlas per major UI panel:

| Bundle | Atlas | Contents |
|--------|-------|----------|
| menton-core | bgmention | Background texture |
| menton-panels | menton_ballpanel | Ball tube, discharge, water, cover |
| menton-panels | menton_cardpanel | Card frame, cells, slot backgrounds |
| menton-panels | menton_pattern | Pattern icons, highlights |
| menton-panels | menton_payoutpanel | Payout cards, labels |
| menton-panels | menton_bellpanel | Bell sprites, ring effects |
| menton-panels | menton_jackpot | Jackpot display elements |
| menton-panels | menton_button | Button states (idle, hit, off) |
| menton-panels | menton_common | Shared sprites (chips, effects) |
| menton-movies | menton_bingo_movie | Bingo burst animation frames |
| menton-movies | menton_fruit_movie | Fruit bomb animation frames |
| menton-movies | menton_juice_movie | Juice splash animation frames |

Each atlas is a PixiJS spritesheet JSON + image (`.ktx2` or `.webp`). Power-of-two dimensions.

### Texture Lookup API

```typescript
import { tex, textures, texFrom, texturesFrom } from '../assets/atlas'

// Search across all loaded atlases
const sprite = tex('button_play_idle')       // single texture
const frames = textures('ball_roll_')         // all matching prefix, sorted

// From a specific atlas
const sprite = texFrom('menton_button', 'play_idle')
const frames = texturesFrom('menton_bingo_movie', 'bingo_burst_')
```

## BitmapFonts

All in-game text uses PixiJS BitmapFont (rasterized glyph atlases) instead of Canvas Text:

- **Resolution**: 3x — sharp on all densities including Retina.
- **Texture size**: 256px pages.
- **Color strategy**: All fonts installed as WHITE. Each component applies color via the `tint` prop. This avoids duplicate atlas pages for each color variant, cutting GPU memory ~50%.
- **23 font variants** registered at startup.

Font families:
- **Iowan Old Style Black** — card slots, counters, balls, missing marks, splash labels.
- **Myriad Pro** — payout values, jackpot amount.
- **Clarendon Black BT** — button labels.

CSS `@font-face` declarations load the `.woff2` files. `document.fonts.ready` gate ensures fonts are available before BitmapFont installation.

## Audio Preloading

All sound files are fetched and decoded into AudioBuffers during the preload phase:
- Batched in groups of 8 concurrent fetches.
- MP3 format.
- Decoded via `AudioContext.decodeAudioData()`.
- Stored in a Map keyed by URL.
- Progress reported independently (15% of total preload bar).

## Preload Flow

```
1. Init PixiJS asset registry (AssetManager.init)
2. In parallel:
   a. Load texture bundles (85% of progress bar)
   b. Load CSS fonts (@font-face → document.fonts.ready)
   c. Preload all audio (15% of progress bar)
3. Post-processing:
   a. KTX2 alpha fix (premultiplied-alpha on all textures)
   b. BitmapFont installation (23 fonts, glyph atlas allocation)
4. Verification:
   a. All fonts present in document.fonts
   b. All expected textures resolve
5. On failure:
   a. Up to 2 automatic retries
   b. Then 1 full page reload
   c. Then "Try Again" button for user
```

## MovieBytes (Binary Animations)

Animations from the AS3/Starling original are exported as `.bytes` binary files:

- Each file contains per-frame data: texture index, instance count, affine matrix, alpha.
- `parseMovieBytes.ts` deserializes the binary format.
- `MovieBytesPlayer.ts` plays them using a pre-allocated Sprite pool with per-frame matrix transforms.
- Scale conversion: Flash authoring coordinates → game coordinates.

## Particle System

Particle effects use a custom emitter based on Starling's particle format:

- `.pex` XML configs from the AS3 project are parsed into JSON (`parsePex.ts`).
- `ParticleEmitter.ts` manages a sprite pool with physics: velocity, radial/tangential acceleration, gravity, size scaling, color interpolation, rotation.
- React integration via `useParticleEmitter.ts` hook (handles lifecycle + GPU cleanup).
- 6 pre-configured emitters: bright columns, chip explosions, water spray, lemon explosions, bubble effects.

## Git LFS

All binary assets (images, audio, .bytes animations) are tracked via Git LFS. After cloning:

```bash
git lfs pull
```

Without this, binary files will be 130-byte LFS pointers instead of actual content.
