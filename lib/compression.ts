/**
 * Response compression middleware for API routes
 */

import { NextResponse } from 'next/server'

/**
 * Compress response data if supported by client
 */
export function compressResponse(data: any, headers?: HeadersInit): NextResponse {
  const response = NextResponse.json(data, { headers })

  // Add cache control headers
  response.headers.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300')

  return response
}

/**
 * Create cached response with appropriate headers
 */
export function cachedResponse(
  data: any,
  maxAge: number = 60,
  staleWhileRevalidate: number = 300
): NextResponse {
  const response = NextResponse.json(data)

  response.headers.set(
    'Cache-Control',
    `public, max-age=${maxAge}, stale-while-revalidate=${staleWhileRevalidate}`
  )
  response.headers.set('CDN-Cache-Control', `max-age=${maxAge}`)
  response.headers.set('Vercel-CDN-Cache-Control', `max-age=${maxAge}`)

  return response
}

/**
 * Create no-cache response
 */
export function noCacheResponse(data: any, status: number = 200): NextResponse {
  const response = NextResponse.json(data, { status })

  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate')

  return response
}
