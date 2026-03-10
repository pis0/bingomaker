/**
 * Quick test: parse the bingo.bytes file and print its structure.
 * Run: node scripts/test-moviebytes.mjs
 */
import { readFileSync } from 'fs'

const file = readFileSync('public/assets/menton/movies/bingo.bytes')
const buffer = file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength)

// Try raw DEFLATE decompression
import { inflateRaw } from 'zlib'
import { promisify } from 'util'
const inflateRawAsync = promisify(inflateRaw)

async function inflate(buf) {
  try {
    return await inflateRawAsync(Buffer.from(buf))
  } catch {
    console.log('Not compressed or different format, trying zlib...')
    const { unzip } = await import('zlib')
    const unzipAsync = promisify(unzip)
    try {
      return await unzipAsync(Buffer.from(buf))
    } catch {
      console.log('Not compressed at all, using raw bytes')
      return Buffer.from(buf)
    }
  }
}

class ByteReader {
  constructor(buffer) {
    this.view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength)
    this.bytes = new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength)
    this.pos = 0
    this.length = buffer.byteLength
  }
  readInt32() { const v = this.view.getInt32(this.pos, false); this.pos += 4; return v }
  readUint32() { const v = this.view.getUint32(this.pos, false); this.pos += 4; return v }
  readFloat64() { const v = this.view.getFloat64(this.pos, false); this.pos += 8; return v }
  readUTF() {
    const len = this.view.getUint16(this.pos, false)
    this.pos += 2
    const slice = this.bytes.subarray(this.pos, this.pos + len)
    this.pos += len
    return new TextDecoder().decode(slice)
  }
  skip(n) { this.pos += n }
}

const inflated = await inflate(buffer)
console.log(`Inflated size: ${inflated.byteLength} bytes (from ${buffer.byteLength})`)

const r = new ByteReader(inflated)

// Header
const numTextures = r.readInt32()
console.log(`\nTextures: ${numTextures}`)

const textures = []
for (let i = 0; i < numTextures; i++) {
  const name = r.readUTF()
  const count = r.readUint32()
  textures.push({ name, count })
  console.log(`  [${i}] "${name}" × ${count} instances`)
}

const headerDataLen = r.readUint32()
const headerLen = headerDataLen + 8
const totalFrames = r.readInt32()
console.log(`\nHeader length: ${headerLen}`)
console.log(`Total frames: ${totalFrames}`)

// Frame index
const frames = []
for (let i = 0; i < totalFrames; i++) {
  const start = r.readUint32() + headerLen
  const end = r.readUint32() + headerLen
  const objCount = r.readUint32()
  frames.push({ start, end, objCount })
}

// Print first 3 frames in detail
for (let f = 0; f < Math.min(3, totalFrames); f++) {
  const { start, end, objCount } = frames[f]
  console.log(`\n--- Frame ${f + 1} (objCount=${objCount}, bytes ${start}-${end}) ---`)
  r.pos = start
  let objIdx = 0
  while (r.pos < end) {
    const name = r.readUTF()
    const alpha = r.readFloat64()
    const a = r.readFloat64()
    const b = r.readFloat64()
    const c = r.readFloat64()
    const d = r.readFloat64()
    const tx = r.readFloat64()
    const ty = r.readFloat64()
    const index = r.readUint32()
    if (alpha > 0) {
      console.log(`  [${objIdx}] "${name}" alpha=${alpha.toFixed(3)} matrix=[${a.toFixed(3)},${b.toFixed(3)},${c.toFixed(3)},${d.toFixed(3)}] tx=${tx.toFixed(1)} ty=${ty.toFixed(1)} z=${index}`)
    } else {
      console.log(`  [${objIdx}] "${name}" alpha=${alpha.toFixed(3)} (hidden)`)
    }
    objIdx++
  }
}

// Print last frame too
if (totalFrames > 3) {
  const f = totalFrames - 1
  const { start, end, objCount } = frames[f]
  console.log(`\n--- Frame ${f + 1} (last, objCount=${objCount}) ---`)
  r.pos = start
  let objIdx = 0
  while (r.pos < end) {
    const name = r.readUTF()
    const alpha = r.readFloat64()
    const a = r.readFloat64()
    const b = r.readFloat64()
    const c = r.readFloat64()
    const d = r.readFloat64()
    const tx = r.readFloat64()
    const ty = r.readFloat64()
    const index = r.readUint32()
    if (alpha > 0) {
      console.log(`  [${objIdx}] "${name}" alpha=${alpha.toFixed(3)} matrix=[${a.toFixed(3)},${b.toFixed(3)},${c.toFixed(3)},${d.toFixed(3)}] tx=${tx.toFixed(1)} ty=${ty.toFixed(1)} z=${index}`)
    } else {
      console.log(`  [${objIdx}] "${name}" alpha=${alpha.toFixed(3)} (hidden)`)
    }
    objIdx++
  }
}

console.log('\n✓ Parse successful')
