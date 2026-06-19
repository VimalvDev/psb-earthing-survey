"use client"

import { useStateWiseCounts } from "@/components/summary/hooks"

export function StateWiseSummary() {
  const { data, isLoading } = useStateWiseCounts()

  return (
    <div className="rounded-3xl border border-gray-100 bg-white p-6">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-gray-900">State-wise Coverage</h2>
        <p className="text-sm text-gray-500">Survey count across all states and union territories.</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="h-12 rounded-xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
            {data?.breakdown.map(({ state, count }) => (
              <div
                key={state}
                className="flex items-center justify-between gap-2 rounded-xl border border-gray-100 bg-gray-50 px-3.5 py-2.5"
              >
                <span className="text-sm text-gray-700 truncate">{state}</span>
                <span
                  className={`shrink-0 text-xs font-bold rounded-full px-2 py-0.5 ${
                    count > 0 ? "bg-[#EF9447]/15 text-[#EF9447]" : "bg-gray-200 text-gray-400"
                  }`}
                >
                  {count}
                </span>
              </div>
            ))}
          </div>

          {data && data.otherCount > 0 && (
            <p className="text-xs text-gray-400 mt-3">
              {data.otherCount} record{data.otherCount === 1 ? "" : "s"} had an unrecognized state value.
            </p>
          )}
        </>
      )}
    </div>
  )
}