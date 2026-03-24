export interface RoundItem {
  PK: string              // "ROUND#<roundId>"
  SK: string              // "META"
  roundId: string
  userId: string          // V2: from auth. For now: 'anonymous'
  seed: number            // SECRET — never sent to client
  stake: number
  drawCount: number       // Current number of balls drawn (starts at 30 after process)
  totalPayout: number
  status: 'active' | 'completed'
  cardNumbers: number[][] // 4x15 — cached for quick client response
  bellPositions: Array<{ row: number; col: number }>
  createdAt: string       // ISO timestamp
  updatedAt: string
  ttl: number             // DynamoDB TTL (epoch seconds, e.g. 24h from creation)

  // V2: Legacy server integration
  // legacySessionId?: string
  // legacyProps?: Record<string, unknown>
}
