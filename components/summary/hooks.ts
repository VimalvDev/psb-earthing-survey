"use client"

import { useQuery, keepPreviousData } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import { ALL_STATES, STATE_ALIASES } from "./states"

function normalize(value: string) {
  return value.trim().toUpperCase().replace(/\s+/g, " ")
}

const NORMALIZED_STATES = new Map<string, {key: string, label: string}>()
ALL_STATES.forEach(s => NORMALIZED_STATES.set(normalize(s.key), s))
Object.entries(STATE_ALIASES).forEach(([alias, target]) => {
  const targetState = ALL_STATES.find(s => s.label === target)
  if (targetState) {
    NORMALIZED_STATES.set(normalize(alias), targetState)
  }
})

import { BranchCategory } from "@/components/records/types"
import { applyAllowedYears } from "@/components/records/hooks"

export function useStateWiseCounts(year?: string, category?: BranchCategory, allowed_years?: string[]) {
  const supabase = createClient()

  return useQuery({
    queryKey: ["survey-state-counts", year, category, allowed_years],
    queryFn: async ({ signal }) => {
      let allData: any[] = []
      let from = 0
      
      while (true) {
        let q = supabase.from("surveys").select("state, branch_name, bic, branches!inner(branch_category)")
        
        q = q.eq("branches.branch_category", category || "existing_amc")
        
        q = applyAllowedYears(q, allowed_years)
        
        if (year) {
          q = q.eq("financial_year", year)
        }

        const { data, error } = await q.range(from, from + 999).abortSignal(signal)

        if (error) throw error
        
        allData = allData.concat(data || [])
        if (!data || data.length < 1000) break
        from += 1000
      }

      const data = allData

      const counts = new Map<string, number>()
      for (const state of ALL_STATES) counts.set(state.label, 0)

      let otherCount = 0
      const unrecognizedStates: Array<{state: string, bic: string, branchName: string}> = []
      for (const row of data ?? []) {
        const raw = row.state?.trim()
        if (!raw) continue
        const match = NORMALIZED_STATES.get(normalize(raw))
        if (match) {
          counts.set(match.label, (counts.get(match.label) ?? 0) + 1)
        } else {
          otherCount += 1
          unrecognizedStates.push({
            state: raw,
            bic: row.bic || "Unknown",
            branchName: row.branch_name || "Unknown Branch"
          })
        }
      }

      const breakdown = ALL_STATES.map((state) => ({
        state: state.label,
        count: counts.get(state.label) ?? 0,
      })).sort((a, b) => b.count - a.count)

      return { breakdown, otherCount, unrecognizedStates }
    },
    placeholderData: keepPreviousData,
    staleTime: 60 * 1000,
  })
}