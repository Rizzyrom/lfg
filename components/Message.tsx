'use client'

interface MessageProps {
  username: string
  ciphertext: string
  timestamp: string
  isOwn: boolean
}

export default function Message({ username, ciphertext, timestamp, isOwn }: MessageProps) {
  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-3`}>
      <div className={`max-w-[70%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
        <div className="text-xs text-tv-text-soft mb-1">{username}</div>
        <div
          className={`px-4 py-2 rounded-xl ${
            isOwn ? 'bg-tv-blue text-white' : 'bg-tv-chip text-tv-text'
          }`}
        >
          <p className="text-sm break-words">{ciphertext}</p>
        </div>
        <div className="text-[10px] text-tv-text-soft mt-1">
          {new Date(timestamp).toLocaleTimeString()}
        </div>
      </div>
    </div>
  )
}
