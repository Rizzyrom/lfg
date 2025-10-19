import { redirect } from 'next/navigation'
import { getUser } from '@/lib/auth'
import AppShell from '@/components/AppShell'
import TrendingRail from '@/components/TrendingRail'
import RightRail from '@/components/RightRail'
import MobileSwipeContainer from '@/components/MobileSwipeContainer'
import FeedLayout from './FeedLayout'

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
      pageTitle="# NEWS"
    >
      <MobileSwipeContainer>
        <FeedLayout />
      </MobileSwipeContainer>
    </AppShell>
  )
}
