'use client'

import AppShell from './AppShell'
import DataPrefetchProvider from './DataPrefetchProvider'
import ChatClient from '@/app/chat/ChatClient'

interface UnifiedMobileLayoutProps {
  userId: string
  username: string
}

/**
 * Simplified layout - just chat
 */
export default function UnifiedMobileLayout({ userId, username }: UnifiedMobileLayoutProps) {
  return (
    <DataPrefetchProvider>
      <AppShell pageTitle="LFG">
        <div className="h-full flex flex-col">
          <ChatClient userId={userId} username={username} />
        </div>
      </AppShell>
    </DataPrefetchProvider>
  )
}
