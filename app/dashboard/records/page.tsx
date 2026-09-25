"use client"

import { useEffect, useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import Link from "next/link"
import {
  FiAlertTriangle, FiCheckCircle, FiChevronDown,
  FiClipboard, FiDownload, FiFileText, FiFilter,
  FiPlus, FiX, FiXCircle, FiSearch,
} from "react-icons/fi"
import { createClient } from "@/lib/supabase/client"
import { ALL_STATES, getStateAliases } from "@/components/summary/states"
import * as XLSX from "xlsx-js-style"
import JSZip from "jszip"
import { saveAs } from "file-saver"

import { RecordCard } from "@/components/records/RecordCard"

import { Pagination } from "@/components/records/Pagination"
import { useRecordsFilters } from "@/lib/hooks/use-records-filters"
import { useCurrentUser } from "@/lib/hooks/use-current-user"
import { RecordsToolbar } from "@/components/records/records-toolbar"
import { ActiveFilterChips } from "@/components/records/active-filter-chips"
import { FiltersSheet } from "@/components/records/filters-sheet"
import {
  SurveyRecord, Filters, SortBy, BranchCategory,
  DEFAULT_FILTERS, ITEMS_PER_PAGE, CATEGORY_LABELS,
  getActiveFilterCount,
} from "@/components/records/types"



// ── Supabase fetchers ──────────────────────────────────────────────────────

const supabase = createClient()

function applyAllowedYears(q: any, allowed_years?: string[]) {
  if (allowed_years && allowed_years.length > 0) {
    const orConditions = allowed_years.map(year => `financial_year.eq.${year}`);
    return q.or(orConditions.join(","));
  }
  return q;
}

async function fetchPage(filters: Filters, sortBy: SortBy, page: number, allowed_years?: string[]) {
  // Use inner join on branches to filter by branch_category server-side
  let q = supabase
    .from("surveys")
    .select("id, survey_id, bic, branch_name, state, district, zone, visit_date, financial_year, surveyor_emp_id, surveyor_name, surveyor_email, overall_status, readings, remarks, next_inspection_date, equipment, site_photo, created_at, branches!inner(branch_category)", { count: "exact" })

  // Category filter via the joined branch master
  q = q.eq("branches.branch_category", filters.category)

  q = applyAllowedYears(q, allowed_years)

  const search = filters.search.trim()
  if (search) q = q.or(`branch_name.ilike.%${search}%,bic.ilike.%${search}%,district.ilike.%${search}%,state.ilike.%${search}%,surveyor_emp_id.ilike.%${search}%`)
  if (filters.status !== "All") {
    if (filters.status === "Flagged") {
      q = q.in("overall_status", ["Flagged", "Fail"])
    } else {
      q = q.eq("overall_status", filters.status)
    }
  }
  
  if (filters.state) {
    const aliases = getStateAliases(filters.state)
    const orCond = aliases.map(a => `state.ilike.%${a}%`).join(',')
    q = q.or(orCond)
  }
  
  if (filters.district) q = q.ilike("district", filters.district)
  if (filters.zone)  q = q.eq("zone", filters.zone)
  
  // Use financial_year column directly instead of date-range conversion
  if (filters.year) {
    q = q.eq("financial_year", filters.year)
  }

  if (filters.dateFrom) q = q.gte("visit_date", filters.dateFrom)
  if (filters.dateTo)   q = q.lte("visit_date", filters.dateTo)

  if (filters.pnMin) q = q.gte("readings->>EP-1::numeric", filters.pnMin)
  if (filters.pnMax) q = q.lte("readings->>EP-1::numeric", filters.pnMax)
  if (filters.peMin) q = q.gte("readings->>EP-2::numeric", filters.peMin)
  if (filters.peMax) q = q.lte("readings->>EP-2::numeric", filters.peMax)

  if (sortBy === "newest") q = q.order("created_at", { ascending: false })
  if (sortBy === "oldest") q = q.order("created_at", { ascending: true })
  if (sortBy === "branch") q = q.order("bic", { ascending: true })


  const from = (page - 1) * ITEMS_PER_PAGE
  const { data, error, count } = await q.range(from, from + ITEMS_PER_PAGE - 1)
  if (error) throw error

  // Flatten the joined branches data into each record
  const records = (data ?? []).map((row: any) => {
    const { branches, ...rest } = row
    return {
      ...rest,
      branch_category: branches?.branch_category ?? null,
    } as SurveyRecord
  })

  return { records, total: count ?? 0 }
}

async function fetchStats(filters: Filters, allowed_years?: string[]) {
  const applyFilters = (q: any) => {
    // Inner join on branches for category filtering
    q = q.eq("branches.branch_category", filters.category)
    q = applyAllowedYears(q, allowed_years)
    const search = filters.search.trim()
    if (search) q = q.or(`branch_name.ilike.%${search}%,bic.ilike.%${search}%,district.ilike.%${search}%,state.ilike.%${search}%`)
    
    if (filters.state) {
      const aliases = getStateAliases(filters.state)
      const orCond = aliases.map(a => `state.ilike.%${a}%`).join(',')
      q = q.or(orCond)
    }
    
    if (filters.district) q = q.ilike("district", filters.district)
    if (filters.zone)  q = q.eq("zone", filters.zone)
    // Use financial_year column directly
    if (filters.year) {
      q = q.eq("financial_year", filters.year)
    }
    if (filters.dateFrom) q = q.gte("visit_date", filters.dateFrom)
    if (filters.dateTo)   q = q.lte("visit_date", filters.dateTo)
    if (filters.pnMin) q = q.gte("readings->>EP-1::numeric", filters.pnMin)
    if (filters.pnMax) q = q.lte("readings->>EP-1::numeric", filters.pnMax)
    if (filters.peMin) q = q.gte("readings->>EP-2::numeric", filters.peMin)
    if (filters.peMax) q = q.lte("readings->>EP-2::numeric", filters.peMax)
    return q
  }
  const [p, f] = await Promise.all([
    applyFilters(supabase.from("surveys").select("id, branches!inner(branch_category)", { count: "exact", head: true }).eq("overall_status", "Pass")),
    applyFilters(supabase.from("surveys").select("id, branches!inner(branch_category)", { count: "exact", head: true }).in("overall_status", ["Flagged", "Fail"])),
  ])
  return { pass: p.count ?? 0, fail: f.count ?? 0 }
}

async function fetchSurveyDetail(surveyId: string) {
  const { data, error } = await supabase.from("surveys").select("*").eq("survey_id", surveyId).single()
  if (error) throw error

  let surveyor_name = data.surveyor_name || ""
  let surveyor_mobile = data.surveyor_mobile || ""

  if (!surveyor_name && data.surveyor_emp_id) {
    const { data: eng } = await supabase
      .from("engineers")
      .select("name, mobile_number")
      .eq("emp_id", data.surveyor_emp_id)
      .single()
    if (eng) {
      surveyor_name = eng.name
      surveyor_mobile = eng.mobile_number
    }
  }

  return { ...data, surveyor_name, surveyor_mobile }
}

async function fetchFilterOptions(allowed_years?: string[], category?: BranchCategory) {
  // Use inner join on branches for category filtering; select only needed fields
  let q = supabase.from("surveys").select("state, district, zone, financial_year, branches!inner(branch_category)")
  q = q.eq("branches.branch_category", category || "existing_amc")
  q = applyAllowedYears(q, allowed_years)
  const { data } = await q
  if (!data) return { states: [], districts: [], zones: [], years: [] }

  const allStates = ALL_STATES.map(s => s.label).sort();

  return {
    states: allStates,
    districts: [...new Set(data.map((r: any) => r.district).filter(Boolean))].sort() as string[],
    zones:  [...new Set(data.map((r: any) => r.zone).filter(Boolean))].sort() as string[],
    // Use financial_year column directly — no client-side date derivation
    years:  ([...new Set(data.map((r: any) => r.financial_year).filter(Boolean) as string[])]).sort((a, b) => b.localeCompare(a)),
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
  const { data: user } = useCurrentUser()
  const isVisitor = user?.role === "visitor"

  const {
    filters,
    localSearch,
    setFilter,
    clearFilters,
    activeSecondaryCount,
    totalActiveCount,
    isPending
  } = useRecordsFilters()

  const sortBy = filters.sortBy
  const currentPage = filters.page
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)


  // ── Queries ────────────────────────────────────────────────────────────
  const pageKey = ["records", filters, sortBy, currentPage, user?.allowed_years]

  const { data: pageData, isLoading, isError } = useQuery({
    queryKey: pageKey,
    queryFn: () => fetchPage(filters, sortBy, currentPage, user?.allowed_years),
    staleTime: 60_000,
    placeholderData: (prev: any) => prev,
  })

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["record-stats", filters, user?.allowed_years],
    queryFn: () => fetchStats(filters, user?.allowed_years),
    staleTime: 60_000,
  })

  const { data: filterOptions } = useQuery({
    queryKey: ["filter-options", filters.category, user?.allowed_years],
    queryFn: () => fetchFilterOptions(user?.allowed_years, filters.category),
    staleTime: 5 * 60 * 1000,
  })

  // ── Prefetch next page ─────────────────────────────────────────────────
  useEffect(() => {
    const total = pageData?.total ?? 0
    const totalPages = Math.ceil(total / ITEMS_PER_PAGE)
    if (currentPage < totalPages) {
      queryClient.prefetchQuery({
        queryKey: ["records", filters, sortBy, currentPage + 1, user?.allowed_years],
        queryFn: () => fetchPage(filters, sortBy, currentPage + 1, user?.allowed_years),
      })
    }
  }, [pageData, currentPage, filters, sortBy, user?.allowed_years, queryClient])

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

  // ── Derived ────────────────────────────────────────────────────────────
  const records    = pageData?.records ?? []
  const totalCount = pageData?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / ITEMS_PER_PAGE))
  const pageStart  = totalCount === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1
  const pageEnd    = Math.min(currentPage * ITEMS_PER_PAGE, totalCount)
  const activeFilterCount = getActiveFilterCount(filters)

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-2">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">Survey Records</h1>
            <p className="text-[13px] text-gray-500 mt-0.5">All submitted earthing inspections · PSB Pan-India</p>
          </div>
        </div>
        {!isVisitor && (
          <Link href="/dashboard/survey" className="inline-flex items-center gap-2 rounded-lg bg-[#027D3F] px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-[#02612f] self-start sm:self-auto shrink-0">
            <FiPlus size={16} />
            New Survey
          </Link>
        )}
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-1 border-b border-gray-200">
        {(["existing_amc", "new_installation"] as BranchCategory[]).map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setFilter("category", cat)}
            className={`relative px-4 py-2.5 text-[13px] font-semibold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#027D3F] rounded-t-lg ${
              filters.category === cat
                ? "text-[#027D3F]"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            {CATEGORY_LABELS[cat]}
            {filters.category === cat && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#027D3F] rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Main layout */}
      <div className="flex flex-col gap-4">
        
        <RecordsToolbar
          localSearch={localSearch}
          filters={filters}
          setFilter={setFilter}
          activeSecondaryCount={activeSecondaryCount}
          totalCount={totalCount}
          years={filterOptions?.years ?? []}
          states={filterOptions?.states ?? []}
          districts={filterOptions?.districts ?? []}
          onOpenFilters={() => setMobileFiltersOpen(true)}
          isPending={isPending}
        />

        <ActiveFilterChips
          filters={filters}
          setFilter={setFilter}
          clearFilters={clearFilters}
          totalActiveCount={totalActiveCount}
        />

        {/* Records */}
        {isError ? (
          <div className="rounded-xl border border-[#F5B9B9] bg-[#FDECEC] px-5 py-4 text-sm text-[#D81F26]">Failed to load records. Please refresh.</div>
        ) : isLoading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : records.length > 0 ? (
          <div className="flex flex-col gap-3">
            {records.map((record, i) => (
              <RecordCard key={record.id} record={record} index={i} />
            ))}
          </div>
        ) : (
          <EmptyState clearFilters={clearFilters} hasFilters={activeFilterCount > 0} />
        )}

        {/* Pagination */}
        {!isLoading && totalCount > ITEMS_PER_PAGE && (
          <div className="mt-2">
            <Pagination
              currentPage={currentPage} totalPages={totalPages}
              pageStart={pageStart} pageEnd={pageEnd} totalRecords={totalCount}
              onPrevious={() => setFilter("page", Math.max(1, currentPage - 1))}
              onNext={() => setFilter("page", Math.min(totalPages, currentPage + 1))}
            />
          </div>
        )}
      </div>

      {/* Filters bottom sheet / drawer */}
      <FiltersSheet
        isOpen={mobileFiltersOpen}
        onClose={() => setMobileFiltersOpen(false)}
        filters={filters}
        setFilter={setFilter}
        clearFilters={clearFilters}
        states={filterOptions?.states ?? []}
        districts={filterOptions?.districts ?? []}
        zones={filterOptions?.zones ?? []}
        years={filterOptions?.years ?? []}
      />
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