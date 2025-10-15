export default function MessageSkeleton({ isOwn = false }: { isOwn?: boolean }) {
  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-3 animate-pulse`}>
      <div className={`max-w-[70%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
        {/* Username skeleton */}
        <div className="h-3 w-20 bg-gray-700/50 rounded mb-1" />

        {/* Message bubble skeleton */}
        <div className={`px-4 py-2 rounded-xl ${
          isOwn ? 'bg-[#5865F2]/20' : 'bg-gray-700/30'
        }`}>
          <div className="space-y-2">
            <div className="h-4 w-48 bg-gray-600/50 rounded" />
            <div className="h-4 w-32 bg-gray-600/50 rounded" />
          </div>
        </div>

        {/* Timestamp skeleton */}
        <div className="h-2 w-16 bg-gray-700/50 rounded mt-1" />
      </div>
    </div>
  )
}
