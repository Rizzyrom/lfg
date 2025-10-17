import { db } from './db'

interface TweetSnapshot {
  id: string
  text: string
  author: string
  authorId: string
  createdAt: string
  likes: number
  retweets: number
  isAvailable: boolean
  snapshotAt: string
  validatedAt: string
}

// Extract tweet ID from various URL formats
export function extractTweetId(url: string): string | null {
  const patterns = [
    /twitter\.com\/\w+\/status\/(\d+)/,
    /x\.com\/\w+\/status\/(\d+)/,
    /^(\d+)$/, // Just the ID
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }

  return null
}

// Validate tweet using X API v2
export async function validateTweet(tweetId: string): Promise<TweetSnapshot | null> {
  const bearerToken = process.env.X_BEARER_TOKEN || process.env.TWITTER_BEARER_TOKEN

  if (!bearerToken) {
    console.warn('No X/Twitter bearer token configured')
    return null
  }

  try {
    const response = await fetch(
      `https://api.twitter.com/2/tweets/${tweetId}?tweet.fields=created_at,public_metrics,author_id&expansions=author_id&user.fields=username`,
      {
        headers: {
          Authorization: `Bearer ${bearerToken}`,
        },
        next: { revalidate: 3600 }, // Cache for 1 hour
      }
    )

    if (!response.ok) {
      // Tweet is deleted, private, or doesn't exist
      if (response.status === 404 || response.status === 403) {
        return {
          id: tweetId,
          text: '',
          author: '',
          authorId: '',
          createdAt: new Date().toISOString(),
          likes: 0,
          retweets: 0,
          isAvailable: false,
          snapshotAt: new Date().toISOString(),
          validatedAt: new Date().toISOString(),
        }
      }
      console.error(`Twitter API error for tweet ${tweetId}:`, response.status)
      return null
    }

    const data = await response.json()
    const tweet = data.data
    const author = data.includes?.users?.[0]

    if (!tweet) return null

    return {
      id: tweet.id,
      text: tweet.text,
      author: author?.username || 'Unknown',
      authorId: tweet.author_id,
      createdAt: tweet.created_at,
      likes: tweet.public_metrics?.like_count || 0,
      retweets: tweet.public_metrics?.retweet_count || 0,
      isAvailable: true,
      snapshotAt: new Date().toISOString(),
      validatedAt: new Date().toISOString(),
    }
  } catch (error) {
    console.error(`Failed to validate tweet ${tweetId}:`, error)
    return null
  }
}

// Save tweet snapshot to database
export async function saveTweetSnapshot(snapshot: TweetSnapshot): Promise<void> {
  try {
    await db.tweetSnapshot.upsert({
      where: { tweetId: snapshot.id },
      update: {
        text: snapshot.text,
        author: snapshot.author,
        authorId: snapshot.authorId,
        likes: snapshot.likes,
        retweets: snapshot.retweets,
        isAvailable: snapshot.isAvailable,
        validatedAt: new Date(snapshot.validatedAt),
      },
      create: {
        tweetId: snapshot.id,
        text: snapshot.text,
        author: snapshot.author,
        authorId: snapshot.authorId,
        createdAt: new Date(snapshot.createdAt),
        likes: snapshot.likes,
        retweets: snapshot.retweets,
        isAvailable: snapshot.isAvailable,
        snapshotAt: new Date(snapshot.snapshotAt),
        validatedAt: new Date(snapshot.validatedAt),
      },
    })
  } catch (error) {
    console.error('Failed to save tweet snapshot:', error)
  }
}

// Get tweet snapshot from database
export async function getTweetSnapshot(tweetId: string): Promise<TweetSnapshot | null> {
  try {
    const snapshot = await db.tweetSnapshot.findUnique({
      where: { tweetId },
    })

    if (!snapshot) return null

    return {
      id: snapshot.tweetId,
      text: snapshot.text,
      author: snapshot.author,
      authorId: snapshot.authorId,
      createdAt: snapshot.createdAt.toISOString(),
      likes: snapshot.likes,
      retweets: snapshot.retweets,
      isAvailable: snapshot.isAvailable,
      snapshotAt: snapshot.snapshotAt.toISOString(),
      validatedAt: snapshot.validatedAt.toISOString(),
    }
  } catch (error) {
    console.error('Failed to get tweet snapshot:', error)
    return null
  }
}

// Validate and snapshot tweet with caching
export async function validateAndSnapshotTweet(
  tweetIdOrUrl: string,
  forceRefresh = false
): Promise<TweetSnapshot | null> {
  const tweetId = extractTweetId(tweetIdOrUrl)
  if (!tweetId) {
    console.error('Invalid tweet ID or URL:', tweetIdOrUrl)
    return null
  }

  // Check if we have a recent snapshot (< 24 hours old)
  if (!forceRefresh) {
    const existing = await getTweetSnapshot(tweetId)
    if (existing) {
      const age = Date.now() - new Date(existing.validatedAt).getTime()
      const maxAge = 24 * 60 * 60 * 1000 // 24 hours

      if (age < maxAge) {
        console.log(`Using cached snapshot for tweet ${tweetId}`)
        return existing
      }
    }
  }

  // Validate tweet from API
  console.log(`Validating tweet ${tweetId} from API`)
  const snapshot = await validateTweet(tweetId)

  if (snapshot) {
    // Save snapshot to database
    await saveTweetSnapshot(snapshot)
  }

  return snapshot
}

// Batch validate multiple tweets
export async function batchValidateTweets(
  tweetIdsOrUrls: string[]
): Promise<Map<string, TweetSnapshot | null>> {
  const results = new Map<string, TweetSnapshot | null>()

  // Process in parallel with max 5 concurrent requests
  const batchSize = 5
  for (let i = 0; i < tweetIdsOrUrls.length; i += batchSize) {
    const batch = tweetIdsOrUrls.slice(i, i + batchSize)
    const promises = batch.map((idOrUrl) => validateAndSnapshotTweet(idOrUrl))
    const snapshots = await Promise.all(promises)

    batch.forEach((idOrUrl, index) => {
      const tweetId = extractTweetId(idOrUrl)
      if (tweetId) {
        results.set(tweetId, snapshots[index])
      }
    })
  }

  return results
}
