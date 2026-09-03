"use client"

import { FiSearch, FiFilter, FiChevronDown, FiX } from "react-icons/fi"
import { Filters } from "./types"

interface RecordsToolbarProps {
  localSearch: string
  filters: Filters
  setFilter: <K extends keyof Filters>(key: K, value: Filters[K]) => void
  activeSecondaryCount: number
  totalCount: number
  years: string[]
  onOpenFilters: () => void
  isPending: boolean
}

export function RecordsToolbar({
  localSearch,
  filters,
  setFilter,
  activeSecondaryCount,
  totalCount,
  years,
  onOpenFilters,
  isPending,
}: RecordsToolbarProps) {
  return (
    <div className="sticky top-0 z-40 -mx-4 mb-4 bg-white/95 px-4 pb-3 pt-2 backdrop-blur-xl border-b border-gray-100 lg:hidden">
      <div className="flex flex-col gap-2.5">
        {/* Search */}
        <div className="relative">
          <FiSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={localSearch}
            onChange={(e) => setFilter("search", e.target.value)}
            type="search"
            placeholder="Branch, code, district…"
            className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-9 pr-8 text-fluid-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-[#027D3F] focus:bg-white focus:ring-2 focus:ring-[#027D3F]/15 [&::-webkit-search-cancel-button]:appearance-none"
          />
          {localSearch && (
            <button
              type="button"
              onClick={() => setFilter("search", "")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 rounded outline-none focus-visible:ring-2 focus-visible:ring-[#027D3F]"
            >
              <FiX size={14} />
            </button>
          )}
        </div>

        {/* Filters Row */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <select
              value={filters.year}
              onChange={(e) => setFilter("year", e.target.value)}
              className="w-full appearance-none rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-3 pr-8 text-fluid-sm font-semibold text-gray-700 outline-none transition focus:border-[#027D3F] focus:bg-white focus:ring-2 focus:ring-[#027D3F]/15"
            >
              <option value="">All financial years</option>
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <FiChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>

          <button
            type="button"
            onClick={onOpenFilters}
            aria-expanded="false"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-fluid-sm font-semibold text-gray-700 transition hover:bg-gray-50 outline-none focus-visible:ring-2 focus-visible:ring-[#027D3F]"
          >
            <FiFilter size={14} />
            <span className="hidden sm:inline">More</span>
            {activeSecondaryCount > 0 && (
              <span className="rounded bg-[#027D3F] px-1.5 py-0.5 text-[10px] text-white font-bold">
                {activeSecondaryCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
