# Mobile WebView Constraints

BingoMaker runs inside native WebView containers, not standalone browsers. This introduces specific constraints that affect the entire codebase.

## Target Platforms

| Platform | WebView | Minimum Version |
|----------|---------|-----------------|
| iOS | WKWebView | iOS 14+ |
| Android | System WebView (Chromium) | Android 5+ |
| Windows | WebView2 (Edge/Chromium) | — |
| macOS | WKWebView | — |

## AudioContext Resumption

Mobile WebViews require a **user gesture** before audio can play. The `AudioManager.resumeAudio()` function is called on the first user tap/click to resume the AudioContext. Without this, all audio calls silently fail.

## Viewport Scaling

The game is designed at a fixed resolution of **760×1024** (portrait). A CSS custom property `--game-scale` dynamically scales the canvas to fit the WebView viewport using a contain-fit strategy. This is handled in `App.tsx`.

## GPU Memory Budget

Mobile GPUs have limited VRAM. Key mitigations:

- **KTX2/UASTC textures**: Stay compressed in GPU memory (~4× savings over uncompressed RGBA).
- **BitmapFont white + tint**: One atlas per font variant instead of one per color. Cuts font GPU usage ~50%.
- **Mandatory destroy()**: Every PixiJS object that allocates GPU memory (textures, render targets, bitmap fonts) **must** be explicitly destroyed on component unmount. Failing to do so causes memory leaks that crash iOS after several rounds.
- **Power-of-two atlases**: Required by some older GPUs for optimal memory layout.

The project went through an iOS crash fix where GPU memory was reduced from **709MB to 116MB** by enforcing proper cleanup.

## DecompressionStream

`DecompressionStream` (used for gzip decompression) is **not available** on iOS < 16.4. All `.bytes` animation files are pre-decompressed to avoid needing runtime decompression.

## sessionStorage

Some WebView configurations block `sessionStorage` access. All sessionStorage usage is wrapped in try-catch blocks.

## No CDN Dependencies

The KTX2 transcoder (basis_transcoder) is self-hosted rather than loaded from a CDN. WebView environments may have restricted network access, proxy configurations, or content security policies that block CDN resources.

## Font Loading

CSS `@font-face` with `.woff2` files. A `document.fonts.ready` gate ensures all fonts are loaded before BitmapFont atlas generation — attempting to generate glyph atlases before the font is loaded produces blank textures.

## Performance Rules

1. **Never `setState` inside `useTick`** — PixiJS tick runs every frame. Setting React state inside it causes 60+ re-renders per second. Use refs for imperative updates.
2. **Time-based animations** — Always use `deltaMS`, never frame counts. Mobile devices run at 60/90/120Hz depending on the device.
3. **Zustand fine-grained subscriptions** — Components subscribe to only the state slices they need, preventing cascade re-renders during animations.
