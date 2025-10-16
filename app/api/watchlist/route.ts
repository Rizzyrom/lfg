import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireUser, verifyOrigin } from '@/lib/auth'

export async function GET() {
  try {
    const user = await requireUser()

    const memberships = await db.membership.findMany({
      where: { userId: user.id },
      include: {
        group: {
          include: {
            watchlist: true,
          },
        },
      },
    })

    const items = memberships.flatMap((m) => m.group.watchlist)

    return NextResponse.json({ success: true, items })
  } catch (error) {
    console.error('Watchlist fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  if (!verifyOrigin(request)) {
    return NextResponse.json({ error: 'Invalid origin' }, { status: 403 })
  }

  try {
    const user = await requireUser()
    const body = await request.json()
    const { symbol, source, groupId, tags = [] } = body

    console.log('Add watchlist item request:', { symbol, source, userId: user.id })

    if (!symbol || !source) {
      return NextResponse.json({ error: 'Missing symbol or source' }, { status: 400 })
    }

    // Get user's first group if groupId not specified
    let targetGroupId = groupId
    if (!targetGroupId) {
      const membership = await db.membership.findFirst({
        where: { userId: user.id },
      })
      console.log('User membership:', membership)
      if (!membership) {
        return NextResponse.json({
          error: 'No group found. Please contact an admin to be added to a group.'
        }, { status: 400 })
      }
      targetGroupId = membership.groupId
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

    const item = await db.watchItem.create({
      data: {
        groupId: targetGroupId,
        userId: user.id,
        symbol: symbol.toUpperCase(),
        source,
        tags,
      },
    })

    console.log('Successfully created watchlist item:', item)
    return NextResponse.json({ success: true, item })
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Item already in watchlist' }, { status: 400 })
    }
    console.error('Watchlist add error:', error)
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      meta: error.meta
    })
    return NextResponse.json({
      error: `Failed to add item: ${error.message || 'Internal server error'}`
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  if (!verifyOrigin(request)) {
    return NextResponse.json({ error: 'Invalid origin' }, { status: 403 })
  }

  try {
    const user = await requireUser()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Missing item id' }, { status: 400 })
    }

    // Verify user has access to this item's group
    const item = await db.watchItem.findUnique({
      where: { id },
    })

    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    const membership = await db.membership.findUnique({
      where: {
        userId_groupId: {
          userId: user.id,
          groupId: item.groupId,
        },
      },
    })

    if (!membership) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    await db.watchItem.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Watchlist delete error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
