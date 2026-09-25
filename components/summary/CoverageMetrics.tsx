"use client";

import { useCoverageStats } from "./hooks";
import { BranchCategory } from "../records/types";
import { useCurrentUser } from "@/lib/hooks/use-current-user";
import { FiInfo } from "react-icons/fi";

export function CoverageMetrics({ year, category }: { year?: string; category: BranchCategory }) {
  const { data: user } = useCurrentUser();
  const { data, isLoading, isError } = useCoverageStats(year, category, user?.allowed_years);

  if (!year) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/50 p-6 flex flex-col items-center justify-center text-center">
        <FiInfo size={24} className="text-gray-400 mb-2" />
        <p className="text-sm font-medium text-gray-900">Select a financial year</p>
        <p className="text-[13px] text-gray-500 mt-1">
          Coverage metrics are calculated per financial year.
        </p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-[13px] text-red-700">
        Failed to load coverage data.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-gray-100 bg-gray-50 p-4 animate-pulse h-[88px]" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <div className="rounded-xl border border-blue-100 bg-blue-50/30 px-4 py-3 sm:px-5 sm:py-4 transition-colors hover:bg-blue-50/50">
          <p className="text-[11px] sm:text-[12px] font-bold text-gray-500 uppercase tracking-widest mb-1 truncate">Branch Universe</p>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900">{data?.universe ?? 0}</p>
        </div>
        
        <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 sm:px-5 sm:py-4 transition-colors hover:bg-gray-50">
          <p className="text-[11px] sm:text-[12px] font-bold text-gray-500 uppercase tracking-widest mb-1 truncate">Submitted Reports</p>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900">{data?.submitted ?? 0}</p>
        </div>

        <div className="rounded-xl border border-orange-100 bg-orange-50/30 px-4 py-3 sm:px-5 sm:py-4 transition-colors hover:bg-orange-50/50">
          <p className="text-[11px] sm:text-[12px] font-bold text-gray-500 uppercase tracking-widest mb-1 truncate">Remaining</p>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900">{data?.remaining ?? 0}</p>
        </div>

        <div className="rounded-xl border border-green-100 bg-green-50/30 px-4 py-3 sm:px-5 sm:py-4 transition-colors hover:bg-green-50/50">
          <p className="text-[11px] sm:text-[12px] font-bold text-gray-500 uppercase tracking-widest mb-1 truncate">Coverage</p>
          <p className="text-2xl sm:text-3xl font-bold text-[#027D3F]">
            {(data?.coverage ?? 0).toFixed(2)}%
          </p>
        </div>
      </div>
      <p className="text-xs text-gray-400 pl-1">
        Coverage = submitted reports ÷ branch universe for the selected financial year.
      </p>
    </div>
  );
}
