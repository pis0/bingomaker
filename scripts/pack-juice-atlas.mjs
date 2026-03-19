#!/usr/bin/env node
/**
 * Extracts juice_* sprites from menton_bonus0.png and menton_bonus1.png,
 * packs them into a single menton_juice.png + menton_juice.json atlas.
 *
 * Preserves rotation flags — rotated sprites are stored as-is (rotated)
 * in the new atlas, keeping the same PixiJS JSON semantics.
 *
 * Usage: node scripts/pack-juice-atlas.mjs
 */
import sharp from 'sharp'
import { readFileSync, writeFileSync } from 'fs'

// Source atlases — juice sprites split across bonus0 and bonus1
const SOURCES = [
  { json: 'public/assets/menton/menton_juice0.json', png: 'public/assets/menton/menton_bonus0.png' },
  { json: 'public/assets/menton/menton_juice1.json', png: 'public/assets/menton/menton_bonus1.png' },
]

const OUTPUT_PNG = 'public/assets/menton/menton_juice.png'
const OUTPUT_JSON = 'public/assets/menton/menton_juice.json'

// Collect all juice sprites with their source info
const sprites = []
for (const src of SOURCES) {
  const atlas = JSON.parse(readFileSync(src.json, 'utf-8'))
  for (const [name, data] of Object.entries(atlas.frames)) {
    // Pixel dimensions in source PNG (rotated sprites are stored swapped)
    const rotated = data.rotated
    const pixW = rotated ? data.frame.h : data.frame.w
    const pixH = rotated ? data.frame.w : data.frame.h
    sprites.push({ name, data, png: src.png, pixW, pixH })
  }
}

// Sort by pixel height descending for strip packing
sprites.sort((a, b) => b.pixH - a.pixH)

// Simple horizontal strip packing
const PADDING = 2
let x = 0
let maxH = 0
const placements = []

for (const s of sprites) {
  placements.push({ ...s, destX: x, destY: 0 })
  x += s.pixW + PADDING
  if (s.pixH > maxH) maxH = s.pixH
}

const atlasW = x - PADDING
const atlasH = maxH

console.log(`Packing ${sprites.length} sprites → ${atlasW}x${atlasH}`)

// Extract each sprite region and composite into new atlas
const composites = []
for (const p of placements) {
  const { frame } = p.data

  const region = await sharp(p.png)
    .extract({ left: frame.x, top: frame.y, width: p.pixW, height: p.pixH })
    .toBuffer()

  composites.push({
    input: region,
    left: p.destX,
    top: p.destY,
  })
}

// Create atlas image
await sharp({
  create: { width: atlasW, height: atlasH, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } }
})
  .composite(composites)
  .png()
  .toFile(OUTPUT_PNG)

console.log(`Written: ${OUTPUT_PNG}`)

// Build PixiJS JSON — frame coords point to new atlas positions
// frame.w/h stay as original content dimensions (PixiJS convention)
const frames = {}
for (const p of placements) {
  frames[p.name] = {
    frame: { x: p.destX, y: p.destY, w: p.data.frame.w, h: p.data.frame.h },
    rotated: p.data.rotated,
    trimmed: p.data.trimmed,
    spriteSourceSize: p.data.spriteSourceSize,
    sourceSize: p.data.sourceSize,
  }
}

const output = {
  frames,
  meta: {
    app: 'pack-juice-atlas.mjs',
    version: '1.0',
    image: 'menton_juice.png',
    format: 'RGBA8888',
    size: { w: atlasW, h: atlasH },
    scale: '1',
  },
}

writeFileSync(OUTPUT_JSON, JSON.stringify(output, null, 2))
console.log(`Written: ${OUTPUT_JSON} (${Object.keys(frames).length} sprites)`)
