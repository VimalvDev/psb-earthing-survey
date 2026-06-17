"use client";

import Link from "next/link";
import {
  FiAlertTriangle,
  FiCheckCircle,
  FiFileText,
  FiList,
  FiPlus,
  FiXCircle,
} from "react-icons/fi";
import { RecordCard } from "@/components/records/RecordCard";
import { useSurveyRecords, useSurveyStats } from "@/components/records/hooks";
import { DEFAULT_FILTERS } from "@/components/records/types";

function StatCard({
  label,
  value,
  icon,
  className,
  valueClass,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  className: string;
  valueClass: string;
}) {
  return (
     <div className={`rounded-xl border flex   justify-between items-center px-4 py-3 ${className}`}>
      <div className="flex items-center gap-1.5 mb-1">
        {icon}
        <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">{label}</p>
      </div>
      <p className={`text-2xl font-bold ${valueClass}`}>{value}</p>
    </div>
  );
}

function SummarySkeleton() {
  return (
    <div className="grid gap-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={index}
          className="rounded-3xl border border-gray-100 bg-gray-50 p-5 animate-pulse"
        >
          <div className="h-4 w-32 rounded bg-gray-200" />
          <div className="mt-4 h-10 w-24 rounded bg-gray-200" />
        </div>
      ))}
    </div>
  );
}

export default function SummaryPage() {
  const {
    data: statsData,
    isLoading: statsLoading,
    isError: statsError,
  } = useSurveyStats(DEFAULT_FILTERS);
  const {
    data: pageData,
    isLoading: recordsLoading,
    isError: recordsError,
  } = useSurveyRecords(DEFAULT_FILTERS, "newest", 1);

  const totalCount = pageData?.totalCount ?? 0;
  const passCount = statsData?.pass ?? 0;
  const partialCount = statsData?.partial ?? 0;
  const failCount = statsData?.fail ?? 0;
  const recentRecords = pageData?.records.slice(0, 5) ?? [];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Survey Summary</h1>
          <p className="text-sm text-gray-500 mt-1">
            A quick overview of submitted surveys and recent activity.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/dashboard/survey"
            className="inline-flex items-center gap-2 rounded-xl bg-[#027D3F] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#02612f]"
          >
            <FiPlus size={16} />
            New Survey
          </Link>
          <Link
            href="/dashboard/records"
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:border-[#027D3F] hover:text-[#027D3F]"
          >
            <FiList size={16} />
            View Records
          </Link>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 ">
        <StatCard
          label="Total"
          value={totalCount}
          icon={<FiFileText size={20} className="text-gray-400 " />}
          className="border-gray-100 bg-white"
          valueClass="text-gray-900"
        />

        <StatCard
          label="Pass"
          value={passCount}
          icon={<FiCheckCircle size={20} className="text-[#027D3F]" />}
          className="border-[#B9DEC8] bg-[#E8F5EE]"
          valueClass="text-[#027D3F]"
        />
        <StatCard
          label="Partial"
          value={partialCount}
          icon={<FiAlertTriangle size={20} className="text-[#768A06]" />}
          className="border-[#E7E9A9] bg-[#F6F8D7]"
          valueClass="text-[#768A06]"
        />
        <StatCard
          label="Fail"
          value={failCount}
          icon={
            <FiXCircle
              size={20}
              className="text-[#D81F26]"
            />
          }
          className="border-[#F5B9B9] bg-[#FDECEC]"
          valueClass="text-[#D81F26]"
        />
      </div>

      <div className="rounded-3xl border border-gray-100 bg-white p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Recent Submissions
            </h2>
            <p className="text-sm text-gray-500">
              Latest surveys ordered by submission date.
            </p>
          </div>
          <Link
            href="/dashboard/records"
            className="text-sm font-semibold text-[#027D3F] hover:underline"
          >
            View all records
          </Link>
        </div>

        <div className="mt-6">
          {recordsError || statsError ? (
            <div className="rounded-2xl border border-[#F5B9B9] bg-[#FDECEC] px-5 py-4 text-sm text-[#D81F26]">
              Failed to load summary data. Please refresh the page.
            </div>
          ) : recordsLoading ? (
            <SummarySkeleton />
          ) : recentRecords.length > 0 ? (
            <div className="grid gap-3">
              {recentRecords.map((record) => (
                <RecordCard key={record.id} record={record} />
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-gray-200 bg-gray-50 p-8 text-center text-sm text-gray-500">
              No survey records are available yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
