import { redirect } from 'next/navigation'
import { getUser } from '@/lib/auth'
import AppShell from '@/components/AppShell'
import TrendingRail from '@/components/TrendingRail'
import RightRail from '@/components/RightRail'
import MobileSwipeContainer from '@/components/MobileSwipeContainer'
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
      pageTitle="#news"
    >
      <MobileSwipeContainer>
        <div className="h-[calc(100vh-3.5rem)] overflow-y-auto p-4">
          <UnifiedFeed />
        </div>
      </MobileSwipeContainer>
    </AppShell>
  )
}
