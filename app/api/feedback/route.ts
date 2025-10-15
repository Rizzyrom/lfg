import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

// POST - Save feedback (bugs/features/suggestions)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message, username, type } = body

    if (!message || !username) {
      return NextResponse.json({ error: 'Message and username required' }, { status: 400 })
    }

    // Categorize feedback
    let category = type || 'SUGGESTION'
    const messageLower = message.toLowerCase()

    if (messageLower.includes('bug') || messageLower.includes('issue') ||
        messageLower.includes('broken') || messageLower.includes('not working') ||
        messageLower.includes('error')) {
      category = 'BUG'
    } else if (messageLower.includes('feature') || messageLower.includes('add') ||
               messageLower.includes('want') || messageLower.includes('need') ||
               messageLower.includes('should')) {
      category = 'FEATURE'
    }

    // Format feedback entry
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19)
    const feedbackEntry = `[${timestamp}] [${category}] @${username}: ${message}\n`

    // Append to FEEDBACK.md
    const feedbackPath = path.join(process.cwd(), 'FEEDBACK.md')

    // Check if file exists, create header if it doesn't
    try {
      await fs.access(feedbackPath)
    } catch {
      const header = `# LFG App Feedback Tracker\n\nAutomatically collected from chat messages.\n\n---\n\n`
      await fs.writeFile(feedbackPath, header, 'utf-8')
    }

    // Append feedback
    await fs.appendFile(feedbackPath, feedbackEntry, 'utf-8')

    return NextResponse.json({
      success: true,
      category,
    })
  } catch (error) {
    console.error('Feedback save error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
