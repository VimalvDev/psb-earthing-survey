import { useState, useEffect, useCallback, useTransition, useMemo, useRef } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { Filters, StatusFilter, DEFAULT_FILTERS } from "@/components/records/types"

export function useRecordsFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  // 1. Read the current URL state into a Filters object
  const urlFilters: Filters = useMemo(() => ({
    search: searchParams.get("search") || DEFAULT_FILTERS.search,
    status: (searchParams.get("status") as StatusFilter) || DEFAULT_FILTERS.status,
    state: searchParams.get("state") || DEFAULT_FILTERS.state,
    zone: searchParams.get("zone") || DEFAULT_FILTERS.zone,
    year: searchParams.get("year") || DEFAULT_FILTERS.year,
    dateFrom: searchParams.get("dateFrom") || DEFAULT_FILTERS.dateFrom,
    dateTo: searchParams.get("dateTo") || DEFAULT_FILTERS.dateTo,
    page: parseInt(searchParams.get("page") || String(DEFAULT_FILTERS.page), 10),
    sortBy: (searchParams.get("sortBy") as any) || DEFAULT_FILTERS.sortBy,
  }), [searchParams])

  // 2. Local state for debouncing the search input
  const [localSearch, setLocalSearch] = useState(urlFilters.search)

  // Sync local search with URL if the URL changes externally (e.g. back button)
  useEffect(() => {
    if (typeof document !== 'undefined' && document.activeElement?.getAttribute('type') === 'search') {
      return
    }
    setLocalSearch(urlFilters.search)
  }, [urlFilters.search])

  // Core update function to push state to URL
  const updateUrl = useCallback(
    (updates: Partial<Filters>) => {
      const params = new URLSearchParams(searchParams.toString())

      Object.entries(updates).forEach(([key, value]) => {
        // Remove default/empty values from URL to keep it clean
        const isDefault =
          value === undefined ||
          value === null ||
          value === "All" ||
          value === "" ||
          (key === "page" && (value === 1 || value === "1")) ||
          (key === "sortBy" && value === "newest")
        if (isDefault) {
          params.delete(key)
        } else {
          params.set(key, String(value))
        }
      })

      // We use router.push with { scroll: false } so the user doesn't lose their place
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`, { scroll: false })
      })
    },
    [searchParams, pathname, router]
  )

  // Save and Restore filters from sessionStorage
  const isInitialMount = useRef(true)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
      if (searchParams.toString() === "") {
        const stored = sessionStorage.getItem("psb_records_filters")
        if (stored) {
          try {
            const parsed = JSON.parse(stored)
            const hasActiveFilters = Object.entries(parsed).some(
              ([key, val]) => val !== undefined && val !== null && val !== "All" && val !== "" && val !== DEFAULT_FILTERS[key as keyof Filters]
            )
            if (hasActiveFilters) {
              updateUrl(parsed)
              return // Skip saving this render, as we are navigating
            }
          } catch (e) {
            // ignore
          }
        }
      }
    }

    // Save current filters
    sessionStorage.setItem("psb_records_filters", JSON.stringify(urlFilters))
  }, [searchParams, updateUrl, urlFilters])

  // 3. Debounce local search changes
  useEffect(() => {
    const handler = setTimeout(() => {
      if (localSearch !== urlFilters.search) {
        updateUrl({ search: localSearch, page: 1 })
      }
    }, 300)
    return () => clearTimeout(handler)
  }, [localSearch, urlFilters.search, updateUrl])

  // 4. Exposed setters
  const setFilter = useCallback(
    <K extends keyof Filters>(key: K, value: Filters[K]) => {
      if (key === "search") {
        setLocalSearch(value as string) // Immediate UI update for the input
        updateUrl({ [key]: value, page: 1 }) // reset to page 1 on search
      } else if (key !== "page") {
        updateUrl({ [key]: value, page: 1 }) // reset to page 1 on filter/sort change
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
