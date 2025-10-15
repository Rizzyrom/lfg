import { redirect } from 'next/navigation'
import { getUser } from '@/lib/auth'
import AppShell from '@/components/AppShell'
import TrendingRail from '@/components/TrendingRail'
import RightRail from '@/components/RightRail'
import UnifiedFeed from '@/components/UnifiedFeed'

export const dynamic = 'force-dynamic'

export default async function FeedPage() {
  const user = await getUser()
  if (!user) redirect('/login')

  return (
    <AppShell
      leftRail={<TrendingRail />}
      rightRail={<RightRail />}
      leftDrawerTitle="Top Gainers & Losers"
      rightDrawerTitle="AI Pulse"
    >
      <div className="h-[calc(100vh-3.5rem)] overflow-y-auto p-4">
        <UnifiedFeed />
      </div>
    </AppShell>
  )
}
