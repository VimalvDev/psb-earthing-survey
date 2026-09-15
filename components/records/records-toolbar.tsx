"use client"

import { FiSearch, FiFilter, FiChevronDown, FiX, FiDownload } from "react-icons/fi"
import { Filters } from "./types"

interface RecordsToolbarProps {
  localSearch: string
  filters: Filters
  setFilter: <K extends keyof Filters>(key: K, value: Filters[K]) => void
  activeSecondaryCount: number
  totalCount: number
  years: string[]
  states: string[]
  districts: string[]
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
  states,
  districts,
  onOpenFilters,
  isPending,
}: RecordsToolbarProps) {
  return (
    <div className="sticky top-0 z-40 -mx-4 mb-2 bg-white/95 px-4 pb-3 pt-2 backdrop-blur-xl border-b border-gray-100 sm:static sm:mx-0 sm:bg-transparent sm:px-0 sm:pb-0 sm:pt-0 sm:backdrop-blur-none sm:border-none">
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        {/* Search */}
        <div className="relative w-full sm:max-w-md flex-1">
          <FiSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={localSearch}
            onChange={(e) => setFilter("search", e.target.value)}
            type="search"
            placeholder="Search branch, code, district…"
            className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-8 text-[13px] text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-[#027D3F] focus:ring-1 focus:ring-[#027D3F] [&::-webkit-search-cancel-button]:appearance-none"
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

        {/* Actions Row */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-end">
          {/* Mobile Record Count (hidden on sm up, replaces the one in page.tsx) */}
          <div className="sm:hidden text-xs text-gray-400 font-medium">
            <span className="font-bold text-gray-700">{totalCount}</span> records
          </div>

          <div className="flex items-center gap-2.5">
            {/* Desktop Record Count */}
            <div className="hidden sm:block text-[13px] text-gray-500 font-medium mr-1">
              <span className="font-bold text-gray-800">{totalCount}</span> records
            </div>

            <button
              type="button"
              onClick={onOpenFilters}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-[13px] font-semibold text-gray-700 transition hover:bg-gray-50 outline-none focus-visible:ring-2 focus-visible:ring-[#027D3F]"
            >
              <FiFilter size={14} />
              <span className="hidden sm:inline">Filters</span>
              {activeSecondaryCount > 0 && (
                <span className="rounded bg-[#027D3F] px-1.5 py-0.5 text-[10px] text-white font-bold leading-none">
                  {activeSecondaryCount}
                </span>
              )}
            </button>

            <div className="relative">
              <select
                value={filters.sortBy}
                onChange={(e) => setFilter("sortBy", e.target.value as any)}
                className="appearance-none rounded-lg border border-gray-200 bg-white py-2 pl-3 pr-8 text-[13px] font-semibold text-gray-700 outline-none transition focus:border-[#027D3F] focus:ring-1 focus:ring-[#027D3F]"
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="branch">Branch Code A–Z</option>

              </select>
              <FiChevronDown size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile-only primary filters (Financial Year & State) */}
      <div className="mt-3 flex sm:hidden items-center gap-2">
        <div className="relative flex-1">
          <select
            value={filters.year}
            onChange={(e) => setFilter("year", e.target.value)}
            className="w-full appearance-none rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-3 pr-8 text-[13px] font-semibold text-gray-700 outline-none transition focus:border-[#027D3F] focus:bg-white focus:ring-1 focus:ring-[#027D3F]"
          >
            <option value="">All financial years</option>
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <FiChevronDown size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
        </div>

        <div className="relative flex-1">
          <select
            value={filters.state}
            onChange={(e) => setFilter("state", e.target.value)}
            className="w-full appearance-none rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-3 pr-8 text-[13px] font-semibold text-gray-700 outline-none transition focus:border-[#027D3F] focus:bg-white focus:ring-1 focus:ring-[#027D3F]"
          >
            <option value="">All states</option>
            {states.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <FiChevronDown size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
        </div>
      </div>
    </div>
  )
}
