"use client";

import Link from "next/link";
import { FiMapPin, FiCalendar, FiUser, FiImage } from "react-icons/fi";
import {
  SurveyRecord,
  STATUS_CONFIG,
  formatDate,
  getStatusFromRecord,
} from "./types";

interface RecordCardProps {
  record: SurveyRecord;
}

export function RecordCard({ record }: RecordCardProps) {
  const status = getStatusFromRecord(record);
  const config = status ? STATUS_CONFIG[status] : null;
  const hasPhoto = !!(record.site_photo?.form || record.site_photo?.site);
  const photoUrl = record.site_photo?.form || record.site_photo?.site || null;
  console.log(status)

  return (
<Link
  href={`/dashboard/records/${record.survey_id}`}
  className="group relative flex gap-4 overflow-hidden rounded-xl border border-gray-100 p-4 transition-all duration-150 hover:-translate-y-0.5 bg-white hover:border-[#027D3F]/30 hover:shadow-sm"
>
      {/* Photo thumbnail */}
      <div
        className={`w-14 h-14 shrink-0 rounded-lg overflow-hidden border flex items-center justify-center
          ${hasPhoto ? "border-gray-100" : "border-dashed border-gray-200 bg-gray-50"}`}
      >
        {photoUrl ? (
          <img
            src={photoUrl}
            alt="Form"
            className="w-full h-full object-cover"
          />
        ) : (
          <FiImage size={18} className="text-gray-300" />
        )}
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0 flex gap-2 ">
            <p className="text-[15px] font-bold text-gray-900 truncate group-hover:text-[#027D3F] transition-colors">
              {record.bic?.toUpperCase() ?? "—"}
            </p>
            <span className="font-mono text-[11px] text-gray-400 bg-gray-50 border border-gray-100 rounded px-1.5 py-0.5">
              {record.branch_name ?? "Unknown Branch"}
            </span>
          </div>

          {/* Status badge */}
          {config && status && (
            <span
              className={`shrink-0 inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-bold ${config.badge}`}
            >
              {config.label}
            </span>
          )}
        </div>

        {/* Meta row */}
        <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
          {(record.district || record.state) && (
            <span className="flex items-center gap-1.5">
              <FiMapPin size={12} className="text-gray-400 shrink-0" />
              {[record.district, record.state].filter(Boolean).join(", ")}
            </span>
          )}
          {record.visit_date && (
            <span className="flex items-center gap-1.5">
              <FiCalendar size={12} className="text-gray-400 shrink-0" />
              {formatDate(record.visit_date)}
            </span>
          )}
          {record.surveyor_emp_id && (
            <span className="flex items-center gap-1.5">
              <FiUser size={12} className="text-gray-400 shrink-0" />
              {record.surveyor_emp_id}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
