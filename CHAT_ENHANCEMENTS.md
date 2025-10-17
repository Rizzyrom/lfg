# Chat Enhancements - Integration Guide

## Required Changes to ChatClient.tsx

Add these imports at the top:

```typescript
import CommandAutocomplete from '@/components/CommandAutocomplete'
import { parseCommand, parseAgentMention, extractCommandPrefix } from '@/lib/commands/parse'
import { autoSubscribeToSocialLinks } from '@/hooks/useSocialAutoSubscribe'
```

Add these state variables after existing state:

```typescript
// Command autocomplete state
const [showCommands, setShowCommands] = useState(false)
const [commandQuery, setCommandQuery] = useState('')
const [commandPosition, setCommandPosition] = useState({ top: 0, left: 0 })

// Social auto-subscribe toast
const [socialToast, setSocialToast] = useState<string | null>(null)
```

Modify the `handleInputChange` function to detect commands:

```typescript
const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
  const value = e.target.value
  const cursorPos = e.target.selectionStart || 0
  setInput(value)

  // Check for command prefix
  const commandPrefix = extractCommandPrefix(value)
  if (commandPrefix !== null) {
    setCommandQuery(commandPrefix)
    setShowCommands(true)

    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect()
      setCommandPosition({
        top: rect.top - 8,
        left: rect.left + 10,
      })
    }
  } else {
    setShowCommands(false)
  }

  // ... existing mention detection code ...
}, [])
```

Add command select handler:

```typescript
const handleCommandSelect = useCallback((command: string) => {
  setInput(`/${command} `)
  setShowCommands(false)
  inputRef.current?.focus()
}, [])
```

Modify the `handleSend` function to handle commands and auto-subscribe:

```typescript
const handleSend = useCallback(async (e: React.FormEvent) => {
  e.preventDefault()
  if ((!input.trim() && !selectedFile) || sending) return

  // Check for command
  const parsedCommand = parseCommand(input)
  if (parsedCommand) {
    setSending(true)
    try {
      const res = await fetch('/api/commands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: input,
          groupId: 'YOUR_GROUP_ID', // Get from props or context
          messageId: replyingTo?.id,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        // Display system message
        setToast({ message: data.systemMessage.content, type: 'info' })
        setInput('')
        setReplyingTo(null)
      }
    } catch (error) {
      setToast({ message: 'Command failed', type: 'error' })
    } finally {
      setSending(false)
    }
    return
  }

  // Check for agent mention
  const agentQuestion = parseAgentMention(input)
  if (agentQuestion) {
    setSending(true)
    try {
      const res = await fetch('/api/agent/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: agentQuestion,
          groupId: 'YOUR_GROUP_ID',
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setToast({ message: data.answer, type: 'info' })
        setInput('')
      }
    } catch (error) {
      setToast({ message: 'Agent failed', type: 'error' })
    } finally {
      setSending(false)
    }
    return
  }

  // Auto-subscribe to social links
  if (input.includes('twitter.com') || input.includes('x.com') || input.includes('reddit.com')) {
    const subscribed = await autoSubscribeToSocialLinks(input, 'YOUR_GROUP_ID')
    if (subscribed.length > 0) {
      setSocialToast(`Added ${subscribed.map(s => s.handle).join(', ')} to sources`)
      setTimeout(() => setSocialToast(null), 3000)
    }
  }

  // ... existing send message code ...
}, [input, sending, selectedFile, replyingTo])
```

Add CommandAutocomplete to the render:

```tsx
{showCommands && (
  <CommandAutocomplete
    query={commandQuery}
    position={commandPosition}
    onSelect={handleCommandSelect}
    onClose={() => setShowCommands(false)}
  />
)}
```

Add social toast notification:

```tsx
{socialToast && (
  <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-tv-blue text-white px-4 py-2 rounded-lg shadow-lg animate-fade-in">
    ✅ {socialToast}
  </div>
)}
```

## Update Message Component

Replace `import Message from '@/components/Message'` with:

```typescript
import EnhancedMessage from '@/components/EnhancedMessage'
```

Update the message rendering to pass groupId:

```tsx
<EnhancedMessage
  key={msg.id}
  id={msg.id}
  username={msg.username}
  ciphertext={msg.ciphertext}
  mediaPtr={msg.mediaPtr}
  timestamp={msg.createdAt}
  isOwn={msg.senderId === userId}
  currentUserId={userId}
  groupId="YOUR_GROUP_ID" // Pass from props or context
  reactions={msg.reactions}
  replyTo={msg.replyTo}
  onReply={setReplyingTo}
/>
```

## Environment Variables

Add to `.env.local`:

```bash
# X (Twitter) API
X_BEARER_TOKEN=your_twitter_bearer_token_here

# LLM Provider (openai or anthropic)
LLM_PROVIDER=openai
OPENAI_API_KEY=your_openai_key_here
# OR
ANTHROPIC_API_KEY=your_anthropic_key_here

# n8n Webhook for feed refresh
N8N_WEBHOOK_URL=your_n8n_webhook_url
```

## Database Migration

Run the migration:

```bash
# If using Supabase locally
supabase db push

# Or apply the migration file directly to your database
psql $DATABASE_URL < supabase/migrations/20250117_chat_enhancements.sql
```

## Testing Commands

Test the commands in your chat:

- `/help` - List all commands
- `/summarize 50` - Summarize last 50 messages
- `/analyze TSLA` - Analyze Tesla stock
- `/alert BTC >50000` - Create price alert
- `/whois @elonmusk` - Lookup and subscribe to X account
- `/feed refresh` - Refresh public feed
- `/context off` - Disable chat context for agent
- `@agent what happened to NVDA today?` - Ask the agent

## Testing Long-Press Tagging

1. Send a message with an image attachment
2. Long-press (mobile) or right-click (desktop) on the image
3. Select $ (Market) or # (News)
4. The message will be tagged and added to the public feed

## Testing Auto-Subscribe

1. Send a message with a Twitter/X link: `Check this out https://x.com/elonmusk/status/123`
2. Or Reddit link: `Interesting discussion https://reddit.com/r/wallstreetbets`
3. You should see a toast: "Added @elonmusk to sources"
4. The account is now subscribed to your group's social feed

## Architecture Summary

```
User Input → Parse → Route:
  ├─ /command → executeCommand → handlers → API response → system message
  ├─ @agent question → handleAgentQuestion → LLM → answer
  └─ normal message → detectSocialLinks → auto-subscribe → send message

Long Press Attachment → AttachmentTagMenu → /api/chat/action → tag & snapshot

Command Flow:
  input → parse → registry lookup → exec (auth, rate limit) → handler → result

Social Flow:
  message → detectSocialLinks → validate (X/Reddit API) → upsert source → notify
```
