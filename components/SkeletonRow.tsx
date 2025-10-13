export default function SkeletonRow() {
  return (
    <div className="card p-4 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="h-5 bg-tv-grid rounded w-24 mb-2"></div>
          <div className="h-8 bg-tv-grid rounded w-32"></div>
        </div>
        <div className="h-6 bg-tv-grid rounded w-16"></div>
      </div>
      <div className="mt-3 h-3 bg-tv-grid rounded w-40"></div>
    </div>
  )
}
