"use client"

import { useQuery, keepPreviousData } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import { ALL_ZONES } from "./zones"

function normalize(value: string) {
  return value.trim().toUpperCase().replace(/\s+/g, " ")
}

const NORMALIZED_ZONES = new Map(ALL_ZONES.map((z) => [normalize(z.key), z]))

export function useZoneWiseCounts() {
  const supabase = createClient()

  return useQuery({
    queryKey: ["survey-zone-counts"],
    queryFn: async ({ signal }) => {
      const { data, error } = await supabase
        .from("surveys")
        .select("zone")
        .abortSignal(signal)

      if (error) throw error

      const counts = new Map<string, number>()
      for (const zone of ALL_ZONES) counts.set(zone.label, 0)

      let otherCount = 0
      for (const row of data ?? []) {
        const raw = row.zone?.trim()
        if (!raw) continue
        const match = NORMALIZED_ZONES.get(normalize(raw))
        if (match) {
          counts.set(match.label, (counts.get(match.label) ?? 0) + 1)
        } else {
          otherCount += 1
        }
      }

      const breakdown = ALL_ZONES.map((zone) => ({
        zone: zone.label,
        count: counts.get(zone.label) ?? 0,
      })).sort((a, b) => b.count - a.count)

      return { breakdown, otherCount }
    },
    placeholderData: keepPreviousData,
    staleTime: 60 * 1000,
  })
}