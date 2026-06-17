"use client"

import { useEffect, useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import Link from "next/link"
import {
  FiAlertTriangle, FiCheckCircle, FiChevronDown,
  FiClipboard, FiDownload, FiFileText, FiFilter,
  FiPlus, FiX, FiXCircle,
} from "react-icons/fi"
import { createClient } from "@/lib/supabase/client"

import { RecordCard } from "@/components/records/RecordCard"
import { FiltersPanel, FilterChips } from "@/components/records/FiltersPanel"
import { Pagination } from "@/components/records/Pagination"
import {
  SurveyRecord, Filters, SortBy,
  DEFAULT_FILTERS, ITEMS_PER_PAGE,
  getActiveFilterCount,
} from "@/components/records/types"

// ── CSV export ─────────────────────────────────────────────────────────────

function toCsvCell(value: string) {
  return `"${String(value).replaceAll('"', '""')}"`
}

function exportCsv(records: SurveyRecord[]) {
  const header = ["Survey ID", "Branch Code", "Branch Name", "State", "District", "Zone", "Visit Date", "Surveyor Emp ID", "Overall Status", "Created At"]
  const rows = records.map((r) => [r.survey_id, r.bic ?? "", r.branch_name ?? "", r.state ?? "", r.district ?? "", r.zone ?? "", r.visit_date ?? "", r.surveyor_emp_id ?? "", r.overall_status ?? "", r.created_at.slice(0, 10)])
  const csv = [header, ...rows].map((row) => row.map(toCsvCell).join(",")).join("\n")
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = `psb-earthing-records-${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

// ── Supabase fetchers ──────────────────────────────────────────────────────

const supabase = createClient()

async function fetchPage(filters: Filters, sortBy: SortBy, page: number) {
  let q = supabase
    .from("surveys")
    .select("id, survey_id, bic, branch_name, state, district, zone, visit_date, surveyor_emp_id, surveyor_email, overall_status, readings, site_photo, created_at", { count: "exact" })

  const search = filters.search.trim()
  if (search) q = q.or(`branch_name.ilike.%${search}%,bic.ilike.%${search}%,district.ilike.%${search}%,state.ilike.%${search}%,surveyor_emp_id.ilike.%${search}%`)
  if (filters.status !== "All") q = q.eq("overall_status", filters.status)
  if (filters.state) q = q.eq("state", filters.state)
  if (filters.zone)  q = q.eq("zone", filters.zone)
  if (filters.dateFrom) q = q.gte("visit_date", filters.dateFrom)
  if (filters.dateTo)   q = q.lte("visit_date", filters.dateTo)

  if (sortBy === "newest") q = q.order("created_at", { ascending: false })
  if (sortBy === "oldest") q = q.order("created_at", { ascending: true })
  if (sortBy === "branch") q = q.order("branch_name", { ascending: true })
  if (sortBy === "status") q = q.order("overall_status", { ascending: true })

  const from = (page - 1) * ITEMS_PER_PAGE
  const { data, error, count } = await q.range(from, from + ITEMS_PER_PAGE - 1)
  if (error) throw error
  return { records: (data as SurveyRecord[]) ?? [], total: count ?? 0 }
}

async function fetchStats(filters: Filters) {
  const applyFilters = (q: any) => {
    const search = filters.search.trim()
    if (search) q = q.or(`branch_name.ilike.%${search}%,bic.ilike.%${search}%,district.ilike.%${search}%,state.ilike.%${search}%`)
    if (filters.state) q = q.eq("state", filters.state)
    if (filters.zone)  q = q.eq("zone", filters.zone)
    if (filters.dateFrom) q = q.gte("visit_date", filters.dateFrom)
    if (filters.dateTo)   q = q.lte("visit_date", filters.dateTo)
    return q
  }
  const [p, pa, f] = await Promise.all([
    applyFilters(supabase.from("surveys").select("*", { count: "exact", head: true }).eq("overall_status", "Pass")),
    applyFilters(supabase.from("surveys").select("*", { count: "exact", head: true }).eq("overall_status", "Partial")),
    applyFilters(supabase.from("surveys").select("*", { count: "exact", head: true }).eq("overall_status", "Fail")),
  ])
  return { pass: p.count ?? 0, partial: pa.count ?? 0, fail: f.count ?? 0 }
}

async function fetchSurveyDetail(surveyId: string) {
  const { data, error } = await supabase.from("surveys").select("*").eq("survey_id", surveyId).single()
  if (error) throw error
  return data
}

async function fetchFilterOptions() {
  const { data } = await supabase.from("surveys").select("state, zone")
  if (!data) return { states: [], zones: [] }
  return {
    states: [...new Set(data.map((r) => r.state).filter(Boolean))].sort() as string[],
    zones:  [...new Set(data.map((r) => r.zone).filter(Boolean))].sort() as string[],
  }
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

function StatSkeleton() {
  return <div className="rounded-xl border border-gray-100 bg-white px-4 py-3 h-[72px] animate-pulse" />
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function RecordsPage() {
  const queryClient = useQueryClient()

  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS)
  const [sortBy, setSortBy] = useState<SortBy>("newest")
  const [currentPage, setCurrentPage] = useState(1)
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

  // ── Queries ────────────────────────────────────────────────────────────
  const pageKey = ["records", filters, sortBy, currentPage]

  const { data: pageData, isLoading, isError } = useQuery({
    queryKey: pageKey,
    queryFn: () => fetchPage(filters, sortBy, currentPage),
  })

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["record-stats", filters],
    queryFn: () => fetchStats(filters),
  })

  const { data: filterOptions } = useQuery({
    queryKey: ["filter-options"],
    queryFn: fetchFilterOptions,
    staleTime: 5 * 60 * 1000,
  })

  // ── Prefetch next page ─────────────────────────────────────────────────
  useEffect(() => {
    const total = pageData?.total ?? 0
    const totalPages = Math.ceil(total / ITEMS_PER_PAGE)
    if (currentPage < totalPages) {
      queryClient.prefetchQuery({
        queryKey: ["records", filters, sortBy, currentPage + 1],
        queryFn: () => fetchPage(filters, sortBy, currentPage + 1),
      })
    }
  }, [pageData, currentPage, filters, sortBy])

  // ── Prefetch detail pages for visible records ──────────────────────────
  useEffect(() => {
    if (!pageData?.records) return
    pageData.records.forEach((record) => {
      queryClient.prefetchQuery({
        queryKey: ["survey-detail", record.survey_id],
        queryFn: () => fetchSurveyDetail(record.survey_id),
        staleTime: 2 * 60 * 1000,
      })
    })
  }, [pageData?.records])

  // ── Reset page on filter/sort change ──────────────────────────────────
  useEffect(() => { setCurrentPage(1) }, [filters, sortBy])

  // ── Derived ────────────────────────────────────────────────────────────
  const records    = pageData?.records ?? []
  const totalCount = pageData?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / ITEMS_PER_PAGE))
  const pageStart  = totalCount === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1
  const pageEnd    = Math.min(currentPage * ITEMS_PER_PAGE, totalCount)
  const activeFilterCount = getActiveFilterCount(filters)

  function setFilter<K extends keyof Filters>(key: K, value: Filters[K]) {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  function clearFilters() {
    setFilters(DEFAULT_FILTERS)
    setSortBy("newest")
  }

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-6">

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Survey Records</h1>
          <p className="text-sm text-gray-500 mt-1">All submitted earthing inspections · PSB Pan-India</p>
        </div>
        <Link href="/dashboard/survey" className="inline-flex items-center gap-2 rounded-xl bg-[#027D3F] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#02612f] self-start sm:self-auto">
          <FiPlus size={16} />
          New Survey
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {statsLoading ? (
          <><StatSkeleton /><StatSkeleton /><StatSkeleton /><StatSkeleton /></>
        ) : (
          <>
            <StatCard label="Total"   value={totalCount}          icon={<FiFileText size={16} className="text-gray-400" />}       className="border-gray-100 bg-white"       valueClass="text-gray-900" />
            <StatCard label="Pass"    value={stats?.pass ?? 0}    icon={<FiCheckCircle size={16} className="text-[#027D3F]" />}   className="border-[#B9DEC8] bg-[#E8F5EE]" valueClass="text-[#027D3F]" />
            <StatCard label="Partial" value={stats?.partial ?? 0} icon={<FiAlertTriangle size={16} className="text-[#768A06]" />} className="border-[#E7E9A9] bg-[#F6F8D7]" valueClass="text-[#768A06]" />
            <StatCard label="Fail"    value={stats?.fail ?? 0}    icon={<FiXCircle size={16} className="text-[#D81F26]" />}       className="border-[#F5B9B9] bg-[#FDECEC]" valueClass="text-[#D81F26]" />
          </>
        )}
      </div>

      {/* Main layout */}
      <div className="flex gap-6 items-start">

        {/* Sidebar */}
        <aside className="hidden lg:block w-[260px] shrink-0">
          <FiltersPanel
            filters={filters} setFilter={setFilter} clearFilters={clearFilters}
            states={filterOptions?.states ?? []} zones={filterOptions?.zones ?? []}
          />
        </aside>

        {/* List */}
        <div className="flex-1 min-w-0 flex flex-col gap-4">

          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-2 justify-between">
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setMobileFiltersOpen(true)} className="lg:hidden inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-semibold text-gray-700">
                <FiFilter size={14} />
                Filters
                {activeFilterCount > 0 && <span className="rounded bg-[#027D3F] px-1.5 py-0.5 text-[10px] text-white font-bold">{activeFilterCount}</span>}
              </button>
              <p className="text-sm text-gray-400"><span className="font-bold text-gray-700">{totalCount}</span> records</p>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => exportCsv(records)} className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-600 transition hover:border-[#027D3F] hover:text-[#027D3F]">
                <FiDownload size={14} />
                Export CSV
              </button>
              <div className="relative">
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortBy)} className="appearance-none rounded-xl border border-gray-200 bg-white py-2 pl-3 pr-8 text-xs font-semibold text-gray-700 outline-none transition focus:border-[#027D3F] focus:ring-2 focus:ring-[#027D3F]/15">
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
          {isError ? (
            <div className="rounded-xl border border-[#F5B9B9] bg-[#FDECEC] px-5 py-4 text-sm text-[#D81F26]">Failed to load records. Please refresh.</div>
          ) : isLoading ? (
            <div className="flex flex-col gap-3">
              {Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : records.length > 0 ? (
            <div className="flex flex-col gap-3">
              {records.map((record) => (
                <RecordCard key={record.id} record={record} />
              ))}
            </div>
          ) : (
            <EmptyState clearFilters={clearFilters} hasFilters={activeFilterCount > 0} />
          )}

          {/* Pagination */}
          {!isLoading && totalCount > ITEMS_PER_PAGE && (
            <Pagination
              currentPage={currentPage} totalPages={totalPages}
              pageStart={pageStart} pageEnd={pageEnd} totalRecords={totalCount}
              onPrevious={() => setCurrentPage((p) => Math.max(1, p - 1))}
              onNext={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            />
          )}
        </div>
      </div>

      {/* Mobile filters drawer */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" className="absolute inset-0 bg-black/40" onClick={() => setMobileFiltersOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 max-h-[88dvh] overflow-y-auto rounded-t-2xl bg-white p-5">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-base font-bold text-gray-900">Filters</p>
                <p className="text-xs text-gray-400">Applied instantly</p>
              </div>
              <button type="button" onClick={() => setMobileFiltersOpen(false)} className="rounded-lg border border-gray-200 p-2 text-gray-500"><FiX size={16} /></button>
            </div>
            <FiltersPanel compact filters={filters} setFilter={setFilter} clearFilters={clearFilters} states={filterOptions?.states ?? []} zones={filterOptions?.zones ?? []} />
          </div>
        </div>
      )}
    </div>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────

function StatCard({ label, value, icon, className, valueClass }: { label: string; value: number; icon: React.ReactNode; className: string; valueClass: string }) {
  return (
    <div className={`rounded-xl border px-4 py-3 ${className}`}>
      <div className="flex items-center gap-1.5 mb-1">{icon}<p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">{label}</p></div>
      <p className={`text-2xl font-bold ${valueClass}`}>{value}</p>
    </div>
  )
}

function EmptyState({ clearFilters, hasFilters }: { clearFilters: () => void; hasFilters: boolean }) {
  return (
    <div className="flex min-h-[280px] flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-white p-8 text-center">
      <FiClipboard size={36} className="text-gray-200" />
      <p className="mt-4 text-base font-bold text-gray-800">{hasFilters ? "No records match these filters" : "No survey records yet"}</p>
      <p className="mt-1 max-w-sm text-sm text-gray-400">{hasFilters ? "Try adjusting your filters or search query." : "Submit your first earthing survey to see it here."}</p>
      {hasFilters && <button type="button" onClick={clearFilters} className="mt-5 rounded-xl bg-[#027D3F] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#02612f]">Clear filters</button>}
    </div>
  )
}