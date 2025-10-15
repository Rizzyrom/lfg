import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { requireUser, verifyOrigin } from '@/lib/auth'
import { rateLimit } from '@/lib/redis'

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB for videos
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/heic', 'image/heif']
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/mpeg', 'video/webm']
const ALLOWED_PDF_TYPE = 'application/pdf'
const ALLOWED_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES, ALLOWED_PDF_TYPE]

export async function POST(request: NextRequest) {
  if (!verifyOrigin(request)) {
    return NextResponse.json({ error: 'Invalid origin' }, { status: 403 })
  }

  try {
    const user = await requireUser()

    // Rate limiting: 20 uploads per hour per user
    const allowed = await rateLimit(`upload:${user.id}`, 20, 3600)
    if (!allowed) {
      return NextResponse.json(
        { error: 'Upload rate limit exceeded. Try again later.' },
        { status: 429 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only images, videos, and PDFs are allowed.' },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 50MB.' },
        { status: 400 }
      )
    }

    // Generate unique filename
    const timestamp = Date.now()
    const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const filename = `${user.id}/${timestamp}-${sanitizedFilename}`

    // Upload to Vercel Blob
    const blob = await put(filename, file, {
      access: 'public',
      addRandomSuffix: false,
    })

    return NextResponse.json({
      success: true,
      url: blob.url,
      filename: file.name,
      size: file.size,
      contentType: file.type,
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    )
  }
}
