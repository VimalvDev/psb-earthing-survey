"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  FiAlertTriangle,
  FiCalendar,
  FiCamera,
  FiCheckCircle,
  FiChevronDown,
  FiChevronLeft,
  FiChevronRight,
  FiClipboard,
  FiDownload,
  FiFileText,
  FiFilter,
  FiMapPin,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiSliders,
  FiUser,
  FiX,
  FiXCircle,
} from "react-icons/fi";

type SurveyStatus = "Pass" | "Partial" | "Fail";
type StatusFilter = "All" | SurveyStatus;
type SortBy = "newest" | "oldest" | "branch" | "code" | "status";

type SurveyRecord = {
  id: string;
  branchCode: string;
  branchName: string;
  state: string;
  district: string;
  zone: string;
  surveyDate: string;
  surveyDateISO: string;
  surveyorName: string;
  status: SurveyStatus;
  hasSitePhoto: boolean;
  electrodeReading: string;
};

type Filters = {
  search: string;
  status: StatusFilter;
  state: string;
  zone: string;
  surveyor: string;
  dateFrom: string;
  dateTo: string;
};

const MOCK_RECORDS: SurveyRecord[] = [
  {
    id: "PSB-2026-001",
    branchCode: "PSB-DL-001",
    branchName: "Connaught Place Branch",
    state: "Delhi",
    district: "Central Delhi",
    zone: "North Zone",
    surveyDate: "12 Jun 2026",
    surveyDateISO: "2026-06-12",
    surveyorName: "Rajesh Kumar",
    status: "Pass",
    hasSitePhoto: true,
    electrodeReading: "1.2 ohm",
  },
  {
    id: "PSB-2026-002",
    branchCode: "PSB-MH-042",
    branchName: "Dadar West Branch",
    state: "Maharashtra",
    district: "Mumbai City",
    zone: "West Zone",
    surveyDate: "11 Jun 2026",
    surveyDateISO: "2026-06-11",
    surveyorName: "Priya Sharma",
    status: "Partial",
    hasSitePhoto: true,
    electrodeReading: "2.8 ohm",
  },
  {
    id: "PSB-2026-003",
    branchCode: "PSB-PB-017",
    branchName: "Amritsar Main Branch",
    state: "Punjab",
    district: "Amritsar",
    zone: "North Zone",
    surveyDate: "10 Jun 2026",
    surveyDateISO: "2026-06-10",
    surveyorName: "Harpreet Singh",
    status: "Fail",
    hasSitePhoto: false,
    electrodeReading: "5.6 ohm",
  },
  {
    id: "PSB-2026-004",
    branchCode: "PSB-KA-009",
    branchName: "MG Road Branch",
    state: "Karnataka",
    district: "Bengaluru Urban",
    zone: "South Zone",
    surveyDate: "09 Jun 2026",
    surveyDateISO: "2026-06-09",
    surveyorName: "Anitha Rao",
    status: "Pass",
    hasSitePhoto: true,
    electrodeReading: "1.5 ohm",
  },
  {
    id: "PSB-2026-005",
    branchCode: "PSB-RJ-023",
    branchName: "Jaipur City Branch",
    state: "Rajasthan",
    district: "Jaipur",
    zone: "West Zone",
    surveyDate: "08 Jun 2026",
    surveyDateISO: "2026-06-08",
    surveyorName: "Vikram Meena",
    status: "Partial",
    hasSitePhoto: false,
    electrodeReading: "3.1 ohm",
  },
  {
    id: "PSB-2026-006",
    branchCode: "PSB-UP-011",
    branchName: "Lucknow Hazratganj Branch",
    state: "Uttar Pradesh",
    district: "Lucknow",
    zone: "North Zone",
    surveyDate: "07 Jun 2026",
    surveyDateISO: "2026-06-07",
    surveyorName: "Rajesh Kumar",
    status: "Pass",
    hasSitePhoto: true,
    electrodeReading: "1.4 ohm",
  },
  {
    id: "PSB-2026-007",
    branchCode: "PSB-TN-034",
    branchName: "Anna Nagar Branch",
    state: "Tamil Nadu",
    district: "Chennai",
    zone: "South Zone",
    surveyDate: "06 Jun 2026",
    surveyDateISO: "2026-06-06",
    surveyorName: "Anitha Rao",
    status: "Pass",
    hasSitePhoto: true,
    electrodeReading: "1.0 ohm",
  },
  {
    id: "PSB-2026-008",
    branchCode: "PSB-GJ-019",
    branchName: "Ahmedabad CG Road Branch",
    state: "Gujarat",
    district: "Ahmedabad",
    zone: "West Zone",
    surveyDate: "05 Jun 2026",
    surveyDateISO: "2026-06-05",
    surveyorName: "Vikram Meena",
    status: "Fail",
    hasSitePhoto: false,
    electrodeReading: "6.0 ohm",
  },
  {
    id: "PSB-2026-009",
    branchCode: "PSB-WB-006",
    branchName: "Park Street Branch",
    state: "West Bengal",
    district: "Kolkata",
    zone: "East Zone",
    surveyDate: "04 Jun 2026",
    surveyDateISO: "2026-06-04",
    surveyorName: "Priya Sharma",
    status: "Partial",
    hasSitePhoto: true,
    electrodeReading: "2.4 ohm",
  },
  {
    id: "PSB-2026-010",
    branchCode: "PSB-HR-028",
    branchName: "Gurgaon Sector 14 Branch",
    state: "Haryana",
    district: "Gurugram",
    zone: "North Zone",
    surveyDate: "03 Jun 2026",
    surveyDateISO: "2026-06-03",
    surveyorName: "Harpreet Singh",
    status: "Pass",
    hasSitePhoto: true,
    electrodeReading: "1.3 ohm",
  },
  {
    id: "PSB-2026-011",
    branchCode: "PSB-MP-041",
    branchName: "Bhopal MP Nagar Branch",
    state: "Madhya Pradesh",
    district: "Bhopal",
    zone: "Central Zone",
    surveyDate: "02 Jun 2026",
    surveyDateISO: "2026-06-02",
    surveyorName: "Rajesh Kumar",
    status: "Pass",
    hasSitePhoto: false,
    electrodeReading: "1.7 ohm",
  },
  {
    id: "PSB-2026-012",
    branchCode: "PSB-OR-007",
    branchName: "Bhubaneswar Janpath Branch",
    state: "Odisha",
    district: "Khordha",
    zone: "East Zone",
    surveyDate: "01 Jun 2026",
    surveyDateISO: "2026-06-01",
    surveyorName: "Anitha Rao",
    status: "Partial",
    hasSitePhoto: true,
    electrodeReading: "2.9 ohm",
  },
];

const ITEMS_PER_PAGE = 8;

const DEFAULT_FILTERS: Filters = {
  search: "",
  status: "All",
  state: "",
  zone: "",
  surveyor: "",
  dateFrom: "",
  dateTo: "",
};

const STATUS_CONFIG = {
  Pass: {
    label: "Pass",
    badge: "border-[#B9DEC8] bg-[#E8F5EE] text-[#027D3F]",
    rail: "bg-[#027D3F]",
    icon: FiCheckCircle,
  },
  Partial: {
    label: "Partial",
    badge: "border-[#E7E9A9] bg-[#F6F8D7] text-[#768A06]",
    rail: "bg-[#BDD70C]",
    icon: FiAlertTriangle,
  },
  Fail: {
    label: "Fail",
    badge: "border-[#F5B9B9] bg-[#FDECEC] text-[#D81F26]",
    rail: "bg-[#D81F26]",
    icon: FiXCircle,
  },
};

const STATUS_ORDER: SurveyStatus[] = ["Fail", "Partial", "Pass"];

const STATES = Array.from(new Set(MOCK_RECORDS.map((record) => record.state))).sort();
const ZONES = Array.from(new Set(MOCK_RECORDS.map((record) => record.zone))).sort();
const SURVEYORS = Array.from(
  new Set(MOCK_RECORDS.map((record) => record.surveyorName))
).sort();

function getActiveFilterCount(filters: Filters) {
  return [
    filters.search.trim(),
    filters.status !== "All",
    filters.state,
    filters.zone,
    filters.surveyor,
    filters.dateFrom,
    filters.dateTo,
  ].filter(Boolean).length;
}

function matchesSearch(record: SurveyRecord, query: string) {
  if (!query) return true;

  const haystack = [
    record.branchName,
    record.branchCode,
    record.district,
    record.state,
    record.zone,
    record.surveyorName,
    record.electrodeReading,
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(query);
}

function compareRecords(a: SurveyRecord, b: SurveyRecord, sortBy: SortBy) {
  if (sortBy === "newest") {
    return b.surveyDateISO.localeCompare(a.surveyDateISO);
  }

  if (sortBy === "oldest") {
    return a.surveyDateISO.localeCompare(b.surveyDateISO);
  }

  if (sortBy === "branch") {
    return a.branchName.localeCompare(b.branchName);
  }

  if (sortBy === "code") {
    return a.branchCode.localeCompare(b.branchCode);
  }

  return STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status);
}

function toCsvCell(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}

function FiltersPanel({
  filters,
  setFilter,
  clearFilters,
  activeFilterCount,
  compact = false,
}: {
  filters: Filters;
  setFilter: <K extends keyof Filters>(key: K, value: Filters[K]) => void;
  clearFilters: () => void;
  activeFilterCount: number;
  compact?: boolean;
}) {
  return (
    <div
      className={
        compact
          ? "flex flex-col gap-5"
          : "sticky top-6 flex max-h-[calc(100dvh-3rem)] flex-col gap-5 overflow-y-auto rounded-lg border border-[#E1D9CB] bg-[#FFFEFA] p-5"
      }
    >
      <div className="flex items-start justify-between gap-4 border-b border-[#EAE2D5] pb-4">
        <div>
          <div className="flex items-center gap-2 text-[#027D3F]">
            <FiSliders className="h-4 w-4" />
            <p className="text-xs font-black uppercase tracking-[0.18em]">
              Filters
            </p>
          </div>
          <p className="mt-1 text-xs text-gray-500">Refine visible records</p>
        </div>

        {activeFilterCount > 0 ? (
          <span className="rounded-md bg-[#E8F5EE] px-2 py-1 text-[11px] font-bold text-[#027D3F]">
            {activeFilterCount} active
          </span>
        ) : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold text-gray-600">Search</label>
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={filters.search}
            onChange={(event) => setFilter("search", event.target.value)}
            type="search"
            placeholder="Branch, code, district, reading"
            className="w-full rounded-md border border-[#DCD3C4] bg-[#F8F4EC] py-2.5 pl-9 pr-3 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-[#027D3F] focus:bg-white focus:ring-2 focus:ring-[#027D3F]/15"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-xs font-bold text-gray-600">Status</label>
        <div className="grid grid-cols-4 gap-1.5 lg:grid-cols-2 xl:grid-cols-4">
          {(["All", "Pass", "Partial", "Fail"] as StatusFilter[]).map((status) => {
            const active = filters.status === status;

            return (
              <button
                key={status}
                type="button"
                onClick={() => setFilter("status", status)}
                className={`rounded-md border px-2.5 py-2 text-xs font-bold transition ${
                  active
                    ? "border-[#172018] bg-[#172018] text-white"
                    : "border-[#DCD3C4] bg-white text-gray-600 hover:border-[#027D3F] hover:text-[#027D3F]"
                }`}
              >
                {status}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
        <SelectField
          label="State"
          value={filters.state}
          onChange={(value) => setFilter("state", value)}
          options={STATES}
          emptyLabel="All states"
        />
        <SelectField
          label="Zone"
          value={filters.zone}
          onChange={(value) => setFilter("zone", value)}
          options={ZONES}
          emptyLabel="All zones"
        />
        <SelectField
          label="Surveyor"
          value={filters.surveyor}
          onChange={(value) => setFilter("surveyor", value)}
          options={SURVEYORS}
          emptyLabel="All surveyors"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-xs font-bold text-gray-600">Survey date</label>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-medium text-gray-400">From</span>
            <input
              value={filters.dateFrom}
              onChange={(event) => setFilter("dateFrom", event.target.value)}
              type="date"
              className="w-full rounded-md border border-[#DCD3C4] bg-[#F8F4EC] px-2 py-2 text-xs text-gray-800 outline-none transition focus:border-[#027D3F] focus:bg-white focus:ring-2 focus:ring-[#027D3F]/15"
            />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-medium text-gray-400">To</span>
            <input
              value={filters.dateTo}
              onChange={(event) => setFilter("dateTo", event.target.value)}
              type="date"
              className="w-full rounded-md border border-[#DCD3C4] bg-[#F8F4EC] px-2 py-2 text-xs text-gray-800 outline-none transition focus:border-[#027D3F] focus:bg-white focus:ring-2 focus:ring-[#027D3F]/15"
            />
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={clearFilters}
        className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-[#DCD3C4] bg-white px-4 py-2.5 text-sm font-bold text-gray-700 transition hover:border-[#027D3F] hover:text-[#027D3F]"
      >
        <FiRefreshCw className="h-4 w-4" />
        Clear filters
      </button>
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  emptyLabel,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  emptyLabel: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-bold text-gray-600">{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full appearance-none rounded-md border border-[#DCD3C4] bg-[#F8F4EC] px-3 py-2.5 pr-8 text-sm text-gray-800 outline-none transition focus:border-[#027D3F] focus:bg-white focus:ring-2 focus:ring-[#027D3F]/15"
        >
          <option value="">{emptyLabel}</option>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <FiChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: SurveyStatus }) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-black ${config.badge}`}
    >
      <Icon className="h-3.5 w-3.5" />
      {config.label}
    </span>
  );
}

function RecordCard({ record }: { record: SurveyRecord }) {
  const statusConfig = STATUS_CONFIG[record.status];

  return (
    <Link
      href={`/dashboard/records/${record.id}`}
      className="group relative grid gap-4 overflow-hidden rounded-lg border border-[#E1D9CB] bg-[#FFFEFA] p-4 transition hover:-translate-y-0.5 hover:border-[#027D3F]/35 md:grid-cols-[64px_minmax(0,1.2fr)_minmax(210px,0.8fr)_auto]"
    >
      <span className={`absolute inset-y-0 left-0 w-1 ${statusConfig.rail}`} />

      <div
        className={`flex h-16 w-16 items-center justify-center rounded-md border ${
          record.hasSitePhoto
            ? "border-[#CFE0CB] bg-[#EFF6EA]"
            : "border-dashed border-[#D8D0C2] bg-[#F7F3EA]"
        }`}
      >
        <FiCamera
          className={`h-5 w-5 ${
            record.hasSitePhoto ? "text-[#027D3F]/55" : "text-gray-300"
          }`}
        />
      </div>

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="min-w-0 truncate text-[15px] font-black text-[#172018] group-hover:text-[#027D3F]">
            {record.branchName}
          </p>
          <span className="rounded bg-[#F2EBDD] px-1.5 py-0.5 font-mono text-[11px] font-bold text-gray-500">
            {record.branchCode}
          </span>
        </div>

        <div className="mt-2 grid gap-1.5 text-xs text-gray-500 sm:grid-cols-2">
          <span className="flex min-w-0 items-center gap-1.5">
            <FiMapPin className="h-3.5 w-3.5 flex-shrink-0 text-gray-400" />
            <span className="truncate">
              {record.district}, {record.state}
            </span>
          </span>
          <span className="flex min-w-0 items-center gap-1.5">
            <FiUser className="h-3.5 w-3.5 flex-shrink-0 text-gray-400" />
            <span className="truncate">{record.surveyorName}</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs md:grid-cols-1 md:gap-1.5">
        <div>
          <p className="font-bold uppercase tracking-wide text-gray-400">Date</p>
          <p className="mt-0.5 flex items-center gap-1.5 font-semibold text-gray-700">
            <FiCalendar className="h-3.5 w-3.5 text-gray-400" />
            {record.surveyDate}
          </p>
        </div>
        <div>
          <p className="font-bold uppercase tracking-wide text-gray-400">
            Earth value
          </p>
          <p className="mt-0.5 font-semibold text-gray-700">
            {record.electrodeReading}
          </p>
        </div>
      </div>

      <div className="flex items-start justify-between gap-3 md:justify-end">
        <span className="rounded-md bg-[#F4F0E7] px-2.5 py-1 text-xs font-bold text-gray-500 md:hidden">
          {record.zone}
        </span>
        <div className="flex flex-col items-end gap-2">
          <StatusBadge status={record.status} />
          <span className="hidden rounded-md bg-[#F4F0E7] px-2.5 py-1 text-xs font-bold text-gray-500 md:inline-flex">
            {record.zone}
          </span>
        </div>
      </div>
    </Link>
  );
}

function EmptyState({ clearFilters }: { clearFilters: () => void }) {
  return (
    <div className="flex min-h-[320px] flex-col items-center justify-center rounded-lg border border-dashed border-[#D8D0C2] bg-[#FFFEFA] p-8 text-center">
      <FiClipboard className="h-11 w-11 text-gray-300" />
      <p className="mt-4 text-base font-black text-[#172018]">
        No records match these filters
      </p>
      <p className="mt-1 max-w-sm text-sm text-gray-500">
        Clear the current filters or search by another branch code, district, or
        surveyor.
      </p>
      <button
        type="button"
        onClick={clearFilters}
        className="mt-5 rounded-md bg-[#027D3F] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#02612f]"
      >
        Clear filters
      </button>
    </div>
  );
}

function Pagination({
  currentPage,
  totalPages,
  pageStart,
  pageEnd,
  totalRecords,
  onPrevious,
  onNext,
}: {
  currentPage: number;
  totalPages: number;
  pageStart: number;
  pageEnd: number;
  totalRecords: number;
  onPrevious: () => void;
  onNext: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 border-t border-[#E1D9CB] bg-[#F7F3EA] py-4 sm:flex-row sm:items-center sm:justify-between lg:sticky lg:bottom-0">
      <p className="text-xs font-medium text-gray-500">
        Showing{" "}
        <span className="font-black text-gray-800">
          {totalRecords === 0 ? 0 : pageStart}-{pageEnd}
        </span>{" "}
        of <span className="font-black text-gray-800">{totalRecords}</span>
      </p>

      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={currentPage === 1}
          onClick={onPrevious}
          className="inline-flex items-center gap-1.5 rounded-md border border-[#DCD3C4] bg-white px-3 py-2 text-xs font-bold text-gray-700 transition hover:border-[#027D3F] hover:text-[#027D3F] disabled:cursor-not-allowed disabled:border-[#E8E1D5] disabled:text-gray-300"
        >
          <FiChevronLeft className="h-4 w-4" />
          Previous
        </button>
        <span className="min-w-[92px] rounded-md border border-[#DCD3C4] bg-white px-3 py-2 text-center text-xs font-black text-gray-700">
          {currentPage} / {totalPages}
        </span>
        <button
          type="button"
          disabled={currentPage === totalPages}
          onClick={onNext}
          className="inline-flex items-center gap-1.5 rounded-md border border-[#DCD3C4] bg-white px-3 py-2 text-xs font-bold text-gray-700 transition hover:border-[#027D3F] hover:text-[#027D3F] disabled:cursor-not-allowed disabled:border-[#E8E1D5] disabled:text-gray-300"
        >
          Next
          <FiChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export default function RecordsPage() {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [sortBy, setSortBy] = useState<SortBy>("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const activeFilterCount = getActiveFilterCount(filters);

  const setFilter = <K extends keyof Filters,>(key: K, value: Filters[K]) => {
    setFilters((current) => ({ ...current, [key]: value }));
  };

  const clearFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setSortBy("newest");
  };

  const exportVisibleRecords = () => {
    const header = [
      "Record ID",
      "Branch Code",
      "Branch Name",
      "State",
      "District",
      "Zone",
      "Survey Date",
      "Surveyor",
      "Status",
      "Earth Value",
    ];
    const rows = filteredRecords.map((record) => [
      record.id,
      record.branchCode,
      record.branchName,
      record.state,
      record.district,
      record.zone,
      record.surveyDateISO,
      record.surveyorName,
      record.status,
      record.electrodeReading,
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map(toCsvCell).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `psb-earthing-records-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const filteredRecords = useMemo(() => {
    const query = filters.search.trim().toLowerCase();

    return MOCK_RECORDS.filter((record) => {
      const searchMatch = matchesSearch(record, query);
      const statusMatch =
        filters.status === "All" || record.status === filters.status;
      const stateMatch = !filters.state || record.state === filters.state;
      const zoneMatch = !filters.zone || record.zone === filters.zone;
      const surveyorMatch =
        !filters.surveyor || record.surveyorName === filters.surveyor;
      const dateFromMatch =
        !filters.dateFrom || record.surveyDateISO >= filters.dateFrom;
      const dateToMatch = !filters.dateTo || record.surveyDateISO <= filters.dateTo;

      return (
        searchMatch &&
        statusMatch &&
        stateMatch &&
        zoneMatch &&
        surveyorMatch &&
        dateFromMatch &&
        dateToMatch
      );
    }).sort((a, b) => compareRecords(a, b, sortBy));
  }, [filters, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / ITEMS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const pageStart = filteredRecords.length
    ? (safeCurrentPage - 1) * ITEMS_PER_PAGE + 1
    : 0;
  const pageEnd = Math.min(safeCurrentPage * ITEMS_PER_PAGE, filteredRecords.length);
  const paginatedRecords = pageStart
    ? filteredRecords.slice(pageStart - 1, pageEnd)
    : [];

  const visiblePassCount = filteredRecords.filter(
    (record) => record.status === "Pass"
  ).length;
  const visibleReviewCount = filteredRecords.length - visiblePassCount;

  useEffect(() => {
    setCurrentPage(1);
  }, [
    filters.search,
    filters.status,
    filters.state,
    filters.zone,
    filters.surveyor,
    filters.dateFrom,
    filters.dateTo,
    sortBy,
  ]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  return (
    <div className="min-h-screen bg-[#F7F3EA] text-[#172018] lg:h-[100dvh] lg:overflow-hidden">
      <div className="mx-auto flex min-h-screen max-w-[1320px] flex-col px-4 py-4 sm:px-6 lg:h-full lg:min-h-0 lg:px-7 lg:py-6">
        <header className="shrink-0 border-b border-[#E1D9CB] pb-4">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#027D3F]">
                PSB Earthing Survey
              </p>
              <h1 className="mt-2 text-2xl font-black tracking-normal text-[#111827] sm:text-3xl">
                Branch Inspection Records
              </h1>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Review submitted earthing inspections, field ownership, site
                evidence, and branch-level status.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 sm:min-w-[430px]">
              <div className="rounded-lg border border-[#E1D9CB] bg-[#FFFEFA] px-3 py-2">
                <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wide text-gray-400">
                  <FiFileText className="h-3.5 w-3.5" />
                  Visible
                </p>
                <p className="mt-1 text-xl font-black">{filteredRecords.length}</p>
              </div>
              <div className="rounded-lg border border-[#B9DEC8] bg-[#E8F5EE] px-3 py-2">
                <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wide text-[#027D3F]">
                  <FiCheckCircle className="h-3.5 w-3.5" />
                  Pass
                </p>
                <p className="mt-1 text-xl font-black text-[#027D3F]">
                  {visiblePassCount}
                </p>
              </div>
              <div className="rounded-lg border border-[#E7E9A9] bg-[#F6F8D7] px-3 py-2">
                <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wide text-[#768A06]">
                  <FiAlertTriangle className="h-3.5 w-3.5" />
                  Review
                </p>
                <p className="mt-1 text-xl font-black text-[#768A06]">
                  {visibleReviewCount}
                </p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex min-h-0 flex-1 flex-col gap-4 pt-4 lg:flex-row lg:gap-6">
          <aside className="hidden w-[300px] shrink-0 lg:block">
            <FiltersPanel
              filters={filters}
              setFilter={setFilter}
              clearFilters={clearFilters}
              activeFilterCount={activeFilterCount}
            />
          </aside>

          <section className="flex min-w-0 flex-1 flex-col">
            <div className="sticky top-0 z-10 -mx-4 border-b border-[#E1D9CB] bg-[#F7F3EA]/95 px-4 pb-3 backdrop-blur sm:-mx-6 sm:px-6 lg:static lg:mx-0 lg:rounded-lg lg:border lg:bg-[#FFFEFA] lg:px-4 lg:py-3 lg:backdrop-blur-0">
              <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <div className="relative min-w-0 flex-1 xl:max-w-md">
                    <FiSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      value={filters.search}
                      onChange={(event) => setFilter("search", event.target.value)}
                      type="search"
                      placeholder="Search records"
                      className="w-full rounded-md border border-[#DCD3C4] bg-[#FFFEFA] py-2.5 pl-9 pr-3 text-sm outline-none transition placeholder:text-gray-400 focus:border-[#027D3F] focus:ring-2 focus:ring-[#027D3F]/15 lg:bg-[#F8F4EC]"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => setMobileFiltersOpen(true)}
                    className="inline-flex items-center gap-2 rounded-md border border-[#DCD3C4] bg-[#FFFEFA] px-3 py-2.5 text-sm font-bold text-gray-700 lg:hidden"
                  >
                    <FiFilter className="h-4 w-4" />
                    Filters
                    {activeFilterCount > 0 ? (
                      <span className="rounded bg-[#027D3F] px-1.5 py-0.5 text-[10px] text-white">
                        {activeFilterCount}
                      </span>
                    ) : null}
                  </button>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-medium text-gray-500">
                    <span className="font-black text-gray-900">
                      {filteredRecords.length}
                    </span>{" "}
                    records
                  </p>

                  <div className="flex items-center gap-2">
                    <Link
                      href="/dashboard/survey"
                      className="hidden items-center gap-2 rounded-md bg-[#027D3F] px-3 py-2 text-xs font-bold text-white transition hover:bg-[#02612f] sm:inline-flex"
                    >
                      <FiPlus className="h-4 w-4" />
                      New survey
                    </Link>
                    <button
                      type="button"
                      onClick={exportVisibleRecords}
                      className="hidden items-center gap-2 rounded-md border border-[#DCD3C4] bg-white px-3 py-2 text-xs font-bold text-gray-700 transition hover:border-[#027D3F] hover:text-[#027D3F] sm:inline-flex"
                    >
                      <FiDownload className="h-4 w-4" />
                      Export
                    </button>
                    <div className="relative">
                      <select
                        value={sortBy}
                        onChange={(event) => setSortBy(event.target.value as SortBy)}
                        className="appearance-none rounded-md border border-[#DCD3C4] bg-white py-2 pl-3 pr-8 text-xs font-bold text-gray-700 outline-none transition focus:border-[#027D3F] focus:ring-2 focus:ring-[#027D3F]/15"
                      >
                        <option value="newest">Newest first</option>
                        <option value="oldest">Oldest first</option>
                        <option value="branch">Branch A-Z</option>
                        <option value="code">Code A-Z</option>
                        <option value="status">Needs review first</option>
                      </select>
                      <FiChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {activeFilterCount > 0 ? (
              <div className="flex flex-wrap items-center gap-2 py-3 lg:py-2">
                <span className="text-xs font-bold text-gray-500">
                  Active filters:
                </span>
                {filters.search.trim() ? (
                  <FilterChip
                    label={`Search: ${filters.search.trim()}`}
                    onRemove={() => setFilter("search", "")}
                  />
                ) : null}
                {filters.status !== "All" ? (
                  <FilterChip label={`Status: ${filters.status}`} onRemove={() => setFilter("status", "All")} />
                ) : null}
                {filters.state ? (
                  <FilterChip label={`State: ${filters.state}`} onRemove={() => setFilter("state", "")} />
                ) : null}
                {filters.zone ? (
                  <FilterChip label={`Zone: ${filters.zone}`} onRemove={() => setFilter("zone", "")} />
                ) : null}
                {filters.surveyor ? (
                  <FilterChip label={`Surveyor: ${filters.surveyor}`} onRemove={() => setFilter("surveyor", "")} />
                ) : null}
                {filters.dateFrom ? (
                  <FilterChip label={`From: ${filters.dateFrom}`} onRemove={() => setFilter("dateFrom", "")} />
                ) : null}
                {filters.dateTo ? (
                  <FilterChip label={`To: ${filters.dateTo}`} onRemove={() => setFilter("dateTo", "")} />
                ) : null}
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-xs font-black text-[#027D3F] hover:underline"
                >
                  Clear all
                </button>
              </div>
            ) : null}

            <div className="min-h-0 flex-1 lg:overflow-y-auto lg:pr-1 lg:[scrollbar-gutter:stable]">
              {paginatedRecords.length ? (
                <div className="flex flex-col gap-3 pb-4">
                  {paginatedRecords.map((record) => (
                    <RecordCard key={record.id} record={record} />
                  ))}
                </div>
              ) : (
                <EmptyState clearFilters={clearFilters} />
              )}
            </div>

            <Pagination
              currentPage={safeCurrentPage}
              totalPages={totalPages}
              pageStart={pageStart}
              pageEnd={pageEnd}
              totalRecords={filteredRecords.length}
              onPrevious={() => setCurrentPage((page) => Math.max(1, page - 1))}
              onNext={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
            />
          </section>
        </main>
      </div>

      {mobileFiltersOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close filters"
            className="absolute inset-0 bg-black/35"
            onClick={() => setMobileFiltersOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[86dvh] overflow-y-auto rounded-t-2xl bg-[#FFFEFA] p-5">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-base font-black text-[#172018]">Filters</p>
                <p className="text-xs text-gray-500">Applied instantly</p>
              </div>
              <button
                type="button"
                aria-label="Close filters"
                onClick={() => setMobileFiltersOpen(false)}
                className="rounded-md border border-[#DCD3C4] p-2 text-gray-600"
              >
                <FiX className="h-4 w-4" />
              </button>
            </div>
            <FiltersPanel
              compact
              filters={filters}
              setFilter={setFilter}
              clearFilters={clearFilters}
              activeFilterCount={activeFilterCount}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function FilterChip({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-[#DCD3C4] bg-[#FFFEFA] px-2 py-1 text-xs font-bold text-gray-600">
      {label}
      <button
        type="button"
        aria-label={`Remove ${label}`}
        onClick={onRemove}
        className="text-gray-400 hover:text-[#D81F26]"
      >
        <FiX className="h-3.5 w-3.5" />
      </button>
    </span>
  );
}
