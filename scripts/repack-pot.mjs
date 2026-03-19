#!/usr/bin/env node
/**
 * Repacks all panel atlases with shelf packing (max 4096 width)
 * and pads to power-of-2 dimensions for GPU efficiency.
 *
 * Usage: node scripts/repack-pot.mjs
 */
import sharp from 'sharp'
import { readFileSync, writeFileSync, renameSync } from 'fs'

const MAX_W = 4096
const PADDING = 2
const DIR = 'public/assets/menton'

const ATLASES = [
  'menton_ballpanel', 'menton_cardpanel', 'menton_pattern',
  'menton_payoutpanel', 'menton_bellpanel', 'menton_jackpot',
  'menton_button', 'menton_common',
]

function nextPOT(n) {
  let p = 64
  while (p < n) p *= 2
  return p
}

async function repackAtlas(name) {
  const jsonPath = `${DIR}/${name}.json`
  const imgPath = `${DIR}/${name}.webp`
  const atlas = JSON.parse(readFileSync(jsonPath, 'utf-8'))

  const sprites = Object.entries(atlas.frames).map(([sname, data]) => {
    const rotated = data.rotated
    const pixW = rotated ? data.frame.h : data.frame.w
    const pixH = rotated ? data.frame.w : data.frame.h
    return { name: sname, data, pixW, pixH }
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

  // Extract sprites from current image and recomposite
  const composites = []
  for (const p of placements) {
    const region = await sharp(imgPath)
      .extract({ left: p.data.frame.x, top: p.data.frame.y, width: p.pixW, height: p.pixH })
      .toBuffer()
    composites.push({ input: region, left: p.destX, top: p.destY })
  }

  const tmpPath = `${DIR}/${name}_pot.webp`
  await sharp({
    create: { width: potW, height: potH, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } }
  }).composite(composites).webp({ quality: 90 }).toFile(tmpPath)

  // Update JSON
  const newFrames = {}
  for (const p of placements) {
    newFrames[p.name] = {
      frame: { x: p.destX, y: p.destY, w: p.data.frame.w, h: p.data.frame.h },
      rotated: p.data.rotated,
      trimmed: p.data.trimmed,
      spriteSourceSize: p.data.spriteSourceSize,
      sourceSize: p.data.sourceSize,
    }
  }
  atlas.frames = newFrames
  atlas.meta.size = { w: potW, h: potH }
  writeFileSync(jsonPath, JSON.stringify(atlas, null, 2))
  renameSync(tmpPath, imgPath)

  console.log(`${name}: ${sprites.length} sprites → ${contentW}x${contentH} → POT ${potW}x${potH}`)
}

for (const name of ATLASES) {
  await repackAtlas(name)
}
