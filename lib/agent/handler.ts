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
      .from('msg')
      .select('content')
      .eq('group_id', ctx.groupId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (messages) {
      chatHistory = messages.map((m) => m.content).reverse();
    }
  }

  // Fetch recent public feed items
  const { data: feed } = await supabase
    .from('public_feed_item')
    .select('title, text, category')
    .eq('group_id', ctx.groupId)
    .order('created_at', { ascending: false })
    .limit(20);

  if (feed) {
    feedItems = feed.map((item) => `[${item.category}] ${item.title}: ${item.text?.substring(0, 200)}`);
  }

  // Build prompt
  const prompt = buildPrompt(ctx.question, chatHistory, feedItems, contextEnabled);

  // Call LLM
  const answer = await callLLM(prompt);

  return {
    answer,
    sources: [...(contextEnabled ? ['chat-history'] : []), 'public-feed'],
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
