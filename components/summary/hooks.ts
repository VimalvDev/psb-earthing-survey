"use client"

import { useQuery, keepPreviousData } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import { ALL_STATES } from "./states"

function normalize(value: string) {
  return value.trim().toUpperCase().replace(/\s+/g, " ")
}



const NORMALIZED_STATES = new Map(ALL_STATES.map((s) => [normalize(s.key), s]))

export function useStateWiseCounts() {
  const supabase = createClient()

  return useQuery({
    queryKey: ["survey-state-counts"],
    queryFn: async ({ signal }) => {
      const { data, error } = await supabase
        .from("surveys")
        .select("state")
        .abortSignal(signal)

      if (error) throw error

      const counts = new Map<string, number>()
      for (const state of ALL_STATES) counts.set(state.label, 0)

      let otherCount = 0
      for (const row of data ?? []) {
        const raw = row.state?.trim()
        if (!raw) continue
        const match = NORMALIZED_STATES.get(normalize(raw))
        if (match) {
          counts.set(match.label, (counts.get(match.label) ?? 0) + 1)
        } else {
          otherCount += 1
        }
      }

      const breakdown = ALL_STATES.map((state) => ({
        state: state.label,
        count: counts.get(state.label) ?? 0,
      })).sort((a, b) => b.count - a.count)

      return { breakdown, otherCount }
    },
    placeholderData: keepPreviousData,
    staleTime: 60 * 1000,
  })
}