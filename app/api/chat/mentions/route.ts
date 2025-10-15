import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUser } from '@/lib/auth'

export async function GET() {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // TODO: Messages are encrypted (ciphertext field in DB)
    // Need to implement client-side decryption or server-side mention tracking
    // For now, return empty array until encryption/decryption flow is implemented

    return NextResponse.json({
      success: true,
      mentions: [],
    })
  } catch (error) {
    console.error('Failed to fetch mentions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch mentions' },
      { status: 500 }
    )
  }
}
