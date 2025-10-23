import { redirect } from 'next/navigation'
import { getUser } from '@/lib/auth'
import AppShell from '@/components/AppShell'
import WatchlistRail from '@/components/WatchlistRail'
import RightRail from '@/components/RightRail'
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
  const assetSource = (source === 'crypto' ? 'crypto' : 'stock') as 'crypto' | 'stock'

  return (
    <AppShell
      leftRail={<WatchlistRail />}
      rightRail={<RightRail />}
      leftDrawerTitle="Watchlist"
      rightDrawerTitle="AI Pulse"
    >
      <AssetDetailClient
        symbol={decodeURIComponent(symbol)}
        source={assetSource}
      />
    </AppShell>
  )
}
