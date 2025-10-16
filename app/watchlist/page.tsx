import { redirect } from 'next/navigation'
import { getUser } from '@/lib/auth'
import AppShell from '@/components/AppShell'
import WatchlistRail from '@/components/WatchlistRail'
import RightRail from '@/components/RightRail'
import MobileSwipeContainer from '@/components/MobileSwipeContainer'
import WatchlistClient from './WatchlistClient'

export default async function WatchlistPage() {
  const user = await getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <AppShell
      leftRail={<WatchlistRail />}
      rightRail={<RightRail />}
      leftDrawerTitle="Watchlist"
      rightDrawerTitle="AI Pulse"
      pageTitle="$ assets"
    >
      <MobileSwipeContainer>
        <WatchlistClient />
      </MobileSwipeContainer>
    </AppShell>
  )
}
