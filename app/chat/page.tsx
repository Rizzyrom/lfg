import { redirect } from 'next/navigation'
import { getUser } from '@/lib/auth'
import AppShell from '@/components/AppShell'
import WatchlistRail from '@/components/WatchlistRail'
import RightRail from '@/components/RightRail'
import ChatClient from './ChatClient'

export default async function ChatPage() {
  const user = await getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <AppShell leftRail={<WatchlistRail />} rightRail={<RightRail />}>
      <ChatClient username={user.username} />
    </AppShell>
  )
}
