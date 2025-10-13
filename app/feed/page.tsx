import { redirect } from 'next/navigation'
import { getUser } from '@/lib/auth'
import AppShell from '@/components/AppShell'
import TrendingRail from '@/components/TrendingRail'
import RightRail from '@/components/RightRail'
import FeedClient from './FeedClient'

export default async function FeedPage() {
  const user = await getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <AppShell leftRail={<TrendingRail />} rightRail={<RightRail />}>
      <FeedClient />
    </AppShell>
  )
}
