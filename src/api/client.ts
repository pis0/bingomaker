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

  const body = await res.json()

  if (!res.ok) {
    const message = body?.error ?? body?.message ?? `HTTP ${res.status}`
    throw new Error(message)
  }

  return body as T
}

/** POST /rounds — create a new round with the given stake (optional seed for testing) */
export function createRound(stake: number, seed?: number): Promise<CreateRoundResponse> {
  return request<CreateRoundResponse>('/rounds', {
    method: 'POST',
    body: JSON.stringify({ stake, ...(seed != null && { seed }) }),
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
