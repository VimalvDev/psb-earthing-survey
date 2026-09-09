"use client"

import { useQuery, keepPreviousData } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import { ALL_STATES } from "./states"

function normalize(value: string) {
  return value.trim().toUpperCase().replace(/\s+/g, " ")
}

const STATE_ALIASES: Record<string, string> = {
  "jammu kashmir": "Jammu and Kashmir",
  "jammu & kashmir": "Jammu and Kashmir",
  "vishakhapatnam (andhera pradesh)": "Andhra Pradesh",
  "agartala (tripura)": "Tripura",
  "shillong (meghalaya)": "Meghalaya",
  "ranchi (jharkhand)": "Jharkhand",
  "raipur (chattsgarsh)": "Chhattisgarh",
  "pondey cherry": "Puducherry",
  "patna (bihar)": "Bihar",
  "panji (goa)": "Goa",
  "mumbai": "Maharashtra",
  "ludhiyana (punjab)": "Punjab",
  "kolkata": "West Bengal",
  "kohima ( nagaland)": "Nagaland",
  "kochi (kerala)": "Kerala",
  "jaipur (rajasthan)": "Rajasthan",
  "itanagar": "Arunachal Pradesh",
  "hyderabad": "Telangana",
  "parwanoo (himachal pradesh)": "Himachal Pradesh",
  "guwahti (assam)": "Assam",
  "gurugram/gurgao (haryana)": "Haryana",
  "gangtok (sikkim)": "Sikkim",
  "dehradun (uk)": "Uttarakhand",
  "chennai": "Tamil Nadu",
  "bhubneshwar (odisha)": "Odisha",
  "bhopal": "Madhya Pradesh",
  "banglore": "Karnataka",
  "ahemdabad": "Gujarat",
}

const NORMALIZED_STATES = new Map<string, {key: string, label: string}>()
ALL_STATES.forEach(s => NORMALIZED_STATES.set(normalize(s.key), s))
Object.entries(STATE_ALIASES).forEach(([alias, target]) => {
  const targetState = ALL_STATES.find(s => s.label === target)
  if (targetState) {
    NORMALIZED_STATES.set(normalize(alias), targetState)
  }
})

export function useStateWiseCounts(year?: string) {
  const supabase = createClient()

  return useQuery({
    queryKey: ["survey-state-counts", year],
    queryFn: async ({ signal }) => {
      let q = supabase.from("surveys").select("state, visit_date, branch_name, bic")
      
      if (year) {
        const [startYear, endYear] = year.split("-")
        q = q.gte("visit_date", `${startYear}-04-01`)
        q = q.lte("visit_date", `${endYear}-03-31`)
      }

      const { data, error } = await q.abortSignal(signal)

      if (error) throw error

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