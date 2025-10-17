import { CommandContext, CommandResult } from '../types';

export async function handleAnalyze(
  ctx: CommandContext,
  args: string[]
): Promise<CommandResult> {
  if (args.length === 0) {
    return {
      status: 'error',
      message: 'Missing argument',
      detail: 'Provide a symbol (e.g., TSLA) or URL to analyze',
    };
  }

  const target = args.join(' ');

  // Detect if URL or symbol
  const isUrl = target.startsWith('http://') || target.startsWith('https://');

  if (isUrl) {
    // Analyze URL (use Firecrawl or basic fetch)
    return await analyzeUrl(target);
  } else {
    // Analyze symbol (use quote API)
    return await analyzeSymbol(target.toUpperCase(), ctx.groupId);
  }
}

async function analyzeSymbol(
  symbol: string,
  groupId: string
): Promise<CommandResult> {
  try {
    // Call internal quote API
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/quote?symbol=${symbol}`, {
      headers: {
        'x-group-id': groupId,
      },
    });

    if (!response.ok) {
      return {
        status: 'error',
        message: `Failed to fetch quote for ${symbol}`,
      };
    }

    const data = await response.json();

    if (!data || !data.price) {
      return {
        status: 'error',
        message: `No data found for ${symbol}`,
      };
    }

    const analysis = `
## Analysis: ${symbol}

**Price:** $${data.price.toFixed(2)}
**Change:** ${data.change >= 0 ? '+' : ''}${data.change.toFixed(2)} (${data.changePercent >= 0 ? '+' : ''}${data.changePercent.toFixed(2)}%)

${data.marketCap ? `**Market Cap:** $${(data.marketCap / 1e9).toFixed(2)}B` : ''}
${data.volume ? `**Volume:** ${(data.volume / 1e6).toFixed(2)}M` : ''}

📊 **Category:** Market
    `.trim();

    return {
      status: 'ok',
      message: analysis,
      data: { symbol, price: data.price },
    };
  } catch (error: any) {
    return {
      status: 'error',
      message: 'Analysis failed',
      detail: error.message,
    };
  }
}

async function analyzeUrl(url: string): Promise<CommandResult> {
  try {
    // Basic URL metadata fetch
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'LFG-App/1.0',
      },
    });

    if (!response.ok) {
      return {
        status: 'error',
        message: 'Failed to fetch URL',
      };
    }

    const html = await response.text();

    // Extract title and meta description
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const descMatch = html.match(
      /<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i
    );

    const title = titleMatch ? titleMatch[1] : 'No title';
    const description = descMatch ? descMatch[1] : 'No description';

    // Simple classification
    const lowerHtml = html.toLowerCase();
    const isMarket =
      lowerHtml.includes('stock') ||
      lowerHtml.includes('market') ||
      lowerHtml.includes('trading');
    const isNews =
      lowerHtml.includes('news') ||
      lowerHtml.includes('article') ||
      lowerHtml.includes('published');

    const category = isMarket ? 'Market' : isNews ? 'News' : 'General';

    const analysis = `
## URL Analysis

**Title:** ${title}

**Description:** ${description}

**Category:** ${category}

🔗 [Open Link](${url})
    `.trim();

    return {
      status: 'ok',
      message: analysis,
      data: { url, title, category },
    };
  } catch (error: any) {
    return {
      status: 'error',
      message: 'URL analysis failed',
      detail: error.message,
    };
  }
}
