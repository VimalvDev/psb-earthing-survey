"use client"

import { FiChevronLeft, FiChevronRight } from "react-icons/fi"

interface PaginationProps {
  currentPage: number
  totalPages: number
  pageStart: number
  pageEnd: number
  totalRecords: number
  onPrevious: () => void
  onNext: () => void
}

export function Pagination({
  currentPage,
  totalPages,
  pageStart,
  pageEnd,
  totalRecords,
  onPrevious,
  onNext,
}: PaginationProps) {
  return (
    <div className="flex flex-col gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs text-gray-400">
        Showing{" "}
        <span className="font-bold text-gray-700">
          {totalRecords === 0 ? 0 : pageStart}–{pageEnd}
        </span>{" "}
        of <span className="font-bold text-gray-700">{totalRecords}</span> records
      </p>

      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={currentPage === 1}
          onClick={onPrevious}
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition hover:border-[#027D3F] hover:text-[#027D3F] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <FiChevronLeft size={14} />
          Previous
        </button>
        <span className="min-w-[80px] rounded-lg border border-gray-200 bg-white px-3 py-2 text-center text-xs font-bold text-gray-700">
          {currentPage} / {totalPages}
        </span>
        <button
          type="button"
          disabled={currentPage === totalPages}
          onClick={onNext}
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition hover:border-[#027D3F] hover:text-[#027D3F] disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
          <FiChevronRight size={14} />
        </button>
      </div>
    </div>
  )
}