import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb'
import type { RoundItem } from '../types/db'

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' })
const docClient = DynamoDBDocumentClient.from(client)
const TABLE_NAME = process.env.TABLE_NAME || 'bingomaker-rounds'

export async function getRoundItem(roundId: string): Promise<RoundItem | null> {
  const result = await docClient.send(new GetCommand({
    TableName: TABLE_NAME,
    Key: { PK: `ROUND#${roundId}`, SK: 'META' },
  }))
  return (result.Item as RoundItem) ?? null
}

export async function putRoundItem(item: RoundItem): Promise<void> {
  await docClient.send(new PutCommand({
    TableName: TABLE_NAME,
    Item: item,
  }))
}

export async function incrementDrawCount(
  roundId: string,
  expectedDrawCount: number,
  newTotalPayout: number,
): Promise<void> {
  await docClient.send(new UpdateCommand({
    TableName: TABLE_NAME,
    Key: { PK: `ROUND#${roundId}`, SK: 'META' },
    UpdateExpression: 'SET drawCount = :new, totalPayout = :payout, updatedAt = :now',
    ConditionExpression: 'drawCount = :expected AND #s = :active',
    ExpressionAttributeNames: { '#s': 'status' },
    ExpressionAttributeValues: {
      ':new': expectedDrawCount + 1,
      ':expected': expectedDrawCount,
      ':payout': newTotalPayout,
      ':active': 'active',
      ':now': new Date().toISOString(),
    },
  }))
}

export async function completeRound(roundId: string, finalPayout: number): Promise<void> {
  await docClient.send(new UpdateCommand({
    TableName: TABLE_NAME,
    Key: { PK: `ROUND#${roundId}`, SK: 'META' },
    UpdateExpression: 'SET #s = :completed, totalPayout = :payout, updatedAt = :now',
    ConditionExpression: '#s = :active',
    ExpressionAttributeNames: { '#s': 'status' },
    ExpressionAttributeValues: {
      ':completed': 'completed',
      ':active': 'active',
      ':payout': finalPayout,
      ':now': new Date().toISOString(),
    },
  }))
}
