import { NextRequest, NextResponse } from 'next/server'
import { validateAndSnapshotTweet, batchValidateTweets } from '@/lib/twitter-validator'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tweetId, tweetIds, forceRefresh } = body

    // Single tweet validation
    if (tweetId) {
      const snapshot = await validateAndSnapshotTweet(tweetId, forceRefresh || false)

      if (!snapshot) {
        return NextResponse.json(
          { error: 'Failed to validate tweet' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        snapshot,
      })
    }

    // Batch tweet validation
    if (tweetIds && Array.isArray(tweetIds)) {
      const snapshots = await batchValidateTweets(tweetIds)

      return NextResponse.json({
        success: true,
        snapshots: Object.fromEntries(snapshots),
        total: snapshots.size,
      })
    }

    return NextResponse.json(
      { error: 'Missing tweetId or tweetIds parameter' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Tweet validation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tweetId = searchParams.get('tweetId')

    if (!tweetId) {
      return NextResponse.json(
        { error: 'Missing tweetId parameter' },
        { status: 400 }
      )
    }

    const snapshot = await validateAndSnapshotTweet(tweetId)

    if (!snapshot) {
      return NextResponse.json(
        { error: 'Failed to validate tweet' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      snapshot,
    })
  } catch (error) {
    console.error('Tweet validation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
