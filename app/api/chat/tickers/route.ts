import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUser } from '@/lib/auth'

interface TickerMention {
  symbol: string
  mentions: number
  sentiment: 'bullish' | 'bearish' | 'neutral'
}

// Extract tickers from message content ($SYMBOL format)
// Case-insensitive to support both $TSLA and $tsla
function extractTickers(content: string): string[] {
  const tickerRegex = /\$([A-Za-z]{1,5})\b/gi
  const matches = content.matchAll(tickerRegex)
  return Array.from(matches, m => m[1])
}

// Simple sentiment analysis based on keywords
function analyzeSentiment(content: string): 'bullish' | 'bearish' | 'neutral' {
  const bullishWords = ['buy', 'moon', 'bullish', 'calls', 'long', 'rocket', 'pump', 'up', 'gains']
  const bearishWords = ['sell', 'crash', 'bearish', 'puts', 'short', 'dump', 'down', 'loss']

  const lowerContent = content.toLowerCase()
  const bullishCount = bullishWords.filter(word => lowerContent.includes(word)).length
  const bearishCount = bearishWords.filter(word => lowerContent.includes(word)).length

  if (bullishCount > bearishCount) return 'bullish'
  if (bearishCount > bullishCount) return 'bearish'
  return 'neutral'
}

export async function GET() {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // TODO: Messages are encrypted (ciphertext field in DB)
    // Need to implement client-side decryption or server-side ticker tracking
    // For now, return empty array until encryption/decryption flow is implemented

    return NextResponse.json({
      success: true,
      tickers: [],
    })
  } catch (error) {
    console.error('Failed to fetch tickers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tickers' },
      { status: 500 }
    )
  }
}
