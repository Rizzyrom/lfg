import { CommandContext, CommandResult } from '../types';

// Common crypto symbols for detection
const CRYPTO_SYMBOLS = new Set([
  'BTC', 'ETH', 'SOL', 'DOGE', 'XRP', 'ADA', 'AVAX', 'DOT', 'MATIC', 'LINK',
  'UNI', 'ATOM', 'LTC', 'BCH', 'XLM', 'ALGO', 'VET', 'FIL', 'THETA', 'XMR',
  'ETC', 'AAVE', 'MKR', 'COMP', 'SNX', 'SUSHI', 'YFI', 'CRV', 'BAL', 'ZRX',
  'SHIB', 'PEPE', 'ARB', 'OP', 'APT', 'SUI', 'SEI', 'TIA', 'INJ', 'BONK'
]);

function detectAssetSource(symbol: string): 'crypto' | 'stock' {
  return CRYPTO_SYMBOLS.has(symbol.toUpperCase()) ? 'crypto' : 'stock';
}

export async function handleAnalyze(
  ctx: CommandContext,
  args: string[]
): Promise<CommandResult> {
  if (args.length === 0) {
    return {
      status: 'error',
      message: 'Missing argument',
      detail: 'Provide a symbol (e.g., TSLA, BTC) or URL to analyze',
    };
  }

  const target = args.join(' ');

  // Detect if URL or symbol
  const isUrl = target.startsWith('http://') || target.startsWith('https://');

  if (isUrl) {
    return await analyzeUrl(target);
  } else {
    return await analyzeSymbol(target.toUpperCase(), ctx.groupId);
  }
}

async function analyzeSymbol(
  symbol: string,
  groupId: string
): Promise<CommandResult> {
  try {
    const source = detectAssetSource(symbol);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    
    const response = await fetch(`${baseUrl}/api/pulse/asset`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-group-id': groupId,
      },
      body: JSON.stringify({ symbol, source }),
    });

    if (!response.ok) {
      return {
        status: 'error',
        message: `Failed to fetch data for ${symbol}`,
      };
    }

    const data = await response.json();
    const asset = data.asset;

    if (!asset || !asset.price) {
      return {
        status: 'error',
        message: `No data found for ${symbol}`,
      };
    }

    const price = asset.price;
    const change24h = asset.change24h || 0;
    const changePercent = asset.changePercent24h || 0;

    let analysis = `## Analysis: ${symbol}\n\n`;
    analysis += `**Price:** $${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n`;
    analysis += `**24h Change:** ${change24h >= 0 ? '+' : ''}${change24h.toFixed(2)} (${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%)\n`;

    if (asset.marketCap) analysis += `**Market Cap:** $${(asset.marketCap / 1e9).toFixed(2)}B\n`;
    if (asset.volume24h) analysis += `**24h Volume:** $${(asset.volume24h / 1e6).toFixed(2)}M\n`;
    if (source === 'stock' && asset.pe) analysis += `**P/E Ratio:** ${asset.pe.toFixed(2)}\n`;
    if (source === 'stock' && asset.industry) analysis += `**Industry:** ${asset.industry}\n`;
    if (source === 'crypto' && asset.rank) analysis += `**Rank:** #${asset.rank}\n`;

    if (data.aiSummary) {
      analysis += `\n📊 **AI Analysis:**\n${data.aiSummary}\n`;
    }

    if (data.news && data.news.length > 0) {
      analysis += `\n📰 **Recent News:**\n`;
      data.news.slice(0, 3).forEach((item: any) => {
        analysis += `• ${item.headline || item.title}\n`;
      });
    }

    analysis += `\n🏷️ **Type:** ${source === 'crypto' ? 'Cryptocurrency' : 'Stock'}`;

    return { status: 'ok', message: analysis.trim(), data: { symbol, price, source } };
  } catch (error: any) {
    return { status: 'error', message: 'Analysis failed', detail: error.message };
  }
}

async function analyzeUrl(url: string): Promise<CommandResult> {
  try {
    const response = await fetch(url, { headers: { 'User-Agent': 'LFG-App/1.0' } });
    if (!response.ok) return { status: 'error', message: 'Failed to fetch URL' };

    const html = await response.text();
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const descMatch = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i);

    const title = titleMatch ? titleMatch[1] : 'No title';
    const description = descMatch ? descMatch[1] : 'No description';

    const lowerHtml = html.toLowerCase();
    const isMarket = lowerHtml.includes('stock') || lowerHtml.includes('market') || lowerHtml.includes('trading');
    const isNews = lowerHtml.includes('news') || lowerHtml.includes('article') || lowerHtml.includes('published');
    const category = isMarket ? 'Market' : isNews ? 'News' : 'General';

    const analysis = `
## URL Analysis

**Title:** ${title}
**Description:** ${description}
**Category:** ${category}

🔗 [Open Link](${url})
    `.trim();

    return { status: 'ok', message: analysis, data: { url, title, category } };
  } catch (error: any) {
    return { status: 'error', message: 'URL analysis failed', detail: error.message };
  }
}
