"use client";

import { useState } from "react";
import Link from "next/link";
import { StateWiseSummary } from "@/components/summary/StateWiseSummary";
import { CoverageMetrics } from "@/components/summary/CoverageMetrics";
import {
  FiAlertTriangle,
  FiCheckCircle,
  FiFileText,
  FiList,
  FiPlus,
  FiXCircle,
} from "react-icons/fi";
import { Flag } from "lucide-react";
import { RecordCard } from "@/components/records/RecordCard";
import { useSurveyRecords, useSurveyStats, useFilterOptions } from "@/components/records/hooks";
import { DEFAULT_FILTERS, BranchCategory, CATEGORY_LABELS } from "@/components/records/types";
import { useCurrentUser } from "@/lib/hooks/use-current-user";
import { ExportControls } from "@/components/summary/ExportControls";

function SummarySkeleton() {
  return (
    <div className="grid gap-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={index}
          className="rounded-xl border border-gray-100 bg-gray-50 p-4 animate-pulse flex gap-4"
        >
          <div className="w-10 h-10 rounded bg-gray-200 shrink-0" />
          <div className="flex flex-col gap-2 flex-1">
            <div className="h-4 w-32 rounded bg-gray-200" />
            <div className="h-3 w-48 rounded bg-gray-200" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function SummaryPage() {
  const { data: user } = useCurrentUser();
  const [selectedYear, setSelectedYear] = useState<string>("auto");
  const [activeCategory, setActiveCategory] = useState<BranchCategory>("existing_amc");
  const { data: filterOptions } = useFilterOptions(activeCategory);

  const defaultYear = user?.allowed_years && user.allowed_years.length > 0 ? user.allowed_years[0] : "";
  const effectiveYear = selectedYear === "auto" ? defaultYear : selectedYear;

  const filters = { ...DEFAULT_FILTERS, year: effectiveYear, category: activeCategory };

  const {
    data: statsData,
    isLoading: statsLoading,
    isError: statsError,
  } = useSurveyStats(filters);
  const {
    data: pageData,
    isLoading: recordsLoading,
    isError: recordsError,
  } = useSurveyRecords(filters, "newest", 1);

  const recentRecords = pageData?.records.slice(0, 5) ?? [];

  const canSeeSummaryHeader =
    user?.role === "admin" ||
    user?.role === "engineer" ||
    user?.role === "manager";

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-8">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-2">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">Survey Summary</h1>
            <p className="text-[13px] text-gray-500 mt-0.5">
              Overview of submitted surveys and recent activity.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2.5 sm:items-center">
            {filterOptions?.years && filterOptions.years.length > 1 ? (
              <select
                value={selectedYear === "auto" ? effectiveYear : selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="appearance-none w-full sm:w-auto rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-[13px] font-semibold text-gray-700 outline-none transition focus:border-[#027D3F] focus:ring-1 focus:ring-[#027D3F]"
              >
                <option value="">All Financial Years</option>
                {filterOptions.years.map((year) => (
                  <option key={year} value={year}>
                    FY {year}
                  </option>
                ))}
              </select>
            ) : filterOptions?.years?.length === 1 ? (
              <div className="rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-[13px] font-semibold text-gray-700">
                FY {filterOptions.years[0]}
              </div>
            ) : null}
            <Link
              href={`/dashboard/records?category=${activeCategory}${effectiveYear ? `&year=${effectiveYear}` : ''}`}
              className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-[13px] font-semibold text-gray-700 transition hover:bg-gray-50 hover:text-gray-900"
            >
              <FiList size={14} />
              View Records
            </Link>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-1 border-b border-gray-200">
          {(["existing_amc", "new_installation"] as BranchCategory[]).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`relative px-4 py-2.5 text-[13px] font-semibold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#027D3F] rounded-t-lg ${
                activeCategory === cat
                  ? "text-[#027D3F]"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              {CATEGORY_LABELS[cat]}
              {activeCategory === cat && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#027D3F] rounded-full" />
              )}
            </button>
          ))}
        </div>

        {effectiveYear && (
          <div className="flex justify-end">
            <ExportControls year={effectiveYear} />
          </div>
        )}

        {canSeeSummaryHeader && (
          <CoverageMetrics year={effectiveYear} category={activeCategory} />
        )}
      </div>

      <StateWiseSummary year={effectiveYear} category={activeCategory} />

      <div className="rounded-xl border border-gray-200 bg-white p-5 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-gray-100 pb-4 mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Recent Submissions
            </h2>
            <p className="text-sm text-gray-500">
              Latest surveys ordered by submission date.
            </p>
          </div>
          <Link
            href={`/dashboard/records?category=${activeCategory}${effectiveYear ? `&year=${effectiveYear}` : ''}`}
            className="text-sm font-semibold text-[#027D3F] hover:underline"
          >
            View all records
          </Link>
        </div>

        <div className="mt-2">
          {recordsError || statsError ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">
              Failed to load summary data. Please refresh the page.
            </div>
          ) : recordsLoading ? (
            <SummarySkeleton />
          ) : recentRecords.length > 0 ? (
            <div className="flex flex-col">
              {recentRecords.map((record, i) => (
                <RecordCard key={record.id} record={record} index={i} />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-8 text-center text-sm text-gray-500">
              No survey records are available yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
