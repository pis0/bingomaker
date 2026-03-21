#!/usr/bin/env node
/**
 * Generates @2x panel atlases from legacy M12x (2x) Starling spritesheets.
 *
 * Pipeline:
 * 1. Extract individual sprites from M12x source atlases (menton0_M12x, menton1_M12x, bonus*)
 * 2. Scale sprites by 2/3 to get @2x (M12x is 2x of M1, our logical coords are M1-based)
 *    Actually M12x IS @2x already relative to M1. No scaling needed.
 * 3. Pack into panel atlases using shelf packing (max 4096 width for @2x)
 * 4. Output as WebP + JSON, then convert to BASIS
 *
 * Usage: node scripts/generate-2x-atlases.mjs
 */
import sharp from 'sharp'
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'fs'
import { join, dirname } from 'path'
import { execSync } from 'child_process'

const LEGACY_DIR = '/Users/pis0/workspace/pipa/praia/dev/client/menton/view/assets/sprites'
const OUT_DIR = 'public/assets/menton'
const TMP_DIR = '/tmp/bingomaker-2x-sprites'
const MAX_W = 4096  // @2x allows up to 4096 (GPU limit)
const PADDING = 2

// ── Source atlases (M12x = @2x) ─────────────────────────────────
const SOURCES = [
  { xml: 'menton0_M12x.xml', png: 'menton0_M12x.png' },
  { xml: 'menton1_M12x.xml', png: 'menton1_M12x.png' },
]

// Bonus atlases for bellpanel, bingo, fruit, juice sprites
const BONUS_SOURCES = [
  { xml: 'menton_bonus0_M12x.xml', png: 'menton_bonus0_M12x.png' },
  { xml: 'menton_bonus1_M12x.xml', png: 'menton_bonus1_M12x.png' },
  { xml: 'menton_bonus2_M12x.xml', png: 'menton_bonus2_M12x.png' },
]

// ── Panel → frame mapping (same as split-atlas.mjs) ─────────────
const PANELS = {
  menton_ballpanel: {
    exact: [
      'ball', 'extraball', 'bigball', 'bigballv2',
      'ballcontainer1', 'ballcontainer2', 'ballpipe',
      'liquido_tanque_loop', 'liquido_fim', 'liquido_meio', 'liquido_inicio',
      'fundopipoqueira', 'tampapipoqueira', 'bigballpipe2',
      'bgextraball', 'bgextraball_full',
      'extragratis', 'dindin77_sk',
      'pipoqueirasuco', 'pipoqueiralimao', 'balljuice',
      'textura_painelbolaextra',
    ],
    prefixes: ['splash', 'gotas_final', 'pipo_juice', 'juice_'],
  },
  menton_cardpanel: {
    exact: [
      'card',
      'cardbell1', 'cardbell2', 'cardbell3', 'cardbell4',
      'cardbet1', 'cardbet2', 'cardbet3', 'cardbet4',
      'cardbet5', 'cardbet6', 'cardbet7', 'cardbet8',
      'missing_holofote', 'missing_3colunas', 'missing_linhadupla',
      'missing_4colunas', 'missing_caixadupla', 'missing_bingo',
      'moldura_3colunas', 'moldura_4colunas', 'moldura_caixadupla',
      'moldura_linhadupla', 'moldura_bingo',
    ],
    prefixes: ['marking'],
  },
  menton_pattern: {
    exact: [],
    prefixes: ['liqu_horizontal', 'liqu_col'],
  },
  menton_payoutpanel: {
    exact: [
      'payout', 'payout_on', 'payout_glow',
      'prize1', 'prize2', 'prize3', 'prize4', 'prize5', 'prize6', 'prize7',
      'prizedot1', 'prize_won',
    ],
    prefixes: [],
  },
  menton_bellpanel: {
    exact: [
      'bell1', 'bell2', 'bell3',
      'bell1_on', 'bell2_on', 'bell3_on',
      'bomb1', 'bomb2', 'bomb3',
      'lemon1', 'lemon2', 'lemon3',
      'multiply1', 'multiply2', 'multiply3',
      'slotmask1', 'slotmask2', 'slotmask3',
      'multiply_anim',
    ],
    prefixes: ['sino_brilho'],
  },
  menton_jackpot: {
    exact: ['prizejack', 'prizejack_on', 'ficha57_sk', 'jackbar1', 'jackbar2'],
    prefixes: [],
  },
  menton_button: {
    exact: [
      'btplay_idle', 'btplay_hit', 'btplay_off',
      'btextra_idle', 'btextra_hit', 'btextra_off',
      'btend_idle', 'btend_hit', 'btend_off',
      'btbet_idle', 'btbet_hit', 'btbet_off',
    ],
    prefixes: [],
  },
  menton_common: {
    exact: ['ficha78_sk', 'ficha', 'smallball'],
    prefixes: [],
  },
}

// Movie atlases need special scaling (Flash authoring → game coords)
const MOVIE_PANELS = {
  menton_bingo: { prefixes: ['bng_ment_', 'drops_', 'liquido_vertical', 'cano_big4'], exact: ['B1', 'B2', 'I1', 'I2', 'N1', 'N2', 'G1', 'G2', 'O1', 'O2', 'cardbet1', 'moldura_bingo'], scale: 0.5 },
  menton_fruit: { prefixes: ['abacaxi', 'morango', 'uva', 'maca', 'gota_'], exact: ['marcador_abacaxi', 'marcador_morango', 'marcador_uva', 'marcador_maca'], scale: 0.41667 },
}

// ── Parse Starling XML ──────────────────────────────────────────
function parseXML(xmlPath) {
  const xml = readFileSync(xmlPath, 'utf-8')
  const atlasMatch = xml.match(/<TextureAtlas\s+imagePath="([^"]+)"\s+width="(\d+)"\s+height="(\d+)"/)
  if (!atlasMatch) return { imagePath: '', sprites: [] }  // empty atlas

  const subTextureRegex = /<SubTexture\s+([^/]+)\/>/g
  const attrRegex = /(\w+)="([^"]+)"/g
  const sprites = []
  let match
  while ((match = subTextureRegex.exec(xml)) !== null) {
    const attrs = {}
    let am
    while ((am = attrRegex.exec(match[1])) !== null) attrs[am[1]] = am[2]
    attrRegex.lastIndex = 0
    if (!attrs.name) continue
    sprites.push({
      name: attrs.name,
      x: parseInt(attrs.x), y: parseInt(attrs.y),
      w: parseInt(attrs.width), h: parseInt(attrs.height),
      rotated: attrs.rotated === 'true',
      frameX: attrs.frameX ? parseInt(attrs.frameX) : 0,
      frameY: attrs.frameY ? parseInt(attrs.frameY) : 0,
      frameW: attrs.frameWidth ? parseInt(attrs.frameWidth) : null,
      frameH: attrs.frameHeight ? parseInt(attrs.frameHeight) : null,
    })
  }
  return { imagePath: join(dirname(xmlPath), atlasMatch[1]), sprites }
}

// ── Extract a single sprite from atlas ──────────────────────────
async function extractSprite(atlasBuffer, sp) {
  const contentW = sp.rotated ? sp.h : sp.w
  const contentH = sp.rotated ? sp.w : sp.h
  const srcW = sp.frameW ?? contentW
  const srcH = sp.frameH ?? contentH
  const trimmed = sp.frameX !== 0 || sp.frameY !== 0 || srcW !== contentW || srcH !== contentH

  let pipeline = sharp(atlasBuffer)
    .extract({ left: sp.x, top: sp.y, width: sp.w, height: sp.h })
  if (sp.rotated) pipeline = pipeline.rotate(-90)
  if (trimmed) {
    const buf = await pipeline.png().toBuffer()
    pipeline = sharp({
      create: { width: srcW, height: srcH, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } }
    }).composite([{ input: buf, left: -sp.frameX, top: -sp.frameY }])
  }
  return { buffer: await pipeline.png().toBuffer(), width: srcW, height: srcH }
}

function nextPOT(n) {
  let p = 64
  while (p < n) p *= 2
  return p
}

function matchesPanel(spriteName, panel) {
  if (panel.exact.includes(spriteName)) return true
  return panel.prefixes.some(p => spriteName.startsWith(p))
}

// ── Main ────────────────────────────────────────────────────────
async function main() {
  mkdirSync(TMP_DIR, { recursive: true })

  // Step 1: Load all sprites from M12x sources
  console.log('=== Extracting sprites from M12x sources ===')
  const allSprites = new Map()  // name → { buffer, width, height }

  for (const src of [...SOURCES, ...BONUS_SOURCES]) {
    const xmlPath = join(LEGACY_DIR, src.xml)
    if (!existsSync(xmlPath)) {
      console.log(`  SKIP ${src.xml} (not found)`)
      continue
    }
    const { imagePath, sprites } = parseXML(xmlPath)
    console.log(`  ${src.xml}: ${sprites.length} sprites`)
    if (sprites.length === 0) continue
    const atlasBuffer = readFileSync(imagePath)

    for (const sp of sprites) {
      if (allSprites.has(sp.name)) continue  // first source wins
      try {
        const extracted = await extractSprite(atlasBuffer, sp)
        allSprites.set(sp.name, extracted)
      } catch (e) {
        console.error(`    ERROR: ${sp.name}: ${e.message}`)
      }
    }
  }
  console.log(`  Total unique sprites: ${allSprites.size}`)

  // Step 2: Pack into panel atlases
  console.log('\n=== Packing @2x panel atlases ===')

  for (const [panelName, panel] of Object.entries(PANELS)) {
    await packPanel(panelName, panel, allSprites, 1)  // no extra scale for panels
  }

  // Step 3: Pack movie atlases (with rescale)
  console.log('\n=== Packing @2x movie atlases ===')
  for (const [panelName, config] of Object.entries(MOVIE_PANELS)) {
    await packPanel(panelName, config, allSprites, config.scale)
  }

  // Step 4: Convert all to BASIS
  console.log('\n=== Converting to BASIS ===')
  const allPanels = [...Object.keys(PANELS), ...Object.keys(MOVIE_PANELS)]
  for (const name of allPanels) {
    const webpPath = `${OUT_DIR}/${name}.webp`
    if (!existsSync(webpPath)) continue
    // WebP → temp PNG → BASIS
    const tmpPng = `/tmp/${name}_2x.png`
    execSync(`sips -s format png "${webpPath}" --out "${tmpPng}" 2>/dev/null`)
    execSync(`basisu "${tmpPng}" -uastc -output_file "${OUT_DIR}/${name}.basis" 2>/dev/null`)
    execSync(`rm -f "${tmpPng}"`)
    const basisSize = readFileSync(`${OUT_DIR}/${name}.basis`).length
    console.log(`  ${name}.basis: ${(basisSize / 1024).toFixed(0)}KB`)
  }

  // Also convert bgmenton
  console.log('\n=== Converting bgmenton to @2x ===')
  // Check for M12x bg
  const bg2x = join(LEGACY_DIR, '..', '..', '..', '..', '..') // bg might be elsewhere
  // bgmenton stays @1x for now (no M12x source found in sprites dir)
  // Just re-encode existing to basis
  const bgBasis = `${OUT_DIR}/bgmenton.basis`
  if (existsSync(`${OUT_DIR}/bgmenton.webp`)) {
    const tmpPng = '/tmp/bgmenton.png'
    execSync(`sips -s format png "${OUT_DIR}/bgmenton.webp" --out "${tmpPng}" 2>/dev/null`)
    execSync(`basisu "${tmpPng}" -uastc -output_file "${bgBasis}" 2>/dev/null`)
    execSync(`rm -f "${tmpPng}"`)
    console.log(`  bgmenton.basis: ${(readFileSync(bgBasis).length / 1024).toFixed(0)}KB`)
  }

  console.log('\nDone! All @2x atlases generated.')
}

async function packPanel(panelName, panel, allSprites, extraScale) {
  // Collect matching sprites
  const matched = []
  for (const [name, data] of allSprites) {
    if (matchesPanel(name, panel)) {
      matched.push({ name, ...data })
    }
  }

  if (matched.length === 0) {
    console.log(`  ${panelName}: 0 sprites (SKIP)`)
    return
  }

  // Apply extra scale (movie atlases) and prepare dimensions
  const sprites = matched.map(s => {
    const pixW = extraScale !== 1 ? Math.round(s.width * extraScale) : s.width
    const pixH = extraScale !== 1 ? Math.round(s.height * extraScale) : s.height
    return { ...s, pixW, pixH }
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

  // Composite
  const composites = []
  for (const p of placements) {
    let buf = p.buffer
    if (extraScale !== 1) {
      buf = await sharp(buf).resize(p.pixW, p.pixH).png().toBuffer()
    }
    composites.push({ input: buf, left: p.destX, top: p.destY })
  }

  // Write WebP
  const webpPath = `${OUT_DIR}/${panelName}.webp`
  await sharp({
    create: { width: potW, height: potH, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } }
  }).composite(composites).webp({ quality: 90 }).toFile(webpPath)

  // Write JSON
  const frames = {}
  for (const p of placements) {
    frames[p.name] = {
      frame: { x: p.destX, y: p.destY, w: p.pixW, h: p.pixH },
      rotated: false,
      trimmed: false,
      spriteSourceSize: { x: 0, y: 0, w: p.pixW, h: p.pixH },
      sourceSize: { w: p.pixW, h: p.pixH },
    }
  }

  const jsonPath = `${OUT_DIR}/${panelName}.json`
  const atlas = {
    frames,
    meta: {
      image: `${panelName}.basis`,
      format: 'RGBA8888',
      size: { w: potW, h: potH },
      scale: '1',
    },
  }
  writeFileSync(jsonPath, JSON.stringify(atlas))

  const scaleLabel = extraScale !== 1 ? ` (scale ${extraScale})` : ''
  console.log(`  ${panelName}: ${sprites.length} sprites → ${contentW}x${contentH} → POT ${potW}x${potH}${scaleLabel}`)
}

main().catch(e => { console.error(e); process.exit(1) })
