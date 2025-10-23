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

export interface AgentResponse {
  answer: string;
  sources?: string[];
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

  // Gather data
  let chatHistory: string[] = [];
  let feedItems: string[] = [];

  // Fetch recent messages if context enabled
  if (contextEnabled) {
    const { data: messages } = await supabase
      .from('Message')
      .select('ciphertext')
      .eq('groupId', ctx.groupId)
      .order('createdAt', { ascending: false })
      .limit(50)
      .execute();

    if (messages) {
      chatHistory = messages.map((m: any) => m.ciphertext).reverse();
    }
  }

  // Fetch recent feed items (last 24 hours)
  const oneDayAgo = new Date();
  oneDayAgo.setHours(oneDayAgo.getHours() - 24);

  const { data: feeds } = await supabase
    .from('social_feed_item')
    .select('platform, handle, content, published_at, engagement_score')
    .eq('group_id', ctx.groupId)
    .gte('published_at', oneDayAgo.toISOString())
    .order('published_at', { ascending: false })
    .limit(50);

  if (feeds && feeds.length > 0) {
    // Format feed items for the prompt
    feedItems = feeds.map((feed: any) => {
      const timestamp = new Date(feed.published_at).toLocaleString();
      const platform = feed.platform === 'x' ? '𝕏' : feed.platform === 'reddit' ? 'Reddit' : 'News';
      return `[${platform}] ${feed.handle} (${timestamp}):\n${feed.content.slice(0, 300)}${feed.content.length > 300 ? '...' : ''}`;
    });
  }

  // Build prompt
  const prompt = buildPrompt(ctx.question, chatHistory, feedItems, contextEnabled);

  // Call LLM
  const answer = await callLLM(prompt);

  // Build sources list based on what data was actually used
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

  return {
    answer,
    sources,
  };
}

/**
 * Build agent prompt
 */
function buildPrompt(
  question: string,
  chatHistory: string[],
  feedItems: string[],
  contextEnabled: boolean
): string {
  let prompt = `You are a helpful financial assistant. Answer the following question concisely.\n\n`;

  if (contextEnabled && chatHistory.length > 0) {
    prompt += `## Recent Chat Context (last 50 messages)\n`;
    prompt += chatHistory.slice(-20).join('\n') + '\n\n';
  }

  if (feedItems.length > 0) {
    prompt += `## Recent Market/News Feed\n`;
    prompt += feedItems.join('\n') + '\n\n';
  }

  prompt += `## Question\n${question}\n\n`;
  prompt += `Provide a concise, helpful answer with bullet points if applicable. If you don't have enough information, say so.`;

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
            content: 'You are a helpful financial assistant.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 500,
        temperature: 0.7,
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
        max_tokens: 500,
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
