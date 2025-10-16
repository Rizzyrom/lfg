import { redirect } from 'next/navigation'
import { getUser } from '@/lib/auth'
import AppShell from '@/components/AppShell'
import WatchlistRail from '@/components/WatchlistRail'
import RightRail from '@/components/RightRail'
import MobileSwipeContainer from '@/components/MobileSwipeContainer'
import ChatClient from './ChatClient'

export const dynamic = 'force-dynamic'

export default async function ChatPage() {
  const user = await getUser()
  if (!user) redirect('/login')

  return (
    <AppShell
      leftRail={<WatchlistRail />}
      rightRail={<RightRail />}
      leftDrawerTitle="Watchlist"
      rightDrawerTitle="AI Pulse"
      pageTitle={`@${user.username}`}
    >
      <MobileSwipeContainer>
        <div className="h-[calc(100vh-3.5rem)]">
          <ChatClient username={user.username} userId={user.id} />
        </div>
      </MobileSwipeContainer>
    </AppShell>
  )
}
