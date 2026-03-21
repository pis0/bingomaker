/**
 * Parser for AssukarMovieBytes binary format.
 *
 * Format created by pis0 for Pipa Studios — serialized 2D transformation
 * matrices + alpha for each display object per frame, exported from SWF.
 *
 * Binary layout (big-endian, DEFLATE-compressed):
 *
 *   HEADER
 *   ├─ numTextures: int32
 *   ├─ [for each texture]
 *   │   ├─ name: UTF (2-byte length + UTF-8 chars)
 *   │   └─ instanceCount: uint32
 *   ├─ headerDataLen: uint32
 *   ├─ totalFrames: int32
 *   └─ [for each frame]
 *       ├─ startOffset: uint32  (relative to headerLen)
 *       ├─ endOffset: uint32    (relative to headerLen)
 *       └─ objectCount: uint32  (unused by decoder, kept for compat)
 *
 *   FRAME DATA (starts at headerLen = headerDataLen + 8)
 *   └─ [for each object in frame]
 *       ├─ objectName: UTF string
 *       ├─ alpha: float64
 *       ├─ a: float64      ─┐
 *       ├─ b: float64       │ 2D affine matrix
 *       ├─ c: float64       │ (always present, even if alpha <= 0)
 *       ├─ d: float64       │
 *       ├─ tx: float64      │
 *       ├─ ty: float64     ─┘
 *       └─ index: uint32    z-order (read but unused)
 */

// ── Public types ────────────────────────────────────────────────────

export interface TextureEntry {
  name: string
  instanceCount: number
}

export interface FrameObject {
  /** Texture name (or "ankor_<fontname>" for text fields) */
  textureName: string
  /** Which instance of this texture (0-based, cycling in reverse) */
  instanceIndex: number
  /** Whether this is a text field (name starts with "ankor_") */
  isTextField: boolean
  alpha: number
  /** 2D affine matrix components */
  a: number
  b: number
  c: number
  d: number
  tx: number
  ty: number
  /** z-order hint (stored in binary, rarely used) */
  zIndex: number
}

export interface MovieBytesData {
  textures: TextureEntry[]
  totalFrames: number
  /** Frames are 1-indexed: frames[1] is the first frame, frames[0] is undefined */
  frames: (FrameObject[] | undefined)[]
}

// ── Binary reader helpers (big-endian DataView) ─────────────────────

class ByteReader {
  private view: DataView
  private bytes: Uint8Array
  pos = 0

  constructor(buffer: ArrayBuffer) {
    this.view = new DataView(buffer)
    this.bytes = new Uint8Array(buffer)
  }

  get length() { return this.view.byteLength }

  readInt32(): number {
    const v = this.view.getInt32(this.pos, false) // big-endian
    this.pos += 4
    return v
  }

  readUint32(): number {
    const v = this.view.getUint32(this.pos, false)
    this.pos += 4
    return v
  }

  readFloat64(): number {
    const v = this.view.getFloat64(this.pos, false)
    this.pos += 8
    return v
  }

  /** Flash-style readUTF: 2-byte big-endian length prefix + UTF-8 bytes */
  readUTF(): string {
    const len = this.view.getUint16(this.pos, false)
    this.pos += 2
    const slice = this.bytes.subarray(this.pos, this.pos + len)
    this.pos += len
    return decoder.decode(slice)
  }

  skip(n: number): void {
    this.pos += n
  }
}

const decoder = new TextDecoder('utf-8')

// ── Decompression ───────────────────────────────────────────────────

/**
 * Try DEFLATE (raw) decompression. Falls back to uncompressed if it fails.
 *
 * NOTE: .bytes files are now shipped pre-decompressed (inflated at build time).
 * This function is kept as a safety net for any legacy compressed files.
 * DecompressionStream requires Safari 16.4+ (iOS 16.4+), so pre-decompression
 * ensures iPhone 7 (max iOS 15) and other older devices work correctly.
 */
async function inflateBytes(buffer: ArrayBuffer): Promise<ArrayBuffer> {
  // Quick check: if data looks like valid uncompressed MovieBytes header
  // (first int32 = numTextures, should be small positive number), skip decompression.
  if (buffer.byteLength >= 4) {
    const firstInt = new DataView(buffer).getInt32(0, false)
    if (firstInt > 0 && firstInt < 500) return buffer
  }

  // Flash ByteArray.inflate() uses raw DEFLATE (RFC 1951)
  if (typeof DecompressionStream === 'undefined') {
    console.warn('[parseMovieBytes] DecompressionStream not available — data must be pre-decompressed')
    return buffer
  }

  try {
    const ds = new DecompressionStream('deflate-raw')
    const writer = ds.writable.getWriter()
    writer.write(new Uint8Array(buffer))
    writer.close()

    const chunks: Uint8Array[] = []
    const reader = ds.readable.getReader()
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      chunks.push(value)
    }

    const totalLen = chunks.reduce((s, c) => s + c.length, 0)
    const result = new Uint8Array(totalLen)
    let offset = 0
    for (const chunk of chunks) {
      result.set(chunk, offset)
      offset += chunk.length
    }
    return result.buffer
  } catch {
    // Not compressed — return as-is
    return buffer
  }
}

// ── Main parser ─────────────────────────────────────────────────────

export async function parseMovieBytes(buffer: ArrayBuffer): Promise<MovieBytesData> {
  const inflated = await inflateBytes(buffer)
  const r = new ByteReader(inflated)

  // ── Texture header ──
  const numTextures = r.readInt32()
  const textures: TextureEntry[] = []
  for (let i = 0; i < numTextures; i++) {
    const name = r.readUTF()
    const instanceCount = r.readUint32()
    textures.push({ name, instanceCount })
  }

  // ── Frame index ──
  const headerDataLen = r.readUint32()
  const headerLen = headerDataLen + 8 // AS3: readUnsignedInt() + 8
  const totalFrames = r.readInt32()

  const frameRanges: { start: number; end: number }[] = []
  for (let i = 0; i < totalFrames; i++) {
    const start = r.readUint32() + headerLen
    const end = r.readUint32() + headerLen
    r.readUint32() // objectCount — unused by decoder
    frameRanges.push({ start, end })
  }

  // ── Build texture name→index lookup (mirrors AS3 txtNameHash) ──
  const nameToTexIdx = new Map<string, number>()
  for (let i = 0; i < textures.length; i++) {
    nameToTexIdx.set(textures[i].name, i)
  }

  // ── Parse frames (1-indexed like AS3) ──
  const frames: (FrameObject[] | undefined)[] = [undefined] // index 0 = empty

  for (let f = 0; f < totalFrames; f++) {
    const { start, end } = frameRanges[f]
    r.pos = start

    const objects: FrameObject[] = []
    // Per-frame texture instance cycling (mirrors AS3 imgDictio)
    const instanceCursor = new Map<number, number>()

    while (r.pos < end) {
      const objName = r.readUTF()
      const texIdx = nameToTexIdx.get(objName)
      if (texIdx === undefined) {
        throw new Error(`Unknown texture "${objName}" in frame ${f + 1}`)
      }

      // Instance cycling: start from last, decrement each time
      const maxIdx = textures[texIdx].instanceCount - 1
      const prev = instanceCursor.get(texIdx)
      const instanceIndex = prev === undefined ? maxIdx : prev - 1
      instanceCursor.set(texIdx, instanceIndex)

      const alpha = r.readFloat64()
      const isTextField = objName.startsWith('ankor_')

      // Matrix data is always 52 bytes (6 doubles + 1 uint32)
      // AS3 decoder skips them when alpha <= 0, but they're in the binary
      const a = r.readFloat64()
      const b = r.readFloat64()
      const c = r.readFloat64()
      const d = r.readFloat64()
      const tx = r.readFloat64()
      const ty = r.readFloat64()
      const zIndex = r.readUint32()

      objects.push({
        textureName: objName,
        instanceIndex,
        isTextField,
        alpha,
        a, b, c, d, tx, ty,
        zIndex,
      })
    }

    frames.push(objects)
  }

  return { textures, totalFrames, frames }
}
