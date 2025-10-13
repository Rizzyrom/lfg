import { NextRequest, NextResponse } from 'next/server'
import { requireUser, verifyOrigin } from '@/lib/auth'
import { rateLimit } from '@/lib/redis'

export async function POST(request: NextRequest) {
  if (!verifyOrigin(request)) {
    return NextResponse.json({ error: 'Invalid origin' }, { status: 403 })
  }

  try {
    const user = await requireUser()

    const allowed = await rateLimit(`pulse:${user.id}`, 20, 60)
    if (!allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
    }

    const body = await request.json()
    const { symbol, source } = body

    if (!symbol || !source) {
      return NextResponse.json({ error: 'Symbol and source required' }, { status: 400 })
    }

    let assetData: any = {}
    let newsData: any[] = []

    // Fetch asset-specific data
    if (source === 'crypto') {
      try {
        // Get detailed crypto data from CoinGecko
        const coinId = symbol.toLowerCase() === 'btc' ? 'bitcoin' :
                       symbol.toLowerCase() === 'eth' ? 'ethereum' :
                       symbol.toLowerCase()

        const res = await fetch(
          `https://api.coingecko.com/api/v3/coins/${coinId}`,
          {
            headers: { 'x-cg-demo-api-key': process.env.COINGECKO_API_KEY || '' },
            next: { revalidate: 300 }
          }
        )

        if (res.ok) {
          const data = await res.json()
          assetData = {
            name: data.name,
            symbol: data.symbol.toUpperCase(),
            price: data.market_data?.current_price?.usd,
            change24h: data.market_data?.price_change_percentage_24h,
            marketCap: data.market_data?.market_cap?.usd,
            volume24h: data.market_data?.total_volume?.usd,
            rank: data.market_cap_rank,
            ath: data.market_data?.ath?.usd,
            athDate: data.market_data?.ath_date?.usd,
            description: data.description?.en?.substring(0, 500),
            links: {
              website: data.links?.homepage?.[0],
              twitter: data.links?.twitter_screen_name ? `https://twitter.com/${data.links.twitter_screen_name}` : null,
              reddit: data.links?.subreddit_url,
            }
          }
        }
      } catch (error) {
        console.error('CoinGecko data fetch error:', error)
      }
    } else if (source === 'stock') {
      try {
        // Get stock quote
        const quoteRes = await fetch(
          `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${process.env.FINNHUB_API_KEY}`,
          { next: { revalidate: 60 } }
        )

        // Get company profile
        const profileRes = await fetch(
          `https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${process.env.FINNHUB_API_KEY}`,
          { next: { revalidate: 3600 } }
        )

        // Get basic financials
        const financialsRes = await fetch(
          `https://finnhub.io/api/v1/stock/metric?symbol=${symbol}&metric=all&token=${process.env.FINNHUB_API_KEY}`,
          { next: { revalidate: 3600 } }
        )

        if (quoteRes.ok && profileRes.ok) {
          const quote = await quoteRes.json()
          const profile = await profileRes.json()
          const financials = financialsRes.ok ? await financialsRes.json() : {}

          assetData = {
            name: profile.name,
            symbol: symbol,
            price: quote.c,
            change24h: quote.dp,
            marketCap: profile.marketCapitalization * 1000000,
            industry: profile.finnhubIndustry,
            country: profile.country,
            currency: profile.currency,
            exchange: profile.exchange,
            ipo: profile.ipo,
            logo: profile.logo,
            phone: profile.phone,
            weburl: profile.weburl,
            pe: financials.metric?.peBasicExclExtraTTM,
            eps: financials.metric?.epsBasicExclExtraItemsTTM,
            nextEarnings: financials.metric?.earningsAnnouncementDate,
          }
        }
      } catch (error) {
        console.error('Finnhub data fetch error:', error)
      }

      // Get company news
      try {
        const newsRes = await fetch(
          `https://finnhub.io/api/v1/company-news?symbol=${symbol}&from=${new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}&to=${new Date().toISOString().split('T')[0]}&token=${process.env.FINNHUB_API_KEY}`,
          { next: { revalidate: 300 } }
        )

        if (newsRes.ok) {
          newsData = await newsRes.json()
          newsData = newsData.slice(0, 5)
        }
      } catch (error) {
        console.error('Stock news fetch error:', error)
      }
    }

    // Generate AI summary using OpenAI
    let aiSummary = ''
    try {
      const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a financial analyst providing concise market insights. Keep responses under 150 words.'
            },
            {
              role: 'user',
              content: `Provide a brief market analysis for ${symbol} (${source}). Current price: $${assetData.price}, 24h change: ${assetData.change24h}%. ${assetData.marketCap ? `Market cap: $${(assetData.marketCap / 1e9).toFixed(2)}B.` : ''} ${assetData.description ? assetData.description : ''}`
            }
          ],
          max_tokens: 200,
          temperature: 0.7,
        }),
      })

      if (openaiRes.ok) {
        const data = await openaiRes.json()
        aiSummary = data.choices[0]?.message?.content || ''
      }
    } catch (error) {
      console.error('OpenAI API error:', error)
    }

    return NextResponse.json({
      success: true,
      asset: assetData,
      news: newsData,
      aiSummary,
    })
  } catch (error) {
    console.error('Asset pulse error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
