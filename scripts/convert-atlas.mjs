#!/usr/bin/env node
/**
 * Converts a Starling/TexturePacker XML spritesheet to PixiJS JSON format.
 *
 * Usage:
 *   node scripts/convert-atlas.mjs <input.xml> <output.json> [--image <override-image-name>]
 *
 * Example:
 *   node scripts/convert-atlas.mjs _ref/menton/view/assets/sprites/menton0.xml public/assets/menton/menton0.json
 */

import { readFileSync, writeFileSync } from 'fs'
import { basename } from 'path'

const args = process.argv.slice(2)
if (args.length < 2) {
  console.error('Usage: convert-atlas.mjs <input.xml> <output.json> [--image <name>]')
  process.exit(1)
}

const inputPath = args[0]
const outputPath = args[1]
const imageOverrideIdx = args.indexOf('--image')
const imageOverride = imageOverrideIdx !== -1 ? args[imageOverrideIdx + 1] : null

const xml = readFileSync(inputPath, 'utf-8')

// Parse TextureAtlas attributes
const atlasMatch = xml.match(/<TextureAtlas\s+imagePath="([^"]+)"\s+width="(\d+)"\s+height="(\d+)"/)
if (!atlasMatch) {
  console.error('Could not parse TextureAtlas root element')
  process.exit(1)
}

const imagePath = imageOverride || atlasMatch[1]
const atlasW = parseInt(atlasMatch[2])
const atlasH = parseInt(atlasMatch[3])

// Parse all SubTexture entries
const subTextureRegex = /<SubTexture\s+([^/]+)\/>/g
const attrRegex = /(\w+)="([^"]+)"/g

const frames = {}

let match
while ((match = subTextureRegex.exec(xml)) !== null) {
  const attrStr = match[1]
  const attrs = {}
  let attrMatch
  while ((attrMatch = attrRegex.exec(attrStr)) !== null) {
    attrs[attrMatch[1]] = attrMatch[2]
  }
  attrRegex.lastIndex = 0

  const name = attrs.name
  if (!name) continue

  const x = parseInt(attrs.x)
  const y = parseInt(attrs.y)
  const w = parseInt(attrs.width)
  const h = parseInt(attrs.height)
  const rotated = attrs.rotated === 'true'

  // In Starling XML, rotated sprites have w/h as atlas dimensions (already rotated).
  // PixiJS v8 expects frame w/h as ORIGINAL (unrotated) content dimensions — it swaps internally.
  // For rotated: original content = swap(w, h) from XML.
  const contentW = rotated ? h : w
  const contentH = rotated ? w : h
  const frameRect = { x, y, w: contentW, h: contentH }

  // Source size (original untrimmed size) — frameWidth/frameHeight are always in original space
  const hasFrame = 'frameX' in attrs
  const frameX = hasFrame ? parseInt(attrs.frameX) : 0
  const frameY = hasFrame ? parseInt(attrs.frameY) : 0
  const frameW = hasFrame ? parseInt(attrs.frameWidth) : contentW
  const frameH = hasFrame ? parseInt(attrs.frameHeight) : contentH

  // spriteSourceSize = the region within the sourceSize where the trimmed sprite goes
  // Must be in original (unrotated) coordinate space
  const trimmed = hasFrame && (frameX !== 0 || frameY !== 0 || frameW !== contentW || frameH !== contentH)

  frames[name] = {
    frame: frameRect,
    rotated,
    trimmed,
    spriteSourceSize: {
      x: trimmed ? -frameX : 0,
      y: trimmed ? -frameY : 0,
      w: contentW,
      h: contentH,
    },
    sourceSize: { w: frameW, h: frameH },
  }
}

const output = {
  frames,
  meta: {
    app: 'convert-atlas.mjs',
    version: '1.0',
    image: imagePath,
    format: 'RGBA8888',
    size: { w: atlasW, h: atlasH },
    scale: '1',
  },
}

writeFileSync(outputPath, JSON.stringify(output, null, 2))
console.log(`Converted ${Object.keys(frames).length} sprites → ${outputPath}`)
console.log(`Atlas image: ${imagePath} (${atlasW}x${atlasH})`)
