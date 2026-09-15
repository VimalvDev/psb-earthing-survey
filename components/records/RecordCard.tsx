"use client";

import Link from "next/link";
import { FiMapPin, FiCalendar, FiUser, FiImage } from "react-icons/fi";
import { Flag } from "lucide-react";
import { motion } from "framer-motion";
import {
  SurveyRecord,
  STATUS_CONFIG,
  formatDate,
  getStatusFromRecord,
} from "./types";

interface RecordCardProps {
  record: SurveyRecord;
  index: number;
}

export function RecordCard({ record, index }: RecordCardProps) {
  const status = getStatusFromRecord(record);
  const config = status ? STATUS_CONFIG[status] : null;
  const hasPhoto = !!(record.site_photo?.form || record.site_photo?.site);
  const photoUrl = record.site_photo?.form || record.site_photo?.site || null;
  const isRecordFlagged = record.overall_status === "Flagged" || record.overall_status === "Fail";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25, delay: index * 0.05, ease: "easeOut" }}
    >
      <Link
        href={`/dashboard/records/${record.survey_id}`}
        className={`group relative flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 overflow-hidden border-b p-3 sm:py-3 sm:px-4 transition-colors duration-150
          ${isRecordFlagged 
            ? "border-red-100 bg-red-50/20 hover:bg-red-50" 
            : "border-gray-100 bg-white hover:bg-gray-50"
          }`}
      >
        <div className="flex items-start sm:items-center gap-3 sm:gap-4 w-full">
          {/* Photo thumbnail */}
          <div
            className={`w-12 h-12 sm:w-10 sm:h-10 shrink-0 rounded border flex items-center justify-center
              ${hasPhoto 
                ? isRecordFlagged ? "border-red-200" : "border-gray-200" 
                : isRecordFlagged ? "border-dashed border-red-200 bg-red-50/50" : "border-dashed border-gray-200 bg-gray-50"
              }`}
          >
            {photoUrl ? (
              <img
                src={photoUrl}
                alt="Form"
                className="w-full h-full object-cover rounded-[3px]"
              />
            ) : (
              <FiImage size={16} className={isRecordFlagged ? "text-red-300" : "text-gray-300"} />
            )}
          </div>

          {/* Main content */}
          <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
            
            {/* Primary Identifiers */}
            <div className="min-w-0 flex flex-col sm:w-[240px] shrink-0">
              <div className="flex items-center gap-1.5">
                {isRecordFlagged && (
                  <Flag size={12} className="text-red-500 fill-red-100 shrink-0" />
                )}
                <p className={`text-[13px] font-bold truncate transition-colors leading-tight
                  ${isRecordFlagged ? "text-red-900 group-hover:text-red-700" : "text-gray-900 group-hover:text-[#027D3F]"}`}
                >
                  {record.bic?.toUpperCase() ?? "—"}
                </p>
              </div>
              <p className="text-[12px] text-gray-500 truncate leading-tight mt-0.5 font-medium">
                {record.branch_name ?? "Unknown Branch"}
              </p>
            </div>

            {/* Meta details */}
            <div className="flex-1 flex flex-wrap sm:flex-nowrap items-center gap-x-4 gap-y-1 text-[12px] text-gray-500">
              {(record.district || record.state) && (
                <span className="flex items-center gap-1.5 truncate sm:w-[200px] shrink-0">
                  <FiMapPin size={12} className="text-gray-400 shrink-0" />
                  <span className="truncate">{[record.district, record.state].filter(Boolean).join(", ")}</span>
                </span>
              )}
              {record.visit_date && (
                <span className="flex items-center gap-1.5 shrink-0 whitespace-nowrap">
                  <FiCalendar size={12} className="text-gray-400 shrink-0" />
                  {formatDate(record.visit_date)}
                </span>
              )}
              <span className="hidden lg:flex items-center gap-1.5 shrink-0 whitespace-nowrap ml-auto">
                <FiUser size={12} className="text-gray-400 shrink-0" />
                {record.surveyor_name || record.surveyor_emp_id}
              </span>
            </div>

            {/* Status badge */}
            <div className="shrink-0 flex items-center justify-end sm:w-[100px] mt-1 sm:mt-0">
              {config && status && (
                <span
                  className={`inline-flex items-center rounded border px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider ${config.badge}`}
                >
                  {config.label}
                </span>
              )}
            </div>

          </div>
        </div>
      </Link>
    </motion.div>
  );
}
