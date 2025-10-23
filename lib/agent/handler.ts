/**
 * Agent Q&A handler
 * Answers questions using public data + group context
 */

import { createClient } from '@/lib/supabase/server';

export interface AgentContext {
  question: string;
  groupId: string;
  userId: string;
}

export interface LinkPreview {
  url: string;
  title: string;
  description: string;
  thumbnail?: string;
  source: string;
  engagement?: number;
}

export interface AgentResponse {
  answer: string;
  sources?: string[];
  links?: LinkPreview[];
}

/**
 * Handle agent Q&A request
 */
export async function handleAgentQuestion(
  ctx: AgentContext
): Promise<AgentResponse> {
  const supabase = await createClient();

  // Check context setting
  const { data: contextSetting } = await supabase
    .from('chat_context_setting')
    .select('context_enabled')
    .eq('group_id', ctx.groupId)
    .single();

  const contextEnabled = contextSetting?.context_enabled ?? true;

  // Gather comprehensive data sources
  let chatHistory: string[] = [];
  let feedItems: string[] = [];
  let watchlistData: string[] = [];
  let tickerMentions: string[] = [];
  let priceData: string[] = [];

  // Fetch recent messages if context enabled
  if (contextEnabled) {
    const { data: messages } = await supabase
      .from('Message')
      .select('ciphertext')
      .eq('groupId', ctx.groupId)
      .order('createdAt', { ascending: false })
      .limit(100)
      .execute();

    if (messages) {
      chatHistory = messages.map((m: any) => m.ciphertext).reverse();
    }
  }

  // Fetch recent feed items (last 48 hours for better context)
  const twoDaysAgo = new Date();
  twoDaysAgo.setHours(twoDaysAgo.getHours() - 48);

  const { data: feeds } = await supabase
    .from('social_feed_item')
    .select('platform, handle, content, published_at, engagement_score, post_url')
    .eq('group_id', ctx.groupId)
    .gte('published_at', twoDaysAgo.toISOString())
    .order('engagement_score', { ascending: false })
    .limit(100)
    .execute();

  if (feeds && feeds.length > 0) {
    // Format feed items with more detail and engagement signals
    feedItems = feeds.map((feed: any) => {
      const timestamp = new Date(feed.published_at).toLocaleString();
      const platform = feed.platform === 'x' ? '𝕏' : feed.platform === 'reddit' ? 'Reddit' : 'News';
      const engagement = feed.engagement_score > 0 ? ` [${feed.engagement_score} engagement]` : '';
      const url = feed.post_url ? `\nURL: ${feed.post_url}` : '';
      return `[${platform}] ${feed.handle} (${timestamp})${engagement}:\n${feed.content}${url}`;
    });
  }

  // Fetch watchlist for context about what the group is tracking
  const { data: watchlist } = await supabase
    .from('WatchItem')
    .select('symbol, source, tags')
    .eq('groupId', ctx.groupId)
    .execute();

  if (watchlist && watchlist.length > 0) {
    watchlistData = watchlist.map((item: any) => {
      const tags = item.tags?.length > 0 ? ` (tags: ${item.tags.join(', ')})` : '';
      return `${item.symbol} [${item.source}]${tags}`;
    });
  }

  // Fetch ticker mentions to understand discussion trends
  const { data: mentions } = await supabase
    .from('TickerMention')
    .select('symbol, source, count, lastMentionedAt')
    .eq('groupId', ctx.groupId)
    .order('count', { ascending: false })
    .limit(20)
    .execute();

  if (mentions && mentions.length > 0) {
    tickerMentions = mentions.map((m: any) => {
      const lastMention = new Date(m.lastMentionedAt).toLocaleDateString();
      return `${m.symbol} [${m.source}]: ${m.count} mentions (last: ${lastMention})`;
    });
  }

  // Fetch recent price data for watchlist items
  if (watchlist && watchlist.length > 0) {
    const symbols = watchlist.map((w: any) => w.symbol);
    const { data: prices } = await supabase
      .from('PriceCache')
      .select('symbol, source, price, change24h, change30d, updatedAt')
      .execute();

    if (prices && prices.length > 0) {
      priceData = prices.map((p: any) => {
        const change24 = p.change24h ? ` (24h: ${p.change24h > 0 ? '+' : ''}${Number(p.change24h).toFixed(2)}%)` : '';
        const change30 = p.change30d ? ` (30d: ${p.change30d > 0 ? '+' : ''}${Number(p.change30d).toFixed(2)}%)` : '';
        return `${p.symbol}: $${Number(p.price).toFixed(2)}${change24}${change30}`;
      });
    }
  }

  // Build enhanced prompt
  const prompt = buildPrompt(
    ctx.question,
    chatHistory,
    feedItems,
    watchlistData,
    tickerMentions,
    priceData,
    contextEnabled
  );

  // Call LLM with enhanced context
  const answer = await callLLM(prompt);

  // Build comprehensive sources list
  const sources: string[] = [];
  if (contextEnabled && chatHistory.length > 0) {
    sources.push('chat-history');
  }
  if (feeds && feeds.length > 0) {
    const platforms = [...new Set(feeds.map((f: any) => f.platform))];
    if (platforms.includes('x')) sources.push('x-twitter');
    if (platforms.includes('reddit')) sources.push('reddit');
    if (platforms.includes('news')) sources.push('financial-news');
  }
  if (watchlistData.length > 0) {
    sources.push('group-watchlist');
  }
  if (tickerMentions.length > 0) {
    sources.push('discussion-trends');
  }
  if (priceData.length > 0) {
    sources.push('market-data');
  }

  // Extract top 3 most relevant and valuable links from feed
  const links: LinkPreview[] = [];
  if (feeds && feeds.length > 0) {
    // Sort by engagement and relevance
    const sortedFeeds = [...feeds]
      .filter((f: any) => f.post_url && f.post_url.startsWith('http'))
      .sort((a: any, b: any) => (b.engagement_score || 0) - (a.engagement_score || 0))
      .slice(0, 5); // Get top 5 for relevance matching

    // Extract question keywords for relevance scoring
    const questionWords = ctx.question
      .toLowerCase()
      .split(' ')
      .filter(w => w.length > 3 && !['what', 'when', 'where', 'which', 'this', 'that', 'with', 'from'].includes(w));

    // Score feeds by relevance to question
    const scoredFeeds = sortedFeeds.map((feed: any) => {
      const content = (feed.content || '').toLowerCase();
      const relevanceScore = questionWords.reduce((score, word) => {
        return score + (content.includes(word) ? 1 : 0);
      }, 0);

      return {
        feed,
        score: relevanceScore + (feed.engagement_score || 0) / 1000, // Combine relevance + engagement
      };
    });

    // Get top 3 most relevant links
    scoredFeeds
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .forEach(({ feed }: any) => {
        // Extract title from content (first line or first sentence)
        const contentLines = feed.content.split('\n').filter((l: string) => l.trim());
        const title = contentLines[0] || feed.content.slice(0, 100);

        links.push({
          url: feed.post_url,
          title: title.slice(0, 150),
          description: feed.content.slice(0, 200),
          source: feed.handle,
          engagement: feed.engagement_score || 0,
        });
      });
  }

  return {
    answer,
    sources,
    links: links.length > 0 ? links : undefined,
  };
}

/**
 * Build agent prompt
 */
function buildPrompt(
  question: string,
  chatHistory: string[],
  feedItems: string[],
  watchlistData: string[],
  tickerMentions: string[],
  priceData: string[],
  contextEnabled: boolean
): string {
  let prompt = `You are LFG Agent, an advanced financial intelligence assistant with deep analytical capabilities. Your role is to provide thoughtful, insightful, and well-reasoned responses that go beyond surface-level information.

ANALYSIS FRAMEWORK:
1. **Synthesize Multiple Sources**: Connect insights across social media, news, price data, and chat history
2. **Identify Patterns**: Look for trends, sentiment shifts, and market signals
3. **Provide Context**: Explain the "why" behind movements and events
4. **Consider Timeframes**: Distinguish between short-term noise and long-term signals
5. **Think Critically**: Question assumptions and provide balanced perspectives
6. **Be Specific**: Use concrete data points and examples from the available sources

`;

  // Add context sections with proper formatting
  if (watchlistData.length > 0) {
    prompt += `## GROUP WATCHLIST (${watchlistData.length} items)\n`;
    prompt += `Assets the group is actively tracking:\n`;
    prompt += watchlistData.join('\n') + '\n\n';
  }

  if (tickerMentions.length > 0) {
    prompt += `## DISCUSSION TRENDS (Top ${tickerMentions.length} mentioned)\n`;
    prompt += `What the group has been discussing:\n`;
    prompt += tickerMentions.join('\n') + '\n\n';
  }

  if (priceData.length > 0) {
    prompt += `## CURRENT MARKET DATA\n`;
    prompt += `Latest prices and performance:\n`;
    prompt += priceData.join('\n') + '\n\n';
  }

  if (feedItems.length > 0) {
    prompt += `## SOCIAL & NEWS FEED (Last 48 hours, sorted by engagement)\n`;
    prompt += `Recent posts, articles, and discussions:\n`;
    prompt += feedItems.slice(0, 50).join('\n\n---\n\n') + '\n\n';
  }

  if (contextEnabled && chatHistory.length > 0) {
    prompt += `## RECENT CHAT CONTEXT (Last ${chatHistory.length} messages)\n`;
    prompt += `Group conversation history:\n`;
    prompt += chatHistory.slice(-30).join('\n') + '\n\n';
  }

  prompt += `## USER QUESTION\n${question}\n\n`;

  prompt += `## RESPONSE GUIDELINES
- Provide a thoughtful, well-structured answer that demonstrates deep analysis
- Connect insights from multiple data sources when relevant
- Highlight key patterns, trends, or anomalies you notice
- Include specific examples and data points to support your reasoning
- Consider both bullish and bearish perspectives where applicable
- If discussing price movements, explain potential catalysts or drivers
- Use clear formatting with headers and bullet points for readability
- If you don't have sufficient data for a comprehensive answer, explain what additional information would be helpful
- Be honest about uncertainty - distinguish between facts and speculation
- When relevant sources exist in the feed data, naturally reference them (e.g., "According to [source]..." or "Recent reports indicate...")

Think step-by-step and provide insights that add real value beyond just summarizing the data.`;

  return prompt;
}

/**
 * Call LLM (OpenAI or Anthropic)
 */
async function callLLM(prompt: string): Promise<string> {
  const provider = process.env.LLM_PROVIDER || 'openai';

  if (provider === 'openai') {
    return await callOpenAI(prompt);
  } else if (provider === 'anthropic') {
    return await callAnthropic(prompt);
  }

  return 'LLM not configured';
}

/**
 * Call OpenAI API
 */
async function callOpenAI(prompt: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return 'OpenAI API key not configured';
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'You are LFG Agent, an advanced financial intelligence assistant. Provide thoughtful, insightful analysis that synthesizes multiple data sources and identifies meaningful patterns and trends.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 1500,
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || 'No response';
  } catch (error: any) {
    console.error('OpenAI error:', error);
    return `Error: ${error.message}`;
  }
}

/**
 * Call Anthropic API
 */
async function callAnthropic(prompt: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return 'Anthropic API key not configured';
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2000,
        temperature: 0.8,
        system: 'You are LFG Agent, an advanced financial intelligence assistant. Provide thoughtful, insightful analysis that synthesizes multiple data sources and identifies meaningful patterns and trends. Think deeply and provide nuanced perspectives.',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.status}`);
    }

    const data = await response.json();
    return data.content[0]?.text || 'No response';
  } catch (error: any) {
    console.error('Anthropic error:', error);
    return `Error: ${error.message}`;
  }
}
