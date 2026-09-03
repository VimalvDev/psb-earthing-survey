import { useState, useEffect, useCallback, useTransition } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { Filters, StatusFilter, DEFAULT_FILTERS } from "@/components/records/types"

export function useRecordsFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  // 1. Read the current URL state into a Filters object
  const urlFilters: Filters = {
    search: searchParams.get("search") || DEFAULT_FILTERS.search,
    status: (searchParams.get("status") as StatusFilter) || DEFAULT_FILTERS.status,
    state: searchParams.get("state") || DEFAULT_FILTERS.state,
    zone: searchParams.get("zone") || DEFAULT_FILTERS.zone,
    year: searchParams.get("year") || DEFAULT_FILTERS.year,
    dateFrom: searchParams.get("dateFrom") || DEFAULT_FILTERS.dateFrom,
    dateTo: searchParams.get("dateTo") || DEFAULT_FILTERS.dateTo,
  }

  // 2. Local state for debouncing the search input
  const [localSearch, setLocalSearch] = useState(urlFilters.search)

  // Sync local search with URL if the URL changes externally (e.g. back button)
  useEffect(() => {
    setLocalSearch(urlFilters.search)
  }, [urlFilters.search])

  // Core update function to push state to URL
  const updateUrl = useCallback(
    (updates: Partial<Filters>) => {
      const params = new URLSearchParams(searchParams.toString())

      Object.entries(updates).forEach(([key, value]) => {
        if (!value || value === "All") {
          params.delete(key)
        } else {
          params.set(key, value)
        }
      })

      // We use router.push with { scroll: false } so the user doesn't lose their place
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`, { scroll: false })
      })
    },
    [searchParams, pathname, router]
  )

  // 3. Debounce local search changes
  useEffect(() => {
    const handler = setTimeout(() => {
      if (localSearch !== urlFilters.search) {
        updateUrl({ search: localSearch })
      }
    }, 300)
    return () => clearTimeout(handler)
  }, [localSearch, urlFilters.search, updateUrl])

  // 4. Exposed setters
  const setFilter = useCallback(
    <K extends keyof Filters>(key: K, value: Filters[K]) => {
      if (key === "search") {
        setLocalSearch(value as string) // Immediate UI update for the input
      } else {
        updateUrl({ [key]: value })
      }
    },
    [updateUrl]
  )

  const clearFilters = useCallback(() => {
    setLocalSearch("")
    startTransition(() => {
      router.push(pathname, { scroll: false })
    })
  }, [pathname, router])

  // Count active filters for badges
  const activeSecondaryCount = [
    urlFilters.status !== "All",
    !!urlFilters.state,
    !!urlFilters.zone,
    !!urlFilters.dateFrom,
    !!urlFilters.dateTo,
  ].filter(Boolean).length

  const totalActiveCount = [
    !!urlFilters.search.trim(),
    !!urlFilters.year,
    ...[
      urlFilters.status !== "All",
      !!urlFilters.state,
      !!urlFilters.zone,
      !!urlFilters.dateFrom,
      !!urlFilters.dateTo,
    ],
  ].filter(Boolean).length

  return {
    filters: urlFilters,
    localSearch,
    setFilter,
    clearFilters,
    activeSecondaryCount,
    totalActiveCount,
    isPending,
  }
}
