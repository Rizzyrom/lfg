import { redirect } from 'next/navigation'
import { getUser } from '@/lib/auth'
import ChatClient from './ChatClient'

export default async function ChatPage() {
  const user = await getUser()

  if (!user) {
    redirect('/login')
  }

  return <ChatClient username={user.username} userId={user.id} />
}
