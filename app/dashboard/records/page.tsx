"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  FiAlertTriangle, FiCheckCircle, FiChevronDown,
  FiClipboard, FiDownload, FiFileText, FiFilter,
  FiPlus, FiX, FiXCircle,
} from "react-icons/fi"

import { RecordCard } from "@/components/records/RecordCard"
import { FiltersPanel, FilterChips } from "@/components/records/FiltersPanel"
import { Pagination } from "@/components/records/Pagination"
import { useSurveyRecords, useSurveyStats, useFilterOptions } from "@/components/records/hooks"
import {
  SurveyRecord, Filters, SortBy,
  DEFAULT_FILTERS, ITEMS_PER_PAGE,
  getActiveFilterCount,
} from "@/components/records/types"

const SEARCH_DEBOUNCE_MS = 400

// ── CSV export ─────────────────────────────────────────────────────────────

function toCsvCell(value: string) {
  return `"${String(value).replaceAll('"', '""')}"`
}

function exportCsv(records: SurveyRecord[]) {
  const header = [
    "Survey ID", "Branch Code", "Branch Name", "State",
    "District", "Zone", "Visit Date", "Surveyor Emp ID",
    "Overall Status", "Created At",
  ]
  const rows = records.map((r) => [
    r.survey_id, r.bic ?? "", r.branch_name ?? "", r.state ?? "",
    r.district ?? "", r.zone ?? "", r.visit_date ?? "",
    r.surveyor_emp_id ?? "", r.overall_status ?? "",
    r.created_at.slice(0, 10),
  ])
  const csv = [header, ...rows]
    .map((row) => row.map(toCsvCell).join(","))
    .join("\n")
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = `psb-earthing-records-${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

// ── Skeleton ───────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="flex gap-4 rounded-xl border border-gray-100 bg-white p-4 animate-pulse">
      <div className="w-14 h-14 shrink-0 rounded-lg bg-gray-100" />
      <div className="flex-1 flex flex-col gap-2.5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col gap-1.5">
            <div className="h-4 w-48 bg-gray-100 rounded" />
            <div className="h-3 w-20 bg-gray-100 rounded" />
          </div>
          <div className="h-6 w-16 bg-gray-100 rounded-md" />
        </div>
        <div className="flex gap-4 mt-1">
          <div className="h-3 w-32 bg-gray-100 rounded" />
          <div className="h-3 w-24 bg-gray-100 rounded" />
          <div className="h-3 w-20 bg-gray-100 rounded" />
        </div>
      </div>
    </div>
  )
}

function SkeletonList() {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}

function StatSkeleton() {
  return <div className="rounded-xl border border-gray-100 bg-white px-4 py-3 h-[72px] animate-pulse" />
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function RecordsPage() {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS)
  const [debouncedSearch, setDebouncedSearch] = useState(DEFAULT_FILTERS.search)
  const [sortBy, setSortBy] = useState<SortBy>("newest")
  const [currentPage, setCurrentPage] = useState(1)
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(filters.search), SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timeout)
  }, [filters.search])

  const queryFilters = useMemo(
    () => ({ ...filters, search: debouncedSearch }),
    [filters, debouncedSearch]
  )

  useEffect(() => { setCurrentPage(1) }, [queryFilters, sortBy])

  const { data: pageData, isLoading: recordsInitialLoading, isFetching: recordsFetching, isError: recordsError } =
    useSurveyRecords(queryFilters, sortBy, currentPage)
  const { data: statsData, isLoading: statsInitialLoading, isFetching: statsFetching } =
    useSurveyStats(queryFilters)
  const { data: filterOptions } = useFilterOptions()

  const records    = pageData?.records ?? []
  const totalCount = pageData?.totalCount ?? 0
  const passCount    = statsData?.pass ?? 0
  const partialCount = statsData?.partial ?? 0
  const failCount    = statsData?.fail ?? 0
  const allStates = filterOptions?.states ?? []
  const allZones  = filterOptions?.zones ?? []

  const totalPages  = Math.max(1, Math.ceil(totalCount / ITEMS_PER_PAGE))
  const pageStart   = totalCount === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1
  const pageEnd     = Math.min(currentPage * ITEMS_PER_PAGE, totalCount)
  const activeFilterCount = getActiveFilterCount(filters)

  function setFilter<K extends keyof Filters>(key: K, value: Filters[K]) {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  function clearFilters() {
    setFilters(DEFAULT_FILTERS)
    setDebouncedSearch(DEFAULT_FILTERS.search)
    setSortBy("newest")
  }

  return (
    <div className="flex flex-col gap-6">

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Survey Records</h1>
          <p className="text-sm text-gray-500 mt-1">All submitted earthing inspections · PSB Pan-India</p>
        </div>
        <Link
          href="/dashboard/survey"
          className="inline-flex items-center gap-2 rounded-xl bg-[#027D3F] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#02612f] self-start sm:self-auto"
        >
          <FiPlus size={16} />
          New Survey
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {statsInitialLoading ? (
          <><StatSkeleton /><StatSkeleton /><StatSkeleton /><StatSkeleton /></>
        ) : (
          <>
            <div className={`transition-opacity duration-150 ${statsFetching ? "opacity-50" : "opacity-100"}`}>
              <StatCard label="Total" value={totalCount} icon={<FiFileText size={16} className="text-gray-400" />} className="border-gray-100 bg-white" valueClass="text-gray-900" />
            </div>
            <div className={`transition-opacity duration-150 ${statsFetching ? "opacity-50" : "opacity-100"}`}>
              <StatCard label="Pass" value={passCount} icon={<FiCheckCircle size={16} className="text-[#027D3F]" />} className="border-[#B9DEC8] bg-[#E8F5EE]" valueClass="text-[#027D3F]" />
            </div>
            <div className={`transition-opacity duration-150 ${statsFetching ? "opacity-50" : "opacity-100"}`}>
              <StatCard label="Partial" value={partialCount} icon={<FiAlertTriangle size={16} className="text-[#768A06]" />} className="border-[#E7E9A9] bg-[#F6F8D7]" valueClass="text-[#768A06]" />
            </div>
            <div className={`transition-opacity duration-150 ${statsFetching ? "opacity-50" : "opacity-100"}`}>
              <StatCard label="Fail" value={failCount} icon={<FiXCircle size={16} className="text-[#D81F26]" />} className="border-[#F5B9B9] bg-[#FDECEC]" valueClass="text-[#D81F26]" />
            </div>
          </>
        )}
      </div>

      {/* Main layout */}
      <div className="flex gap-6 items-start">

        {/* Sidebar */}
        <aside className="hidden lg:block w-[260px] shrink-0">
          <FiltersPanel
            filters={filters} setFilter={setFilter}
            clearFilters={clearFilters}
            states={allStates} zones={allZones}
          />
        </aside>

        {/* List */}
        <div className="flex-1 min-w-0 flex flex-col gap-4">

          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-2 justify-between">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(true)}
                className="lg:hidden inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-semibold text-gray-700"
              >
                <FiFilter size={14} />
                Filters
                {activeFilterCount > 0 && (
                  <span className="rounded bg-[#027D3F] px-1.5 py-0.5 text-[10px] text-white font-bold">{activeFilterCount}</span>
                )}
              </button>
              <p className="text-sm text-gray-400">
                <span className="font-bold text-gray-700">{totalCount}</span> records
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => exportCsv(records)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-600 transition hover:border-[#027D3F] hover:text-[#027D3F]"
              >
                <FiDownload size={14} />
                Export CSV
              </button>
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortBy)}
                  className="appearance-none rounded-xl border border-gray-200 bg-white py-2 pl-3 pr-8 text-xs font-semibold text-gray-700 outline-none transition focus:border-[#027D3F] focus:ring-2 focus:ring-[#027D3F]/15"
                >
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                  <option value="branch">Branch A–Z</option>
                  <option value="status">Needs review first</option>
                </select>
                <FiChevronDown size={13} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
            </div>
          </div>

          {/* Filter chips */}
          <FilterChips filters={filters} setFilter={setFilter} clearFilters={clearFilters} />

          {/* Records */}
          {recordsError ? (
            <div className="rounded-xl border border-[#F5B9B9] bg-[#FDECEC] px-5 py-4 text-sm text-[#D81F26]">
              Failed to load records. Please refresh.
            </div>
          ) : recordsInitialLoading ? (
            <SkeletonList />
          ) : records.length > 0 ? (
            <div className={`flex flex-col gap-3 transition-opacity duration-150 ${recordsFetching ? "opacity-50" : "opacity-100"}`}>
              {records.map((record) => (
                <RecordCard key={record.id} record={record} />
              ))}
            </div>
          ) : (
            <EmptyState clearFilters={clearFilters} hasFilters={activeFilterCount > 0} />
          )}

          {/* Pagination */}
          {!recordsInitialLoading && totalCount > ITEMS_PER_PAGE && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              pageStart={pageStart}
              pageEnd={pageEnd}
              totalRecords={totalCount}
              onPrevious={() => setCurrentPage((p) => Math.max(1, p - 1))}
              onNext={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            />
          )}
        </div>
      </div>

      {/* Mobile filters drawer */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" aria-label="Close" className="absolute inset-0 bg-black/40" onClick={() => setMobileFiltersOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 max-h-[88dvh] overflow-y-auto rounded-t-2xl bg-white p-5">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-base font-bold text-gray-900">Filters</p>
                <p className="text-xs text-gray-400">Applied instantly</p>
              </div>
              <button type="button" onClick={() => setMobileFiltersOpen(false)} className="rounded-lg border border-gray-200 p-2 text-gray-500">
                <FiX size={16} />
              </button>
            </div>
            <FiltersPanel compact filters={filters} setFilter={setFilter} clearFilters={clearFilters} states={allStates} zones={allZones} />
          </div>
        </div>
      )}
    </div>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────

function StatCard({ label, value, icon, className, valueClass }: {
  label: string; value: number; icon: React.ReactNode; className: string; valueClass: string
}) {
  return (
    <div className={`rounded-xl border px-4 py-3 ${className}`}>
      <div className="flex items-center gap-1.5 mb-1">
        {icon}
        <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">{label}</p>
      </div>
      <p className={`text-2xl font-bold ${valueClass}`}>{value}</p>
    </div>
  )
}

function EmptyState({ clearFilters, hasFilters }: { clearFilters: () => void; hasFilters: boolean }) {
  return (
    <div className="flex min-h-[280px] flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-white p-8 text-center">
      <FiClipboard size={36} className="text-gray-200" />
      <p className="mt-4 text-base font-bold text-gray-800">
        {hasFilters ? "No records match these filters" : "No survey records yet"}
      </p>
      <p className="mt-1 max-w-sm text-sm text-gray-400">
        {hasFilters ? "Try adjusting your filters or search query." : "Submit your first earthing survey to see it here."}
      </p>
      {hasFilters && (
        <button type="button" onClick={clearFilters} className="mt-5 rounded-xl bg-[#027D3F] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#02612f]">
          Clear filters
        </button>
      )}
    </div>
  )
}