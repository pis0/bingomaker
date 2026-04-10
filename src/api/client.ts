/**
 * API client for BingoMaker serverless backend.
 *
 * Simple fetch wrapper — each function calls the API, checks for errors,
 * and returns typed JSON responses.
 */
import type {
  CreateRoundResponse,
  DrawResponse,
  EndRoundResponse,
  GetRoundResponse,
} from '../../server/src/types/api'

// Auto-detect: localhost → local SAM server, prod → AWS API Gateway
const isLocal = typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')

const API_BASE = import.meta.env.VITE_API_URL
  || (isLocal ? 'http://localhost:3001/v1' : 'https://s674gq6ckl.execute-api.us-east-1.amazonaws.com/v1')

if (isLocal) {
  const env = import.meta.env.VITE_API_URL ? 'PROD (via VITE_API_URL)' : 'LOCAL (localhost:3001)'
  console.log(`[API] ${env} → ${API_BASE}`)
}

/** Shared fetch helper — throws with server error message on failure */
async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${path}`
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })

  const text = await res.text()

  // Error path: tolerate non-JSON bodies (HTML error pages from API Gateway,
  // empty bodies on 5xx, etc) so we always surface a meaningful error message.
  if (!res.ok) {
    let errBody: unknown = null
    if (text) {
      try { errBody = JSON.parse(text) } catch { errBody = text }
    }
    const message = (typeof errBody === 'object' && errBody !== null
      && ((errBody as { error?: string; message?: string }).error
        ?? (errBody as { error?: string; message?: string }).message))
      || (typeof errBody === 'string' && errBody)
      || `HTTP ${res.status}`
    throw new Error(message)
  }

  // Success path: require valid JSON. A 2xx with non-JSON body means the server
  // is broken (or a proxy/gateway is intercepting) — fail loudly instead of
  // returning an invalid cast that would corrupt downstream state.
  if (!text) throw new Error(`Empty response body (HTTP ${res.status})`)
  try {
    return JSON.parse(text) as T
  } catch {
    throw new Error(`Invalid JSON in response (HTTP ${res.status})`)
  }
}

/** POST /rounds — create a new round with the given stake.
 *  cardNumbers: reuse existing cards (new round / bet change). Omit for shuffle.
 *  seed: force deterministic seed (dev/test only). */
export function createRound(stake: number, opts?: { seed?: number; cardNumbers?: number[][] }): Promise<CreateRoundResponse> {
  return request<CreateRoundResponse>('/rounds', {
    method: 'POST',
    body: JSON.stringify({
      stake,
      ...(opts?.seed != null && { seed: opts.seed }),
      ...(opts?.cardNumbers && { cardNumbers: opts.cardNumbers }),
    }),
  })
}

/** POST /rounds/:roundId/draw — draw the next ball */
export function drawBall(roundId: string): Promise<DrawResponse> {
  return request<DrawResponse>(`/rounds/${roundId}/draw`, {
    method: 'POST',
  })
}

/** POST /rounds/:roundId/end — end the round */
export function endRound(roundId: string): Promise<EndRoundResponse> {
  return request<EndRoundResponse>(`/rounds/${roundId}/end`, {
    method: 'POST',
  })
}

/** GET /rounds/:roundId — get current round state */
export function getRound(roundId: string): Promise<GetRoundResponse> {
  return request<GetRoundResponse>(`/rounds/${roundId}`)
}
