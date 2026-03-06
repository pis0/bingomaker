#!/usr/bin/env node
/**
 * Packs individual sprite PNGs into an optimized PixiJS atlas (JSON + PNG).
 * Uses maxrects bin packing with power-of-two dimensions.
 *
 * Usage:
 *   node scripts/pack-atlas.mjs <sprites-dir> <output.json> [--max-size 2048] [--padding 2]
 *
 * Example:
 *   node scripts/pack-atlas.mjs sprites/all public/assets/menton/menton0.json
 */

import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join, basename, dirname } from 'path'
import sharp from 'sharp'

const args = process.argv.slice(2)
if (args.length < 2) {
  console.error('Usage: pack-atlas.mjs <sprites-dir> <output.json> [--max-size 2048] [--padding 2]')
  process.exit(1)
}

const spritesDir = args[0]
const outputJson = args[1]
const maxSizeIdx = args.indexOf('--max-size')
const MAX_SIZE = maxSizeIdx !== -1 ? parseInt(args[maxSizeIdx + 1]) : 2048
const paddingIdx = args.indexOf('--padding')
const PADDING = paddingIdx !== -1 ? parseInt(args[paddingIdx + 1]) : 2

// Read all PNGs
const files = readdirSync(spritesDir)
  .filter(f => f.endsWith('.png'))
  .sort()

console.log(`Found ${files.length} sprites in ${spritesDir}`)

// Get dimensions of each sprite
const sprites = []
for (const file of files) {
  const name = basename(file, '.png')
  const meta = await sharp(join(spritesDir, file)).metadata()
  sprites.push({ name, file, w: meta.width, h: meta.height })
}

// Sort by max dimension descending (better packing)
sprites.sort((a, b) => Math.max(b.w, b.h) - Math.max(a.w, a.h))

// Simple shelf-based packing (good enough, fast)
function packShelves(sprites, maxW, maxH, padding) {
  const placed = []
  let shelfY = 0
  let shelfH = 0
  let curX = 0

  for (const sp of sprites) {
    const pw = sp.w + padding
    const ph = sp.h + padding

    // Try to fit on current shelf
    if (curX + pw <= maxW && shelfY + Math.max(shelfH, ph) <= maxH) {
      placed.push({ ...sp, x: curX, y: shelfY })
      curX += pw
      shelfH = Math.max(shelfH, ph)
    }
    // New shelf
    else if (pw <= maxW && shelfY + shelfH + ph <= maxH) {
      shelfY += shelfH
      shelfH = 0
      curX = 0
      placed.push({ ...sp, x: curX, y: shelfY })
      curX += pw
      shelfH = ph
    } else {
      console.error(`  Cannot fit sprite ${sp.name} (${sp.w}x${sp.h}) in ${maxW}x${maxH}`)
      return null
    }
  }

  return { placed, usedW: maxW, usedH: shelfY + shelfH }
}

// Find smallest power-of-two that fits
function nextPOT(v) {
  let p = 64
  while (p < v) p *= 2
  return Math.min(p, MAX_SIZE)
}

// Try progressively larger sizes
let result = null
for (let size = 256; size <= MAX_SIZE; size *= 2) {
  // Try square first, then wider
  for (const [w, h] of [[size, size], [size * 2, size], [size, size * 2]]) {
    if (w > MAX_SIZE || h > MAX_SIZE) continue
    result = packShelves(sprites, w, h, PADDING)
    if (result) {
      result.usedW = w
      result.usedH = h
      break
    }
  }
  if (result) break
}

if (!result) {
  console.error('Could not pack all sprites within size limit')
  process.exit(1)
}

const { placed, usedW, usedH } = result
console.log(`Packed ${placed.length} sprites into ${usedW}x${usedH}`)

// Composite all sprites onto atlas
const composites = []
for (const sp of placed) {
  composites.push({
    input: join(spritesDir, sp.file),
    left: sp.x,
    top: sp.y,
  })
}

const outputPng = outputJson.replace(/\.json$/, '.png')

mkdirSync(dirname(outputJson), { recursive: true })

await sharp({
  create: { width: usedW, height: usedH, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } }
})
  .composite(composites)
  .png({ compressionLevel: 9 })
  .toFile(outputPng)

// Generate PixiJS JSON
const frames = {}
for (const sp of placed) {
  frames[sp.name] = {
    frame: { x: sp.x, y: sp.y, w: sp.w, h: sp.h },
    rotated: false,
    trimmed: false,
    spriteSourceSize: { x: 0, y: 0, w: sp.w, h: sp.h },
    sourceSize: { w: sp.w, h: sp.h },
  }
}

const json = {
  frames,
  meta: {
    app: 'pack-atlas.mjs',
    version: '1.0',
    image: basename(outputPng),
    format: 'RGBA8888',
    size: { w: usedW, h: usedH },
    scale: '1',
  },
}

writeFileSync(outputJson, JSON.stringify(json, null, 2))

console.log(`Output: ${outputPng} + ${outputJson}`)
console.log(`Atlas image size: ${(await sharp(outputPng).metadata()).size || 'check file'} bytes`)
