// OpenAI helper for LFG Agent

const OPENAI_API_KEY = process.env.OPENAI_API_KEY

export interface AgentResponse {
  success: boolean
  message?: string
  error?: string
}

const SYSTEM_PROMPT = `You are LFG Agent, an AI assistant for the LFG market community app.
You help users with:
- Stock and crypto market questions
- Technical analysis
- App features and how to use them
- General financial questions

Be concise, helpful, and professional. Keep responses under 200 words.
If you don't know something, say so. Never provide financial advice - only educational information.`

export async function callOpenAI(userQuestion: string, context?: string): Promise<AgentResponse> {
  if (!OPENAI_API_KEY) {
    return {
      success: false,
      error: 'OpenAI API key not configured',
    }
  }

  try {
    // Build messages array with context if provided
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
    ]

    // Add context as assistant message if provided
    if (context) {
      messages.push({
        role: 'user',
        content: `Previous conversation context:\n${context}\n\nNow responding to: ${userQuestion}`,
      })
    } else {
      messages.push({
        role: 'user',
        content: userQuestion,
      })
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        max_tokens: 300,
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('OpenAI API error:', errorData)
      return {
        success: false,
        error: 'Failed to get response from AI',
      }
    }

    const data = await response.json()
    const aiMessage = data.choices?.[0]?.message?.content

    if (!aiMessage) {
      return {
        success: false,
        error: 'No response from AI',
      }
    }

    return {
      success: true,
      message: aiMessage.trim(),
    }
  } catch (error) {
    console.error('OpenAI call error:', error)
    return {
      success: false,
      error: 'Internal error calling AI',
    }
  }
}
