import { redirect } from 'next/navigation'
import { getUser } from '@/lib/auth'
import ChatLayout from './ChatLayout'

export default async function ChatPage() {
  const user = await getUser()

  if (!user) {
    redirect('/login')
  }

  return <ChatLayout username={user.username} userId={user.id} />
}
