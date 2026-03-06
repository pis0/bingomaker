#!/usr/bin/env node
/**
 * Extracts individual sprite frames from a Starling/TexturePacker atlas (XML + PNG).
 * Handles rotated sprites (Starling rotates 90deg CW in atlas).
 *
 * Usage:
 *   node scripts/extract-sprites.mjs <atlas.xml> <output-dir> [--filter prefix1,prefix2]
 *
 * Examples:
 *   # Extract all sprites from main atlas
 *   node scripts/extract-sprites.mjs _ref/.../menton0.xml sprites/menton0
 *
 *   # Extract only liquid animation frames from bonus atlas
 *   node scripts/extract-sprites.mjs _ref/.../menton_bonus0.xml sprites/bonus0 --filter liqu_horizontal,liqu_col
 */

import { readFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import sharp from 'sharp'

const args = process.argv.slice(2)
if (args.length < 2) {
  console.error('Usage: extract-sprites.mjs <atlas.xml> <output-dir> [--filter prefix1,prefix2]')
  process.exit(1)
}

const xmlPath = args[0]
const outDir = args[1]
const filterIdx = args.indexOf('--filter')
const filters = filterIdx !== -1 ? args[filterIdx + 1].split(',') : null

// Parse XML
const xml = readFileSync(xmlPath, 'utf-8')

const atlasMatch = xml.match(/<TextureAtlas\s+imagePath="([^"]+)"\s+width="(\d+)"\s+height="(\d+)"/)
if (!atlasMatch) {
  console.error('Could not parse TextureAtlas element')
  process.exit(1)
}

const imagePath = join(dirname(xmlPath), atlasMatch[1])
const atlasW = parseInt(atlasMatch[2])
const atlasH = parseInt(atlasMatch[3])

console.log(`Atlas: ${imagePath} (${atlasW}x${atlasH})`)

// Parse SubTextures
const subTextureRegex = /<SubTexture\s+([^/]+)\/>/g
const attrRegex = /(\w+)="([^"]+)"/g

const sprites = []
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

  // Apply filter
  if (filters && !filters.some(f => name.startsWith(f))) continue

  sprites.push({
    name,
    x: parseInt(attrs.x),
    y: parseInt(attrs.y),
    w: parseInt(attrs.width),
    h: parseInt(attrs.height),
    rotated: attrs.rotated === 'true',
    frameX: attrs.frameX ? parseInt(attrs.frameX) : 0,
    frameY: attrs.frameY ? parseInt(attrs.frameY) : 0,
    frameW: attrs.frameWidth ? parseInt(attrs.frameWidth) : null,
    frameH: attrs.frameHeight ? parseInt(attrs.frameHeight) : null,
  })
}

console.log(`Found ${sprites.length} sprites${filters ? ` (filter: ${filters.join(', ')})` : ''}`)

mkdirSync(outDir, { recursive: true })

// Load atlas image
const atlasBuffer = readFileSync(imagePath)

let extracted = 0
let errors = 0

for (const sp of sprites) {
  try {
    // In the atlas, rotated sprites store the content rotated 90deg CW.
    // Atlas w/h are the dimensions AS STORED in the atlas (after rotation).
    // For rotated: atlas stores [h_orig x w_orig], so we extract [w, h] then rotate back.
    const extractW = sp.w
    const extractH = sp.h

    // Content dimensions (original, unrotated)
    const contentW = sp.rotated ? sp.h : sp.w
    const contentH = sp.rotated ? sp.w : sp.h

    // Source size (untrimmed frame)
    const srcW = sp.frameW ?? contentW
    const srcH = sp.frameH ?? contentH
    const trimmed = sp.frameX !== 0 || sp.frameY !== 0 || srcW !== contentW || srcH !== contentH

    // Extract the region from the atlas
    let pipeline = sharp(atlasBuffer)
      .extract({ left: sp.x, top: sp.y, width: extractW, height: extractH })

    // If rotated, rotate back 90deg CCW to get original orientation
    if (sp.rotated) {
      pipeline = pipeline.rotate(-90)
    }

    // If trimmed, composite onto full-size canvas to restore original dimensions
    if (trimmed) {
      const trimmedBuf = await pipeline.png().toBuffer()
      pipeline = sharp({
        create: { width: srcW, height: srcH, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } }
      }).composite([{
        input: trimmedBuf,
        left: -sp.frameX,
        top: -sp.frameY,
      }])
    }

    const outPath = join(outDir, `${sp.name}.png`)
    await pipeline.png().toFile(outPath)
    extracted++
  } catch (err) {
    console.error(`  ERROR extracting ${sp.name}: ${err.message}`)
    errors++
  }
}

console.log(`Extracted ${extracted} sprites to ${outDir}${errors ? ` (${errors} errors)` : ''}`)
