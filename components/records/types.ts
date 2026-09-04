// ── Types ──────────────────────────────────────────────────────────────────

export type SurveyStatus = "Pass" | "Flagged"
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
  surveyor_name: string | null
  surveyor_email: string | null
  overall_status: string | null
  readings: Record<string, string> | null
  remarks: string | null
  next_inspection_date: string | null
  equipment: { make: string; model: string }[] | null
  checklist: Record<string, boolean> | null
  site_photo: Record<string, string> | null
  created_at: string
}

export interface Filters {
  search: string
  status: StatusFilter
  state: string
  zone: string
  year: string
  dateFrom: string
  dateTo: string
  page: number
  sortBy: SortBy
}

// ── Constants ──────────────────────────────────────────────────────────────

export const DEFAULT_FILTERS: Filters = {
  search: "",
  status: "All",
  state: "",
  zone: "",
  year: "",
  dateFrom: "",
  dateTo: "",
  page: 1,
  sortBy: "newest",
}

export const ITEMS_PER_PAGE = 10

export const STATUS_CONFIG: Record<
  SurveyStatus,
  { label: string; badge: string; rail: string; icon?: string; border?: string }
> = {
  Pass: {
    label: "Pass",
    badge: "border-[#B9DEC8] bg-[#E8F5EE] text-[#027D3F]",
    rail: "bg-[#027D3F]",
  },
  Flagged: {
    label: "Flagged",
    badge: "border-red-200 bg-red-50 text-red-600",
    rail: "bg-red-500",
    icon: "bg-red-100 text-red-600",
    border: "border-red-500",
  },
}

// ── Helpers ────────────────────────────────────────────────────────────────

export function formatDate(iso: string | null): string {
  if (!iso) return "—"
  if (/^\d{2}-\d{2}-\d{4}$/.test(iso)) return iso
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  
  const dd = String(d.getDate()).padStart(2, "0")
  const mm = String(d.getMonth() + 1).padStart(2, "0")
  const yyyy = d.getFullYear()
  return `${dd}-${mm}-${yyyy}`
}

export function getStatusFromRecord(record: SurveyRecord): SurveyStatus | null {
  const s = record.overall_status
  if (s === "Pass" || s === "Flagged" || s === "Fail") return s === "Fail" ? "Flagged" : s as SurveyStatus
  return null
}

export function getActiveFilterCount(filters: Filters): number {
  return [
    filters.search.trim(),
    filters.status !== "All",
    filters.state,
    filters.zone,
    filters.year,
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
  
  if (filters.year && !dateKey.startsWith(filters.year)) return false
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
    const order: Record<string, number> = { Flagged: 0, Fail: 0, Pass: 1 }
    return (
      (order[a.overall_status as string] ?? 3) -
      (order[b.overall_status as string] ?? 3)
    )
  })
}