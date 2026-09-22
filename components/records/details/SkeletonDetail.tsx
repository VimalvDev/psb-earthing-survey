export function SkeletonDetail() {
  return (
    <div className="min-h-screen bg-[#FAF6EE]">
      <div className="max-w-6xl">
        <div className="flex items-center justify-between mb-6">
          <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
          <div className="flex gap-2">
            <div className="h-8 w-24 bg-gray-200 rounded-xl animate-pulse" />
            <div className="h-8 w-20 bg-gray-200 rounded-xl animate-pulse" />
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="bg-gray-200 h-20 w-full animate-pulse" />
          <div className="h-1 bg-gray-100 w-full" />
          <div className="px-6 sm:px-8 py-7 flex flex-col gap-8">
            {/* Section skeletons */}
            {[6, 4, 4, 6, 3].map((fields, si) => (
              <div key={si}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-3 w-28 bg-gray-100 rounded animate-pulse" />
                  <div className="flex-1 h-px bg-gray-100" />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4">
                  {Array.from({ length: fields }).map((_, i) => (
                    <div key={i} className="flex flex-col gap-1.5">
                      <div className="h-2.5 w-16 bg-gray-100 rounded animate-pulse" />
                      <div className="h-4 w-32 bg-gray-100 rounded animate-pulse" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="px-6 sm:px-8 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
            <div className="h-3 w-48 bg-gray-200 rounded animate-pulse" />
            <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
