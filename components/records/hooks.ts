"use client"

import { useQuery, keepPreviousData } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import { Filters, SortBy, SurveyRecord, ITEMS_PER_PAGE } from "./types"

function buildQuery(supabase: ReturnType<typeof createClient>, filters: Filters, sortBy: SortBy) {
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
  if (filters.state) q = q.eq("state", filters.state)
  if (filters.zone)  q = q.eq("zone", filters.zone)
  if (filters.dateFrom) q = q.gte("visit_date", filters.dateFrom)
  if (filters.dateTo)   q = q.lte("visit_date", filters.dateTo)

  if (sortBy === "newest") q = q.order("created_at", { ascending: false })
  if (sortBy === "oldest") q = q.order("created_at", { ascending: true })
  if (sortBy === "branch") q = q.order("branch_name", { ascending: true })
  if (sortBy === "status") q = q.order("overall_status", { ascending: true })

  return q
}

export function useSurveyRecords(filters: Filters, sortBy: SortBy, page: number) {
  const supabase = createClient()

  return useQuery({
    queryKey: ["survey-records", filters, sortBy, page],
    queryFn: async ({ signal }) => {
      const from = (page - 1) * ITEMS_PER_PAGE
      const to   = from + ITEMS_PER_PAGE - 1
      const { data, error, count } = await buildQuery(supabase, filters, sortBy)
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

  return useQuery({
    queryKey: ["survey-stats", filters],
    queryFn: async ({ signal }) => {
      let q = supabase.from("surveys").select("overall_status")
      const search = filters.search.trim()
      if (search) q = q.or(`branch_name.ilike.%${search}%,bic.ilike.%${search}%,district.ilike.%${search}%,state.ilike.%${search}%`)
      if (filters.state) q = q.eq("state", filters.state)
      if (filters.zone)  q = q.eq("zone", filters.zone)
      if (filters.dateFrom) q = q.gte("visit_date", filters.dateFrom)
      if (filters.dateTo)   q = q.lte("visit_date", filters.dateTo)

      const { data, error } = await q.abortSignal(signal)
      if (error) throw error

      let pass = 0, partial = 0, fail = 0
      for (const row of data ?? []) {
        if (row.overall_status === "Pass") pass++
        else if (row.overall_status === "Partial") partial++
        else if (row.overall_status === "Fail") fail++
      }
      return { pass, partial, fail }
    },
    placeholderData: keepPreviousData,
  })
}

export function useFilterOptions() {
  const supabase = createClient()

  return useQuery({
    queryKey: ["survey-filter-options"],
    queryFn: async () => {
      const { data } = await supabase.from("surveys").select("state, zone")
      return {
        states: [...new Set((data ?? []).map((r) => r.state).filter(Boolean))].sort() as string[],
        zones:  [...new Set((data ?? []).map((r) => r.zone).filter(Boolean))].sort() as string[],
      }
    },
    staleTime: 5 * 60 * 1000,
  })
}