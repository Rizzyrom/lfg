import { redirect } from 'next/navigation'
import { getUser } from '@/lib/auth'
import AssetDetailClient from './AssetDetailClient'

interface PageProps {
  params: Promise<{ symbol: string }>
  searchParams: Promise<{ source?: string }>
}

export default async function AssetDetailPage({ params, searchParams }: PageProps) {
  const user = await getUser()
  if (!user) {
    redirect('/login')
  }

  const { symbol } = await params
  const { source } = await searchParams

  return (
    <AssetDetailClient
      symbol={decodeURIComponent(symbol)}
      source={source || 'stock'}
    />
  )
}
