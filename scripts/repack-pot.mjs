#!/usr/bin/env node
/**
 * Repacks all panel atlases with shelf packing (max 2048 width)
 * and pads to power-of-2 dimensions for GPU efficiency.
 *
 * Atlases in MOVIE_ATLASES are rescaled by MOVIE_SCALE (0.41667)
 * to convert from Flash authoring coordinates to game coordinates.
 *
 * Usage: node scripts/repack-pot.mjs
 */
import sharp from 'sharp'
import { readFileSync, writeFileSync, renameSync } from 'fs'

const MAX_W = 2048
const PADDING = 2
const DIR = 'public/assets/menton'

/** Flash authoring → game coordinate scale (PRAIA_GAME_CONTAINER_SCALE) */
const MOVIE_SCALE = 0.41667

const PANEL_ATLASES = [
  'menton_ballpanel', 'menton_cardpanel', 'menton_pattern',
  'menton_payoutpanel', 'menton_bellpanel', 'menton_jackpot',
  'menton_button', 'menton_common',
]

/** These atlases contain sprites at Flash authoring resolution → rescale */
const MOVIE_ATLASES = [
  { name: 'menton_bingo', scale: 0.5 },
  { name: 'menton_fruit', scale: MOVIE_SCALE },
]

function nextPOT(n) {
  let p = 64
  while (p < n) p *= 2
  return p
}

async function repackAtlas(name, scale = 1) {
  const jsonPath = `${DIR}/${name}.json`
  const imgPath = `${DIR}/${name}.webp`
  const atlas = JSON.parse(readFileSync(jsonPath, 'utf-8'))

  const sprites = Object.entries(atlas.frames).map(([sname, data]) => {
    const rotated = data.rotated
    const srcW = rotated ? data.frame.h : data.frame.w
    const srcH = rotated ? data.frame.w : data.frame.h
    // Apply scale to get target dimensions
    const pixW = scale !== 1 ? Math.round(srcW * scale) : srcW
    const pixH = scale !== 1 ? Math.round(srcH * scale) : srcH
    return { name: sname, data, srcW, srcH, pixW, pixH }
  })

  // Sort by height descending for shelf packing
  sprites.sort((a, b) => b.pixH - a.pixH)

  // Shelf packing
  let x = 0, y = 0, rowH = 0, maxW = 0
  const placements = []
  for (const s of sprites) {
    if (x + s.pixW > MAX_W && x > 0) {
      y += rowH + PADDING
      x = 0
      rowH = 0
    }
    placements.push({ ...s, destX: x, destY: y })
    x += s.pixW + PADDING
    if (x - PADDING > maxW) maxW = x - PADDING
    if (s.pixH > rowH) rowH = s.pixH
  }

  const contentW = maxW
  const contentH = y + rowH
  const potW = nextPOT(contentW)
  const potH = nextPOT(contentH)

  // Extract sprites from current image, optionally resize, and recomposite
  const composites = []
  for (const p of placements) {
    let pipeline = sharp(imgPath)
      .extract({ left: p.data.frame.x, top: p.data.frame.y, width: p.srcW, height: p.srcH })
    if (scale !== 1) {
      pipeline = pipeline.resize(p.pixW, p.pixH)
    }
    const region = await pipeline.toBuffer()
    composites.push({ input: region, left: p.destX, top: p.destY })
  }

  const tmpPath = `${DIR}/${name}_pot.webp`
  await sharp({
    create: { width: potW, height: potH, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } }
  }).composite(composites).webp({ quality: 90 }).toFile(tmpPath)

  // Update JSON with new dimensions
  const newFrames = {}
  for (const p of placements) {
    const origFrame = p.data.frame
    newFrames[p.name] = {
      frame: { x: p.destX, y: p.destY, w: p.pixW, h: p.pixH },
      rotated: p.data.rotated,
      trimmed: p.data.trimmed,
      spriteSourceSize: scale !== 1 ? {
        x: Math.round((p.data.spriteSourceSize?.x ?? 0) * scale),
        y: Math.round((p.data.spriteSourceSize?.y ?? 0) * scale),
        w: p.pixW,
        h: p.pixH,
      } : p.data.spriteSourceSize,
      sourceSize: scale !== 1 ? {
        w: Math.round((p.data.sourceSize?.w ?? origFrame.w) * scale),
        h: Math.round((p.data.sourceSize?.h ?? origFrame.h) * scale),
      } : p.data.sourceSize,
    }
  }
  atlas.frames = newFrames
  atlas.meta.size = { w: potW, h: potH }
  writeFileSync(jsonPath, JSON.stringify(atlas, null, 2))
  renameSync(tmpPath, imgPath)

  const scaleLabel = scale !== 1 ? ` (scale ${scale})` : ''
  console.log(`${name}: ${sprites.length} sprites → ${contentW}x${contentH} → POT ${potW}x${potH}${scaleLabel}`)
}

// Repack panel atlases (no rescale)
for (const name of PANEL_ATLASES) {
  await repackAtlas(name)
}

// Repack movie atlases (rescale to game coordinates)
for (const entry of MOVIE_ATLASES) {
  await repackAtlas(entry.name, entry.scale)
}
