"use client"

import { useEffect, useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { FiX, FiRefreshCw } from "react-icons/fi"
import { Filters, StatusFilter } from "./types"

interface FiltersSheetProps {
  isOpen: boolean
  onClose: () => void
  filters: Filters
  setFilter: <K extends keyof Filters>(key: K, value: Filters[K]) => void
  clearFilters: () => void
  states: string[]
  zones: string[]
}

export function FiltersSheet({
  isOpen,
  onClose,
  filters,
  setFilter,
  clearFilters,
  states,
  zones,
}: FiltersSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [isOpen])

  // Focus trapping and Escape key
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex flex-col justify-end lg:hidden">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={onClose}
          aria-hidden="true"
        />

        {/* Sheet */}
        <motion.div
          ref={sheetRef}
          role="dialog"
          aria-modal="true"
          aria-label="More filters"
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="relative flex w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl"
          style={{ 
            maxHeight: "85dvh", 
            paddingBottom: "env(safe-area-inset-bottom)" 
          }}
          drag="y"
          dragConstraints={{ top: 0 }}
          dragElastic={0.2}
          onDragEnd={(_, info) => {
            if (info.offset.y > 100 || info.velocity.y > 500) {
              onClose()
            }
          }}
        >
          {/* Drag Handle */}
          <div className="flex w-full items-center justify-center pt-3 pb-2 touch-pan-y">
            <div className="h-1.5 w-12 rounded-full bg-gray-200" />
          </div>

          <div className="flex items-center justify-between px-5 pb-4 border-b border-gray-100 shrink-0">
            <div>
              <h2 className="text-fluid-base font-bold text-gray-900">More Filters</h2>
              <p className="text-fluid-xs text-gray-400">Applied instantly</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full bg-gray-100 p-2 text-gray-500 hover:bg-gray-200 outline-none focus-visible:ring-2 focus-visible:ring-[#027D3F]"
            >
              <FiX size={16} />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-6">
            {/* Status */}
            <div className="flex flex-col gap-2">
              <label className="text-fluid-sm font-semibold text-gray-700">Status</label>
              <div className="grid grid-cols-3 gap-2">
                {(["All", "Pass", "Fail"] as StatusFilter[]).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setFilter("status", s)}
                    className={`rounded-xl border py-2.5 text-fluid-sm font-bold transition outline-none focus-visible:ring-2 focus-visible:ring-[#027D3F]
                      ${filters.status === s
                        ? "border-gray-900 bg-gray-900 text-white"
                        : "border-gray-200 bg-white text-gray-600 hover:border-[#027D3F] hover:text-[#027D3F]"
                      }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* State */}
            <div className="flex flex-col gap-2">
              <label className="text-fluid-sm font-semibold text-gray-700">State</label>
              <select
                value={filters.state}
                onChange={(e) => setFilter("state", e.target.value)}
                className="w-full appearance-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-fluid-sm text-gray-800 outline-none focus:border-[#027D3F] focus:bg-white focus:ring-2 focus:ring-[#027D3F]/15"
              >
                <option value="">All states</option>
                {states.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Zone */}
            <div className="flex flex-col gap-2">
              <label className="text-fluid-sm font-semibold text-gray-700">Zone</label>
              <select
                value={filters.zone}
                onChange={(e) => setFilter("zone", e.target.value)}
                className="w-full appearance-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-fluid-sm text-gray-800 outline-none focus:border-[#027D3F] focus:bg-white focus:ring-2 focus:ring-[#027D3F]/15"
              >
                <option value="">All zones</option>
                {zones.map((z) => (
                  <option key={z} value={z}>{z}</option>
                ))}
              </select>
            </div>

            {/* Date range */}
            <div className="flex flex-col gap-2">
              <label className="text-fluid-sm font-semibold text-gray-700">Visit date</label>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <span className="text-fluid-xs text-gray-500">From</span>
                  <input
                    value={filters.dateFrom}
                    onChange={(e) => setFilter("dateFrom", e.target.value)}
                    type="date"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 text-fluid-sm text-gray-800 outline-none focus:border-[#027D3F] focus:bg-white focus:ring-2 focus:ring-[#027D3F]/15"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-fluid-xs text-gray-500">To</span>
                  <input
                    value={filters.dateTo}
                    onChange={(e) => setFilter("dateTo", e.target.value)}
                    type="date"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 text-fluid-sm text-gray-800 outline-none focus:border-[#027D3F] focus:bg-white focus:ring-2 focus:ring-[#027D3F]/15"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footer (Sticky Clear) */}
          <div className="flex items-center gap-3 border-t border-gray-100 bg-white p-5 shrink-0">
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white py-3.5 text-fluid-sm font-bold text-gray-700 transition hover:bg-gray-50 outline-none focus-visible:ring-2 focus-visible:ring-[#027D3F]"
            >
              <FiRefreshCw size={14} />
              Clear all filters
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
