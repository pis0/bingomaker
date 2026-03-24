/**
 * Local dev server — plain Node.js HTTP, zero deps.
 * Runs the same Lambda handlers with in-memory store (no DynamoDB needed).
 *
 * Usage: LOCAL_MODE=1 npx tsx src/local.ts
 */
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import { handler as createRoundHandler } from './handlers/createRound'
import { handler as drawHandler } from './handlers/draw'
import { handler as getRoundHandler } from './handlers/getRound'
import { handler as endRoundHandler } from './handlers/endRound'
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda'

const PORT = 3001

// ── HTTP helpers ──────────────────────────────────────────────

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = ''
    req.on('data', chunk => data += chunk)
    req.on('end', () => resolve(data))
    req.on('error', reject)
  })
}

function toApiEvent(req: IncomingMessage, body: string, pathParams?: Record<string, string>): APIGatewayProxyEventV2 {
  return {
    version: '2.0',
    routeKey: `${req.method} ${req.url}`,
    rawPath: req.url ?? '/',
    rawQueryString: '',
    headers: req.headers as Record<string, string>,
    requestContext: {} as APIGatewayProxyEventV2['requestContext'],
    body,
    isBase64Encoded: false,
    pathParameters: pathParams,
  }
}

function sendResult(res: ServerResponse, result: APIGatewayProxyResultV2) {
  const r = result as { statusCode: number; headers?: Record<string, string>; body?: string }
  res.writeHead(r.statusCode ?? 200, {
    ...r.headers,
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  })
  res.end(r.body ?? '')
}

// ── Routes ────────────────────────────────────────────────────

type Handler = (event: APIGatewayProxyEventV2) => Promise<APIGatewayProxyResultV2>

const routes: Array<{ method: string; pattern: RegExp; handler: Handler; params: string[] }> = [
  { method: 'POST', pattern: /^\/v1\/rounds$/, handler: createRoundHandler as Handler, params: [] },
  { method: 'POST', pattern: /^\/v1\/rounds\/([^/]+)\/draw$/, handler: drawHandler as Handler, params: ['roundId'] },
  { method: 'GET', pattern: /^\/v1\/rounds\/([^/]+)$/, handler: getRoundHandler as Handler, params: ['roundId'] },
  { method: 'POST', pattern: /^\/v1\/rounds\/([^/]+)\/end$/, handler: endRoundHandler as Handler, params: ['roundId'] },
]

// ── Server ────────────────────────────────────────────────────

const server = createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    })
    res.end()
    return
  }

  const url = req.url?.split('?')[0] ?? '/'
  const body = await readBody(req)

  for (const route of routes) {
    if (req.method !== route.method) continue
    const match = url.match(route.pattern)
    if (!match) continue

    const pathParams: Record<string, string> = {}
    route.params.forEach((name, i) => { pathParams[name] = match[i + 1] })

    try {
      const event = toApiEvent(req, body, pathParams)
      const result = await route.handler(event)
      const status = (result as { statusCode: number }).statusCode
      console.log(`  ${req.method} ${url} → ${status}`)
      sendResult(res, result)
    } catch (err) {
      console.error('  Handler error:', err)
      sendResult(res, { statusCode: 500, body: JSON.stringify({ error: 'Internal server error' }) })
    }
    return
  }

  sendResult(res, { statusCode: 404, body: JSON.stringify({ error: 'Not found' }) })
})

server.listen(PORT, () => {
  console.log(`\n  🎱 BingoMaker API (local) → http://localhost:${PORT}/v1\n`)
  console.log(`  POST /v1/rounds            create round`)
  console.log(`  POST /v1/rounds/:id/draw   draw extra ball`)
  console.log(`  POST /v1/rounds/:id/end    end round`)
  console.log(`  GET  /v1/rounds/:id        get round state`)
  console.log(`\n  DynamoDB: ${process.env.TABLE_NAME || 'bingomaker-rounds'} (${process.env.AWS_PROFILE || 'default'})\n`)
})
