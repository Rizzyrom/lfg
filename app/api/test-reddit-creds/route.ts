import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    hasClientId: !!process.env.REDDIT_CLIENT_ID,
    hasClientSecret: !!process.env.REDDIT_CLIENT_SECRET,
    clientIdLength: process.env.REDDIT_CLIENT_ID?.length || 0,
    secretLength: process.env.REDDIT_CLIENT_SECRET?.length || 0,
  })
}
