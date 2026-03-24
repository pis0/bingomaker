import { build } from 'esbuild'
import { readdirSync } from 'fs'
import { join } from 'path'

const handlersDir = join(import.meta.dirname, 'src', 'handlers')
const handlers = readdirSync(handlersDir).filter(f => f.endsWith('.ts'))

const entryPoints = handlers.map(f => join(handlersDir, f))

await build({
  entryPoints,
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'cjs',
  outdir: 'dist/handlers',
  sourcemap: true,
  minify: false,
  external: ['@aws-sdk/*'],
})

console.log(`Built ${handlers.length} handlers`)
