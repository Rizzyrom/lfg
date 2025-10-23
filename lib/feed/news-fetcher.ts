/**
 * News Feed Fetcher
 * Fetches recent financial news from legacy media sources
 * Uses existing news aggregation and converts to feed items
 */

import type { FeedItem } from './x-fetcher';

interface NewsArticle {
  title: string;
  description: string;
  url: string;
  source: string;
  publishedAt: string;
  imageUrl?: string;
}

/**
 * Fetch financial news (reusing existing news API logic)
 */
async function fetchFinancialNews(): Promise<NewsArticle[]> {
  const articles: NewsArticle[] = [];

  // Fetch from top sources in parallel
  const sources = [
    { name: 'CoinDesk', url: 'https://www.coindesk.com/arc/outboundfeeds/rss/' },
    { name: 'Bloomberg', url: 'https://feeds.bloomberg.com/markets/news.rss' },
    { name: 'Reuters', url: 'https://www.reutersagency.com/feed/?taxonomy=best-topics&post_type=best' },
    { name: 'MarketWatch', url: 'https://www.marketwatch.com/rss/topstories' },
  ];

  // Fetch Finnhub if API key is available
  if (process.env.FINNHUB_API_KEY) {
    try {
      const finnhubResponse = await fetch(
        `https://finnhub.io/api/v1/news?category=general&token=${process.env.FINNHUB_API_KEY}`
      );

      if (finnhubResponse.ok) {
        const finnhubNews = await finnhubResponse.json();
        if (Array.isArray(finnhubNews)) {
          finnhubNews.slice(0, 10).forEach((item: any) => {
            if (item.headline && item.url) {
              articles.push({
                title: item.headline,
                description: item.summary || '',
                url: item.url,
                source: item.source || 'Finnhub',
                publishedAt: new Date(item.datetime * 1000).toISOString(),
                imageUrl: item.image,
              });
            }
          });
        }
      }
    } catch (error) {
      console.error('Finnhub fetch error:', error);
    }
  }

  // Fetch RSS feeds in parallel
  await Promise.all(
    sources.map(async (source) => {
      try {
        const response = await fetch(source.url);
        if (!response.ok) return;

        const rssText = await response.text();

        // Simple RSS parsing
        const titleMatches = rssText.matchAll(/<title><!\[CDATA\[(.*?)\]\]><\/title>/g);
        const linkMatches = rssText.matchAll(/<link>(.*?)<\/link>/g);
        const descMatches = rssText.matchAll(/<description><!\[CDATA\[(.*?)\]\]><\/description>/g);
        const pubDateMatches = rssText.matchAll(/<pubDate>(.*?)<\/pubDate>/g);

        const titles = Array.from(titleMatches).map((m) => m[1]);
        const links = Array.from(linkMatches).map((m) => m[1]);
        const descriptions = Array.from(descMatches).map((m) => m[1]);
        const pubDates = Array.from(pubDateMatches).map((m) => m[1]);

        // Skip first title (feed title) and take up to 5 articles per source
        for (let i = 1; i < Math.min(titles.length, 6); i++) {
          if (titles[i] && links[i]) {
            articles.push({
              title: titles[i],
              description: descriptions[i] || '',
              url: links[i],
              source: source.name,
              publishedAt: pubDates[i] || new Date().toISOString(),
            });
          }
        }
      } catch (error) {
        console.error(`Error fetching ${source.name}:`, error);
      }
    })
  );

  // Sort by date and return top 20
  articles.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  return articles.slice(0, 20);
}

/**
 * Fetch news and convert to feed items
 */
export async function fetchNewsFeeds(groupId: string): Promise<FeedItem[]> {
  console.log('Fetching financial news feeds');

  const articles = await fetchFinancialNews();

  const feedItems: FeedItem[] = articles.map((article) => ({
    group_id: groupId,
    platform: 'news',
    handle: article.source,
    content: `${article.title}\n\n${article.description}`,
    post_url: article.url,
    post_id: Buffer.from(article.url).toString('base64').slice(0, 50), // Generate ID from URL
    author: article.source,
    published_at: new Date(article.publishedAt),
    engagement_score: 0,
    reply_count: 0,
  }));

  console.log(`Fetched ${feedItems.length} news articles`);
  return feedItems;
}
