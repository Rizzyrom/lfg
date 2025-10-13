import { redirect } from 'next/navigation'
import { getUser } from '@/lib/auth'
import AppShell from '@/components/AppShell'
import WatchlistRail from '@/components/WatchlistRail'
import RightRail from '@/components/RightRail'
import FeedClient from './FeedClient'

export default async function FeedPage() {
  const user = await getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <AppShell leftRail={<WatchlistRail />} rightRail={<RightRail />}>
      <FeedClient />
    </AppShell>
  )
}
