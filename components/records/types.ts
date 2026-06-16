// ── Types ──────────────────────────────────────────────────────────────────

export type SurveyStatus = "Pass" | "Partial" | "Fail"
export type StatusFilter = "All" | SurveyStatus
export type SortBy = "newest" | "oldest" | "branch" | "status"

export interface SurveyRecord {
  id: string
  survey_id: string
  bic: string | null
  branch_name: string | null
  state: string | null
  district: string | null
  zone: string | null
  visit_date: string | null
  surveyor_emp_id: string | null
  surveyor_email: string | null
  overall_status: string | null
  readings: Record<string, string> | null
  site_photo: Record<string, string> | null
  created_at: string
}

export interface Filters {
  search: string
  status: StatusFilter
  state: string
  zone: string
  dateFrom: string
  dateTo: string
}

// ── Constants ──────────────────────────────────────────────────────────────

export const DEFAULT_FILTERS: Filters = {
  search: "",
  status: "All",
  state: "",
  zone: "",
  dateFrom: "",
  dateTo: "",
}

export const ITEMS_PER_PAGE = 10

export const STATUS_CONFIG: Record<
  SurveyStatus,
  { label: string; badge: string; rail: string }
> = {
  Pass: {
    label: "Pass",
    badge: "border-[#B9DEC8] bg-[#E8F5EE] text-[#027D3F]",
    rail: "bg-[#027D3F]",
  },
  Partial: {
    label: "Partial",
    badge: "border-[#E7E9A9] bg-[#F6F8D7] text-[#768A06]",
    rail: "bg-[#BDD70C]",
  },
  Fail: {
    label: "Fail",
    badge: "border-[#F5B9B9] bg-[#FDECEC] text-[#D81F26]",
    rail: "bg-[#D81F26]",
  },
}

// ── Helpers ────────────────────────────────────────────────────────────────

export function formatDate(iso: string | null): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

export function getStatusFromRecord(record: SurveyRecord): SurveyStatus | null {
  const s = record.overall_status
  if (s === "Pass" || s === "Partial" || s === "Fail") return s
  return null
}

export function getActiveFilterCount(filters: Filters): number {
  return [
    filters.search.trim(),
    filters.status !== "All",
    filters.state,
    filters.zone,
    filters.dateFrom,
    filters.dateTo,
  ].filter(Boolean).length
}

export function matchesFilters(record: SurveyRecord, filters: Filters): boolean {
  const query = filters.search.trim().toLowerCase()

  if (query) {
    const haystack = [
      record.branch_name,
      record.bic,
      record.district,
      record.state,
      record.zone,
      record.surveyor_emp_id,
      record.surveyor_email,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
    if (!haystack.includes(query)) return false
  }

  if (filters.status !== "All" && record.overall_status !== filters.status)
    return false
  if (filters.state && record.state !== filters.state) return false
  if (filters.zone && record.zone !== filters.zone) return false

  const dateKey = record.visit_date ?? record.created_at.slice(0, 10)
  if (filters.dateFrom && dateKey < filters.dateFrom) return false
  if (filters.dateTo && dateKey > filters.dateTo) return false

  return true
}

export function sortRecords(
  records: SurveyRecord[],
  sortBy: SortBy
): SurveyRecord[] {
  return [...records].sort((a, b) => {
    if (sortBy === "newest")
      return b.created_at.localeCompare(a.created_at)
    if (sortBy === "oldest")
      return a.created_at.localeCompare(b.created_at)
    if (sortBy === "branch")
      return (a.branch_name ?? "").localeCompare(b.branch_name ?? "")
    // status: Fail first
    const order = { Fail: 0, Partial: 1, Pass: 2 }
    return (
      (order[a.overall_status as SurveyStatus] ?? 3) -
      (order[b.overall_status as SurveyStatus] ?? 3)
    )
  })
}