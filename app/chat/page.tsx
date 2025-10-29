import { redirect } from 'next/navigation'
import { getUser } from '@/lib/auth'
import UnifiedMobileLayout from '@/components/UnifiedMobileLayout'

export const dynamic = 'force-dynamic'

export default async function ChatPage() {
  const user = await getUser()
  if (!user) redirect('/login')

  return <UnifiedMobileLayout userId={user.id} username={user.username} />
}
