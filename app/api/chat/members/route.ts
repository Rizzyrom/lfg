import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser()
    const { searchParams } = new URL(request.url)
    const groupId = searchParams.get('groupId')
    const query = searchParams.get('q')?.toLowerCase() || ''

    // Get user's first group if not specified
    let targetGroupId = groupId
    if (!targetGroupId) {
      const membership = await db.membership.findFirst({
        where: { userId: user.id },
      })
      if (membership) {
        targetGroupId = membership.groupId
      }
    }

    if (!targetGroupId) {
      return NextResponse.json({ members: [] })
    }

    // Verify user is member of group
    const membership = await db.membership.findUnique({
      where: {
        userId_groupId: {
          userId: user.id,
          groupId: targetGroupId,
        },
      },
    })

    if (!membership) {
      return NextResponse.json({ error: 'Not a member of this group' }, { status: 403 })
    }

    // Fetch group members
    const members = await db.membership.findMany({
      where: { groupId: targetGroupId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    })

    // Filter by query if provided
    const filteredMembers = members
      .map(m => ({
        id: m.user.id,
        username: m.user.username,
      }))
      .filter(m => !query || m.username.toLowerCase().includes(query))

    // Always include LFG Agent at the top if it matches the query
    const agentMatches = !query || 'lfgent'.includes(query) || 'lfg agent'.includes(query)
    const finalMembers = agentMatches
      ? [{ id: 'agent', username: 'lfgent' }, ...filteredMembers]
      : filteredMembers

    return NextResponse.json({
      success: true,
      members: finalMembers,
    })
  } catch (error) {
    console.error('Members fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
