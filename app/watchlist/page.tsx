import { redirect } from 'next/navigation'
import { getUser } from '@/lib/auth'
import UnifiedMobileLayout from '@/components/UnifiedMobileLayout'

export default async function WatchlistPage() {
  const user = await getUser()

  if (!user) {
    redirect('/login')
  }

  return <UnifiedMobileLayout userId={user.id} username={user.username} />
}
