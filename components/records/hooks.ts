"use client"

import { useQuery, keepPreviousData } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import { Filters, SortBy, SurveyRecord, ITEMS_PER_PAGE } from "./types"
import { useCurrentUser } from "@/lib/hooks/use-current-user"

export function buildQuery(supabase: ReturnType<typeof createClient>, filters: Filters, sortBy: SortBy) {
  let q = supabase.from("surveys").select(
    "id, survey_id, bic, branch_name, state, district, zone, visit_date, surveyor_emp_id, surveyor_email, overall_status, readings, site_photo, created_at",
    { count: "exact" }
  )

  const search = filters.search.trim()
  if (search) {
    q = q.or(
      `branch_name.ilike.%${search}%,bic.ilike.%${search}%,district.ilike.%${search}%,state.ilike.%${search}%,surveyor_emp_id.ilike.%${search}%`
    )
  }
  if (filters.status !== "All") q = q.eq("overall_status", filters.status)
  if (filters.state) q = q.ilike("state", filters.state)
  if (filters.zone)  q = q.eq("zone", filters.zone)
  if (filters.year) {
    const [startYear, endYear] = filters.year.split("-")
    q = q.gte("visit_date", `${startYear}-04-01`)
    q = q.lte("visit_date", `${endYear}-03-31`)
  }
  if (filters.dateFrom) q = q.gte("visit_date", filters.dateFrom)
  if (filters.dateTo)   q = q.lte("visit_date", filters.dateTo)

  if (sortBy === "newest") q = q.order("created_at", { ascending: false })
  if (sortBy === "oldest") q = q.order("created_at", { ascending: true })
  if (sortBy === "branch") q = q.order("branch_name", { ascending: true })
  if (sortBy === "status") q = q.order("overall_status", { ascending: true })

  return q
}

export function applyAllowedYears(q: any, allowed_years?: string[]) {
  if (allowed_years && allowed_years.length > 0) {
    const orConditions = allowed_years.map(year => {
      const [startYear, endYear] = year.split("-");
      return `and(visit_date.gte.${startYear}-04-01,visit_date.lte.${endYear}-03-31)`;
    });
    return q.or(orConditions.join(","));
  }
  return q;
}

export function useSurveyRecords(filters: Filters, sortBy: SortBy, page: number) {
  const supabase = createClient()
  const { data: user } = useCurrentUser()

  return useQuery({
    queryKey: ["survey-records", filters, sortBy, page, user?.allowed_years],
    queryFn: async ({ signal }) => {
      const from = (page - 1) * ITEMS_PER_PAGE
      const to   = from + ITEMS_PER_PAGE - 1
      let q = buildQuery(supabase, filters, sortBy)
      q = applyAllowedYears(q, user?.allowed_years)
      const { data, error, count } = await q
        .range(from, to)
        .abortSignal(signal)
      if (error) throw error
      return { records: (data as SurveyRecord[]) ?? [], totalCount: count ?? 0 }
    },
    placeholderData: keepPreviousData,
  })
}

export function useSurveyStats(filters: Filters) {
  const supabase = createClient()
  const { data: user } = useCurrentUser()

  return useQuery({
    queryKey: ["survey-stats", filters, user?.allowed_years],
    queryFn: async ({ signal }) => {
      let q = supabase.from("surveys").select("overall_status")
      q = applyAllowedYears(q, user?.allowed_years)
      const search = filters.search.trim()
      if (search) q = q.or(`branch_name.ilike.%${search}%,bic.ilike.%${search}%,district.ilike.%${search}%,state.ilike.%${search}%`)
      if (filters.state) q = q.ilike("state", filters.state)
      if (filters.zone)  q = q.eq("zone", filters.zone)
      if (filters.year) {
        const [startYear, endYear] = filters.year.split("-")
        q = q.gte("visit_date", `${startYear}-04-01`)
        q = q.lte("visit_date", `${endYear}-03-31`)
      }
      if (filters.dateFrom) q = q.gte("visit_date", filters.dateFrom)
      if (filters.dateTo)   q = q.lte("visit_date", filters.dateTo)

      const { data, error } = await q.abortSignal(signal)
      if (error) throw error

      let pass = 0, fail = 0
      for (const row of data ?? []) {
        if (row.overall_status === "Pass") pass++
        else if (row.overall_status === "Flagged" || row.overall_status === "Fail") fail++
      }
      return { pass, fail }
    },
    placeholderData: keepPreviousData,
  })
}

export function useFilterOptions() {
  const supabase = createClient()

  return useQuery({
    queryKey: ["survey-filter-options"],
    queryFn: async () => {
      const { data } = await supabase.from("surveys").select("state, zone, visit_date")
      const { ALL_STATES } = await import("@/components/summary/states")
      
      const getFY = (d: string | null) => {
        if (!d) return null
        const date = new Date(d)
        if (isNaN(date.getTime())) return null
        const y = date.getFullYear()
        return date.getMonth() < 3 ? `${y - 1}-${y}` : `${y}-${y + 1}`
      }

      return {
        states: ALL_STATES.map(s => s.label).sort(),
        zones:  [...new Set((data ?? []).map((r) => r.zone).filter(Boolean))].sort() as string[],
        years:  ([...new Set((data ?? []).map((r) => getFY(r.visit_date)).filter(Boolean) as string[])]).sort((a, b) => b.localeCompare(a)),
      }
    },
    staleTime: 5 * 60 * 1000,
  })
}