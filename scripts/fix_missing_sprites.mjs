import sharp from 'sharp'
import { readFileSync, writeFileSync } from 'fs'

const COMMONS_XML_DIR = '/Users/pis0/workspace/pipa/praia/dev/static/praia/mobile/huawei/v41.04/m1x2/_base/commons'
const COMMONS_PNG_DIR = '/Users/pis0/workspace/pipa/praia/dev/client/assets/assets/sprites'
const OUT_DIR = 'public/assets/menton'

// Parse Starling XML
function parseXML(xmlPath) {
  const xml = readFileSync(xmlPath, 'utf-8')
  const atlasMatch = xml.match(/<TextureAtlas\s+imagePath="([^"]+)"\s+width="(\d+)"\s+height="(\d+)"/)
  if (!atlasMatch) return { sprites: [] }
  const subTextureRegex = /<SubTexture\s+([^/]+)\/>/g
  const attrRegex = /(\w+)="([^"]+)"/g
  const sprites = []
  let match
  while ((match = subTextureRegex.exec(xml)) !== null) {
    const attrs = {}
    let am
    while ((am = attrRegex.exec(match[1])) !== null) attrs[am[1]] = am[2]
    attrRegex.lastIndex = 0
    if (attrs.name) sprites.push({
      name: attrs.name,
      x: parseInt(attrs.x), y: parseInt(attrs.y),
      w: parseInt(attrs.width), h: parseInt(attrs.height),
      rotated: attrs.rotated === 'true',
    })
  }
  return { imageName: atlasMatch[1], sprites }
}

async function extractSprite(atlasBuffer, sp) {
  let pipeline = sharp(atlasBuffer)
    .extract({ left: sp.x, top: sp.y, width: sp.w, height: sp.h })
  if (sp.rotated) pipeline = pipeline.rotate(-90)
  const contentW = sp.rotated ? sp.h : sp.w
  const contentH = sp.rotated ? sp.w : sp.h
  return { buffer: await pipeline.png().toBuffer(), width: contentW, height: contentH }
}

// Missing sprites mapping: sprite name → target atlas
const MISSING = {
  ficha57_sk: 'menton_jackpot',
  ficha78_sk: 'menton_common',
  dindin77_sk: 'menton_ballpanel',
}

const { imageName, sprites } = parseXML(`${COMMONS_XML_DIR}/main_sakarose0_M12x.xml`)
const atlasBuf = readFileSync(`${COMMONS_PNG_DIR}/${imageName}`)

for (const [spName, targetAtlas] of Object.entries(MISSING)) {
  const sp = sprites.find(s => s.name === spName)
  if (!sp) { console.log(`NOT FOUND: ${spName}`); continue }

  const { buffer, width, height } = await extractSprite(atlasBuf, sp)

  // Load current atlas
  const jsonPath = `${OUT_DIR}/${targetAtlas}.json`
  const imgPath = `${OUT_DIR}/${targetAtlas}.webp`
  const atlas = JSON.parse(readFileSync(jsonPath, 'utf-8'))
  const curImg = readFileSync(imgPath)
  const { w: curW, h: curH } = atlas.meta.size

  // Place at bottom of atlas
  const newY = curH
  let newH = curH + height + 2
  let potH = 64; while (potH < newH) potH *= 2

  const extended = await sharp({
    create: { width: curW, height: potH, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } }
  }).composite([
    { input: curImg, left: 0, top: 0 },
    { input: buffer, left: 0, top: newY },
  ]).webp({ quality: 90 }).toFile(imgPath + '.tmp')

  // Rename tmp → webp
  const { renameSync } = await import('fs')
  renameSync(imgPath + '.tmp', imgPath)

  atlas.frames[spName] = {
    frame: { x: 0, y: newY, w: width, h: height },
    rotated: false, trimmed: false,
    spriteSourceSize: { x: 0, y: 0, w: width, h: height },
    sourceSize: { w: width, h: height },
  }
  atlas.meta.size.h = potH
  writeFileSync(jsonPath, JSON.stringify(atlas))

  console.log(`Added ${spName} → ${targetAtlas} at (0, ${newY}) ${width}x${height}, POT h=${potH}`)
}

// Also check Sino in bellpanel — should already be extracted from bonus0_M12x
const bellJson = JSON.parse(readFileSync(`${OUT_DIR}/menton_bellpanel.json`, 'utf-8'))
if (!bellJson.frames['Sino']) {
  // Extract from bonus0_M12x
  const bonus = parseXML('/Users/pis0/workspace/pipa/praia/dev/client/menton/view/assets/sprites/menton_bonus0_M12x.xml')
  const bonusBuf = readFileSync('/Users/pis0/workspace/pipa/praia/dev/client/menton/view/assets/sprites/' + bonus.imageName)
  const sinoSp = bonus.sprites.find(s => s.name === 'Sino')
  if (sinoSp) {
    const { buffer, width, height } = await extractSprite(bonusBuf, sinoSp)
    const imgPath = `${OUT_DIR}/menton_bellpanel.webp`
    const curImg = readFileSync(imgPath)
    const { w: curW, h: curH } = bellJson.meta.size
    const newY = curH
    let potH = 64; while (potH < curH + height + 2) potH *= 2
    
    await sharp({
      create: { width: curW, height: potH, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } }
    }).composite([
      { input: curImg, left: 0, top: 0 },
      { input: buffer, left: 0, top: newY },
    ]).webp({ quality: 90 }).toFile(imgPath + '.tmp')
    
    const { renameSync } = await import('fs')
    renameSync(imgPath + '.tmp', imgPath)
    
    bellJson.frames['Sino'] = {
      frame: { x: 0, y: newY, w: width, h: height },
      rotated: false, trimmed: false,
      spriteSourceSize: { x: 0, y: 0, w: width, h: height },
      sourceSize: { w: width, h: height },
    }
    bellJson.meta.size.h = potH
    writeFileSync(`${OUT_DIR}/menton_bellpanel.json`, JSON.stringify(bellJson))
    console.log(`Added Sino → menton_bellpanel at (0, ${newY}) ${width}x${height}, POT h=${potH}`)
  }
}

console.log('Done fixing missing sprites!')
