"use client"

import { useStateWiseCounts } from "@/components/summary/hooks"
import { useCurrentUser } from "@/lib/hooks/use-current-user"

export function StateWiseSummary({ year }: { year?: string }) {
  const { data: user } = useCurrentUser()
  const { data, isLoading } = useStateWiseCounts(year, user?.allowed_years)

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-gray-100 pb-4 mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">State-wise Coverage</h2>
          <p className="text-[13px] text-gray-500 mt-0.5">Survey count across states and union territories.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="h-10 rounded-xl bg-gray-100 animate-pulse" />
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
                <span className="text-[13px] font-medium text-gray-700 truncate">{state}</span>
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
            <div className="text-[12px] text-gray-400 mt-6 flex flex-col gap-1 border-t border-gray-100 pt-4">
              <p>{data.otherCount} record{data.otherCount === 1 ? "" : "s"} had an unrecognized state value:</p>
              <ul className="list-disc list-inside">
                {data.unrecognizedStates.map((u, idx) => (
                  <li key={idx}>
                    <span className="font-medium text-gray-500">
                      {u.bic} ({u.branchName})
                    </span>{" "}
                    - entered as "{u.state}"
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  )
}