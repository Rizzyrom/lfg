import { NextResponse } from 'next/server'
import { list } from '@vercel/blob'
import { getUser } from '@/lib/auth'

export async function GET() {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // List all files from Vercel Blob storage
    const { blobs } = await list({
      limit: 50,
    })

    // Format attachments
    const attachments = blobs.map(blob => {
      // Extract username from pathname if it follows pattern: chat-uploads/{username}/{filename}
      const pathParts = blob.pathname.split('/')
      const uploadedBy = pathParts.length > 1 ? pathParts[pathParts.length - 2] : 'Unknown'

      // Determine content type from filename extension
      const filename = pathParts[pathParts.length - 1] || blob.pathname
      const ext = filename.split('.').pop()?.toLowerCase()
      let contentType = 'application/octet-stream'
      if (ext === 'png' || ext === 'jpg' || ext === 'jpeg' || ext === 'gif' || ext === 'webp') {
        contentType = `image/${ext === 'jpg' ? 'jpeg' : ext}`
      } else if (ext === 'mp4' || ext === 'webm') {
        contentType = `video/${ext}`
      } else if (ext === 'pdf') {
        contentType = 'application/pdf'
      }

      return {
        id: blob.pathname,
        filename,
        url: blob.url,
        type: contentType,
        uploadedBy,
        timestamp: blob.uploadedAt.toISOString(),
        size: blob.size,
      }
    })

    // Sort by most recent first
    attachments.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    return NextResponse.json({
      success: true,
      attachments,
    })
  } catch (error) {
    console.error('Failed to fetch attachments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch attachments' },
      { status: 500 }
    )
  }
}
