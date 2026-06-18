"use client"

import { FiMapPin } from "react-icons/fi"
import { useZoneWiseCounts } from "./hooks"

function ActiveZoneRow({ zone, count, rank }: { zone: string; count: number; rank: number }) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-50 text-[11px] font-bold text-gray-400">
        {rank}
      </span>
      <span className="flex-1 text-sm font-medium text-gray-800 truncate">{zone}</span>
      <span className="text-sm font-bold text-[#EF9447]">{count}</span>
    </div>
  )
}

function ZoneWiseSkeleton() {
  return (
    <div className="flex flex-col gap-3 animate-pulse">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 py-1">
          <div className="h-6 w-6 rounded-full bg-gray-100" />
          <div className="h-3.5 flex-1 max-w-[140px] bg-gray-100 rounded" />
          <div className="h-3.5 w-6 bg-gray-100 rounded" />
        </div>
      ))}
    </div>
  )
}

export function ZoneWiseSummary() {
  const { data, isLoading, isError } = useZoneWiseCounts()

  const breakdown = data?.breakdown ?? []
  const otherCount = data?.otherCount ?? 0

  const activeZones = breakdown.filter((b) => b.count > 0)
  const pendingZones = breakdown
    .filter((b) => b.count === 0)
    .sort((a, b) => a.zone.localeCompare(b.zone))

  return (
    <div className="rounded-3xl border border-gray-100 bg-white p-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between mb-1">
        <div className="flex items-center gap-2">
          <FiMapPin size={16} className="text-[#EF9447]" />
          <h2 className="text-lg font-semibold text-gray-900">Zone-wise Surveys</h2>
        </div>
        {!isLoading && !isError && (
          <span className="text-xs text-gray-400">{activeZones.length} of {breakdown.length} zones covered</span>
        )}
      </div>
      <p className="text-sm text-gray-500 mb-5">Number of surveys submitted per zone.</p>

      {isError ? (
        <div className="rounded-2xl border border-[#F5B9B9] bg-[#FDECEC] px-5 py-4 text-sm text-[#D81F26]">
          Failed to load zone-wise data. Please refresh the page.
        </div>
      ) : isLoading ? (
        <ZoneWiseSkeleton />
      ) : (
        <>
          {activeZones.length > 0 ? (
            <div className="flex flex-col">
              {activeZones.map((z, i) => (
                <ActiveZoneRow key={z.zone} zone={z.zone} count={z.count} rank={i + 1} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">No surveys submitted yet.</p>
          )}

          {pendingZones.length > 0 && (
            <div className="mt-5 pt-5 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                Not yet surveyed
              </p>
              <div className="flex flex-wrap gap-2">
                {pendingZones.map((z) => (
                  <span
                    key={z.zone}
                    className="text-xs font-medium text-gray-400 bg-gray-50 rounded-full px-3 py-1.5"
                  >
                    {z.zone}
                  </span>
                ))}
              </div>
            </div>
          )}

          {otherCount > 0 && (
            <p className="mt-4 text-xs text-gray-400">
              {otherCount} survey{otherCount === 1 ? "" : "s"} recorded against a zone outside this list.
            </p>
          )}
        </>
      )}
    </div>
  )
}