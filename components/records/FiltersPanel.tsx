"use client"

import { FiRefreshCw, FiSearch, FiSliders, FiChevronDown, FiX } from "react-icons/fi"
import { Filters, StatusFilter, getActiveFilterCount } from "./types"

interface FiltersPanelProps {
  filters: Filters
  setFilter: <K extends keyof Filters>(key: K, value: Filters[K]) => void
  clearFilters: () => void
  states: string[]
  zones: string[]
  compact?: boolean
}

export function FiltersPanel({
  filters,
  setFilter,
  clearFilters,
  states,
  zones,
  compact = false,
}: FiltersPanelProps) {
  const activeCount = getActiveFilterCount(filters)

  const inner = (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 border-b border-gray-100 pb-4">
        <div>
          <div className="flex items-center gap-2 text-[#027D3F]">
            <FiSliders size={14} />
            <p className="text-xs font-bold uppercase tracking-widest">Filters</p>
          </div>
          <p className="mt-0.5 text-xs text-gray-400">Refine visible records</p>
        </div>
        {activeCount > 0 && (
          <span className="rounded bg-[#E8F5EE] px-2 py-1 text-[11px] font-bold text-[#027D3F]">
            {activeCount} active
          </span>
        )}
      </div>

      {/* Search */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-gray-500">Search</label>
        <div className="relative">
          <FiSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={filters.search}
            onChange={(e) => setFilter("search", e.target.value)}
            type="search"
            placeholder="Branch, code, district…"
            className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-9 pr-3 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-[#027D3F] focus:bg-white focus:ring-2 focus:ring-[#027D3F]/15"
          />
        </div>
      </div>

      {/* Status */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold text-gray-500">Status</label>
        <div className="grid grid-cols-4 gap-1.5 lg:grid-cols-2 xl:grid-cols-4">
          {(["All", "Pass", "Partial", "Fail"] as StatusFilter[]).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setFilter("status", s)}
              className={`rounded-lg border px-2 py-2 text-xs font-bold transition
                ${filters.status === s
                  ? "border-gray-900 bg-gray-900 text-white"
                  : "border-gray-200 bg-white text-gray-600 hover:border-[#027D3F] hover:text-[#027D3F]"
                }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* State */}
      <SelectField
        label="State"
        value={filters.state}
        onChange={(v) => setFilter("state", v)}
        options={states}
        emptyLabel="All states"
      />

      {/* Zone */}
      <SelectField
        label="Zone"
        value={filters.zone}
        onChange={(v) => setFilter("zone", v)}
        options={zones}
        emptyLabel="All zones"
      />

      {/* Date range */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold text-gray-500">Visit date</label>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col gap-1">
            <span className="text-[11px] text-gray-400">From</span>
            <input
              value={filters.dateFrom}
              onChange={(e) => setFilter("dateFrom", e.target.value)}
              type="date"
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-2 py-2 text-xs text-gray-800 outline-none transition focus:border-[#027D3F] focus:bg-white focus:ring-2 focus:ring-[#027D3F]/15"
            />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[11px] text-gray-400">To</span>
            <input
              value={filters.dateTo}
              onChange={(e) => setFilter("dateTo", e.target.value)}
              type="date"
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-2 py-2 text-xs text-gray-800 outline-none transition focus:border-[#027D3F] focus:bg-white focus:ring-2 focus:ring-[#027D3F]/15"
            />
          </div>
        </div>
      </div>

      {/* Clear */}
      <button
        type="button"
        onClick={clearFilters}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-600 transition hover:border-[#027D3F] hover:text-[#027D3F]"
      >
        <FiRefreshCw size={14} />
        Clear filters
      </button>
    </div>
  )

  if (compact) return inner

  return (
    <div className="sticky top-6 flex max-h-[calc(100dvh-6rem)] flex-col overflow-y-auto rounded-xl border border-gray-100 bg-white p-5">
      {inner}
    </div>
  )
}

function SelectField({
  label,
  value,
  onChange,
  options,
  emptyLabel,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: string[]
  emptyLabel: string
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-gray-500">{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 pr-8 text-sm text-gray-800 outline-none transition focus:border-[#027D3F] focus:bg-white focus:ring-2 focus:ring-[#027D3F]/15"
        >
          <option value="">{emptyLabel}</option>
          {options.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
        <FiChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
      </div>
    </div>
  )
}

// ── Active filter chips ────────────────────────────────────────────────────

interface FilterChipsProps {
  filters: Filters
  setFilter: <K extends keyof Filters>(key: K, value: Filters[K]) => void
  clearFilters: () => void
}

export function FilterChips({ filters, setFilter, clearFilters }: FilterChipsProps) {
  const activeCount = getActiveFilterCount(filters)
  if (activeCount === 0) return null

  return (
    <div className="flex flex-wrap items-center gap-2 py-3">
      <span className="text-xs font-semibold text-gray-400">Active:</span>
      {filters.search.trim() && (
        <Chip label={`"${filters.search.trim()}"`} onRemove={() => setFilter("search", "")} />
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
      <button
        type="button"
        onClick={clearFilters}
        className="text-xs font-bold text-[#027D3F] hover:underline"
      >
        Clear all
      </button>
    </div>
  )
}

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs font-semibold text-gray-600">
      {label}
      <button type="button" onClick={onRemove} className="text-gray-400 hover:text-[#E41E23]">
        <FiX size={12} />
      </button>
    </span>
  )
}