import { list } from '@vercel/blob'
import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth'

export async function GET() {
  try {
    await requireUser()

    const { blobs } = await list()

    const totalSize = blobs.reduce((acc, blob) => acc + blob.size, 0)
    const totalFiles = blobs.length

    const usageGB = (totalSize / 1024 / 1024 / 1024).toFixed(2)
    const limitGB = 1 // Free tier limit
    const percentUsed = ((totalSize / (limitGB * 1024 * 1024 * 1024)) * 100).toFixed(1)

    return NextResponse.json({
      totalFiles,
      totalSize,
      usageGB,
      limitGB,
      percentUsed,
    })
  } catch (error) {
    console.error('Storage usage fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch usage' }, { status: 500 })
  }
}
