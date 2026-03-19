#!/usr/bin/env node
/**
 * Splits menton0 atlas into component-specific atlases.
 * Each panel gets its own JSON + WebP atlas.
 *
 * Usage: node scripts/split-atlas.mjs
 */
import sharp from 'sharp'
import { readFileSync, writeFileSync } from 'fs'

const SRC_JSON = 'public/assets/menton/menton0.json'
const SRC_IMG = 'public/assets/menton/menton0.webp'
const OUT_DIR = 'public/assets/menton'

// ── Panel → texture mapping ─────────────────────────────────────
const PANELS = {
  menton_ballpanel: [
    // Balls
    'ball', 'extraball', 'bigball', 'bigballv2',
    // Pipe/tube
    'ballcontainer1', 'ballcontainer2', 'ballpipe',
    // TubeWater
    'liquido_tanque_loop', 'liquido_fim', 'liquido_meio', 'liquido_inicio',
    // TubeWater splash + gotas (prefix match below)
    // Pipoqueira
    'fundopipoqueira', 'tampapipoqueira', 'bigballpipe2',
    'bgextraball', 'bgextraball_full',
    'extragratis', 'dindin77_sk',
    'pipoqueirasuco', 'pipoqueiralimao', 'balljuice',
    'textura_painelbolaextra',
  ],
  menton_ballpanel_prefixes: ['splash', 'gotas_final', 'pipo_juice'],

  menton_cardpanel: [
    'card',
    'cardbell1', 'cardbell2', 'cardbell3', 'cardbell4',
    'cardbet1', 'cardbet2', 'cardbet3', 'cardbet4',
    'cardbet5', 'cardbet6', 'cardbet7', 'cardbet8',
    // Missing
    'missing_holofote', 'missing_3colunas', 'missing_linhadupla',
    'missing_4colunas', 'missing_caixadupla', 'missing_bingo',
    // Moldura
    'moldura_3colunas', 'moldura_4colunas', 'moldura_caixadupla',
    'moldura_linhadupla', 'moldura_bingo',
  ],
  menton_cardpanel_prefixes: ['marking'],

  menton_pattern: [],
  menton_pattern_prefixes: ['liqu_horizontal', 'liqu_col'],

  menton_payoutpanel: [
    'payout', 'payout_on', 'payout_glow',
    'prize1', 'prize2', 'prize3', 'prize4', 'prize5', 'prize6', 'prize7',
    'prizedot1', 'prize_won',
  ],

  menton_bellpanel: [
    'bell1', 'bell2', 'bell3',
    'bell1_on', 'bell2_on', 'bell3_on',
    'bomb1', 'bomb2', 'bomb3',
    'lemon1', 'lemon2', 'lemon3',
    'multiply1', 'multiply2', 'multiply3',
    'slotmask1', 'slotmask2', 'slotmask3',
    'multiply_anim',
  ],

  menton_jackpot: [
    'prizejack', 'prizejack_on', 'ficha57_sk',
    'jackbar1', 'jackbar2',
  ],

  menton_button: [
    'btplay_idle', 'btplay_hit', 'btplay_off',
    'btextra_idle', 'btextra_hit', 'btextra_off',
    'btend_idle', 'btend_hit', 'btend_off',
    'btbet_idle', 'btbet_hit', 'btbet_off',
  ],

  menton_common: [
    'ficha78_sk', 'ficha', 'smallball',
  ],
}

// ── Load source atlas ───────────────────────────────────────────
const srcAtlas = JSON.parse(readFileSync(SRC_JSON, 'utf-8'))
const allFrames = srcAtlas.frames

// ── Build panel frame sets ──────────────────────────────────────
function getFramesForPanel(panelName) {
  const exact = PANELS[panelName] || []
  const prefixes = PANELS[panelName + '_prefixes'] || []
  const result = {}

  for (const name of exact) {
    if (allFrames[name]) result[name] = allFrames[name]
    else console.warn(`  ⚠ ${panelName}: "${name}" not found in atlas`)
  }
  for (const prefix of prefixes) {
    for (const [name, data] of Object.entries(allFrames)) {
      if (name.startsWith(prefix)) result[name] = data
    }
  }
  return result
}

// ── Process each panel ──────────────────────────────────────────
const PADDING = 2
const assigned = new Set()

for (const panelName of Object.keys(PANELS).filter(k => !k.endsWith('_prefixes'))) {
  const frames = getFramesForPanel(panelName)
  const entries = Object.entries(frames)
  if (entries.length === 0) { console.log(`${panelName}: no frames, skipping`); continue }

  // Track assigned textures
  for (const name of Object.keys(frames)) assigned.add(name)

  // Collect sprite regions with pixel dimensions
  const sprites = entries.map(([name, data]) => {
    const rotated = data.rotated
    const pixW = rotated ? data.frame.h : data.frame.w
    const pixH = rotated ? data.frame.w : data.frame.h
    return { name, data, pixW, pixH }
  })

  // Sort by height descending for strip packing
  sprites.sort((a, b) => b.pixH - a.pixH)

  // Simple horizontal strip packing
  let x = 0, maxH = 0
  const placements = []
  for (const s of sprites) {
    placements.push({ ...s, destX: x, destY: 0 })
    x += s.pixW + PADDING
    if (s.pixH > maxH) maxH = s.pixH
  }
  const atlasW = x - PADDING
  const atlasH = maxH

  // Extract and composite
  const composites = []
  for (const p of placements) {
    const { frame } = p.data
    const region = await sharp(SRC_IMG)
      .extract({ left: frame.x, top: frame.y, width: p.pixW, height: p.pixH })
      .toBuffer()
    composites.push({ input: region, left: p.destX, top: p.destY })
  }

  const outWebp = `${OUT_DIR}/${panelName}.webp`
  const outJson = `${OUT_DIR}/${panelName}.json`

  await sharp({
    create: { width: atlasW, height: atlasH, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } }
  })
    .composite(composites)
    .webp({ quality: 90 })
    .toFile(outWebp)

  // Build JSON
  const outFrames = {}
  for (const p of placements) {
    outFrames[p.name] = {
      frame: { x: p.destX, y: p.destY, w: p.data.frame.w, h: p.data.frame.h },
      rotated: p.data.rotated,
      trimmed: p.data.trimmed,
      spriteSourceSize: p.data.spriteSourceSize,
      sourceSize: p.data.sourceSize,
    }
  }

  writeFileSync(outJson, JSON.stringify({
    frames: outFrames,
    meta: {
      app: 'split-atlas.mjs',
      version: '1.0',
      image: `${panelName}.webp`,
      format: 'RGBA8888',
      size: { w: atlasW, h: atlasH },
      scale: '1',
    }
  }, null, 2))

  console.log(`${panelName}: ${entries.length} sprites → ${atlasW}x${atlasH}`)
}

// Check for unassigned
const unassigned = Object.keys(allFrames).filter(n => !assigned.has(n))
if (unassigned.length > 0) {
  console.log(`\n⚠ Unassigned (${unassigned.length}):`, unassigned.join(', '))
}
