"use client"

import { FiX } from "react-icons/fi"
import { Filters } from "./types"

interface ActiveFilterChipsProps {
  filters: Filters
  setFilter: <K extends keyof Filters>(key: K, value: Filters[K]) => void
  clearFilters: () => void
  totalActiveCount: number
}

export function ActiveFilterChips({ filters, setFilter, clearFilters, totalActiveCount }: ActiveFilterChipsProps) {
  if (totalActiveCount === 0) return null

  return (
    <div className="flex w-full overflow-x-auto pb-2 scrollbar-hide">
      <div className="flex items-center gap-2 whitespace-nowrap">
        <span className="text-fluid-xs font-semibold text-gray-400">Active:</span>
        
        {filters.search.trim() && (
          <Chip label={`"${filters.search.trim()}"`} onRemove={() => setFilter("search", "")} />
        )}
        {filters.year && (
          <Chip label={`FY: ${filters.year}`} onRemove={() => setFilter("year", "")} />
        )}
        {filters.status !== "All" && (
          <Chip label={`Status: ${filters.status}`} onRemove={() => setFilter("status", "All")} />
        )}
        {filters.state && (
          <Chip label={`State: ${filters.state}`} onRemove={() => setFilter("state", "")} />
        )}
        {filters.zone && (
          <Chip label={`Zone: ${filters.zone}`} onRemove={() => setFilter("zone", "")} />
        )}
        {filters.dateFrom && (
          <Chip label={`From: ${filters.dateFrom}`} onRemove={() => setFilter("dateFrom", "")} />
        )}
        {filters.dateTo && (
          <Chip label={`To: ${filters.dateTo}`} onRemove={() => setFilter("dateTo", "")} />
        )}
        {filters.pnMin && (
          <Chip label={`PN Min: ${filters.pnMin}`} onRemove={() => setFilter("pnMin", "")} />
        )}
        {filters.pnMax && (
          <Chip label={`PN Max: ${filters.pnMax}`} onRemove={() => setFilter("pnMax", "")} />
        )}
        {filters.peMin && (
          <Chip label={`PE Min: ${filters.peMin}`} onRemove={() => setFilter("peMin", "")} />
        )}
        {filters.peMax && (
          <Chip label={`PE Max: ${filters.peMax}`} onRemove={() => setFilter("peMax", "")} />
        )}
        
        <button
          type="button"
          onClick={clearFilters}
          className="text-fluid-xs font-bold text-[#027D3F] hover:underline px-1 shrink-0"
        >
          Clear all
        </button>
      </div>
    </div>
  )
}

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2 py-1 text-fluid-xs font-semibold text-gray-600 transition hover:border-gray-300">
      {label}
      <button 
        type="button" 
        onClick={onRemove} 
        className="text-gray-400 hover:text-[#E41E23] rounded outline-none focus-visible:ring-2 focus-visible:ring-[#027D3F]/40"
        aria-label={`Remove ${label} filter`}
      >
        <FiX size={12} />
      </button>
    </span>
  )
}
