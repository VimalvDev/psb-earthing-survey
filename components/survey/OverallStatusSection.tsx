"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { FiCheckCircle, FiAlertTriangle, FiXCircle } from "react-icons/fi"
import { SectionHeading } from "@/components/ui/SectionHeading"

export type OverallStatus = "Pass" | "Partial" | "Fail" | ""

interface OverallStatusSectionProps {
  status: OverallStatus
  remarks: string
  nextInspectionDate: string
  autoSuggestedStatus: OverallStatus  // computed from readings by parent
  onStatusChange: (s: OverallStatus) => void
  onRemarksChange: (r: string) => void
  onNextDateChange: (d: string) => void
}

const STATUS_CONFIG = [
  {
    value: "Pass" as OverallStatus,
    icon: FiCheckCircle,
    activeClass: "bg-[#027D3F]/10 border-[#027D3F] text-[#027D3F]",
    hoverClass: "hover:bg-[#027D3F]/10 hover:border-[#027D3F] hover:text-[#027D3F]",
  },
  {
    value: "Partial" as OverallStatus,
    icon: FiAlertTriangle,
    activeClass: "bg-[#BDD70C]/10 border-[#8A9C08] text-[#8A9C08]",
    hoverClass: "hover:bg-[#BDD70C]/10 hover:border-[#8A9C08] hover:text-[#8A9C08]",
  },
  {
    value: "Fail" as OverallStatus,
    icon: FiXCircle,
    activeClass: "bg-[#E41E23]/10 border-[#E41E23] text-[#E41E23]",
    hoverClass: "hover:bg-[#E41E23]/10 hover:border-[#E41E23] hover:text-[#E41E23]",
  },
]

export function OverallStatusSection({
  status,
  remarks,
  nextInspectionDate,
  autoSuggestedStatus,
  onStatusChange,
  onRemarksChange,
  onNextDateChange,
}: OverallStatusSectionProps) {
  return (
    <section className="bg-white border border-gray-100 rounded-xl p-5">
      <SectionHeading>Overall Earthing Status</SectionHeading>

      {/* Auto-suggest indicator */}
      {autoSuggestedStatus && autoSuggestedStatus !== status && (
        <div className="mb-3 flex items-center gap-2 text-[11px] text-gray-500 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">
          <FiAlertTriangle size={11} className="text-[#8A9C08] shrink-0" />
          Based on readings, suggested status is{" "}
          <strong className="text-gray-700">{autoSuggestedStatus}</strong>.
          <button
            type="button"
            onClick={() => onStatusChange(autoSuggestedStatus)}
            className="ml-auto text-[#027D3F] font-medium hover:underline"
          >
            Apply
          </button>
        </div>
      )}

      {/* Pass / Partial / Fail toggle */}
      <div className="flex gap-2 mb-5">
        {STATUS_CONFIG.map(({ value, icon: Icon, activeClass, hoverClass }) => {
          const isActive = status === value
          return (
            <button
              key={value}
              type="button"
              onClick={() => onStatusChange(value)}
              className={`flex-1 flex items-center justify-center gap-2 text-sm py-3 rounded-xl border-2 font-semibold transition-all duration-150
                ${isActive
                  ? activeClass
                  : `bg-white border-gray-200 text-gray-400 ${hoverClass}`
                }`}
            >
              <Icon size={15} />
              {value}
            </button>
          )
        })}
      </div>

      {/* Observations */}
      <div className="flex flex-col gap-1.5 mb-4">
        <Label className="text-sm font-medium text-gray-700">Observations / Remarks</Label>
        <Textarea
          placeholder="Describe any issues, observations, or recommendations for rectification..."
          className="min-h-22.5 resize-none bg-[#FAF6EE] border-gray-200 focus:ring-[#027D3F]"
          value={remarks}
          onChange={(e) => onRemarksChange(e.target.value)}
        />
      </div>

      {/* Next Inspection Due */}
      <div className="flex flex-col gap-1.5 max-w-55">
        <Label className="text-sm font-medium text-gray-700">Next Inspection Due</Label>
        <Input
          type="date"
          value={nextInspectionDate}
          onChange={(e) => onNextDateChange(e.target.value)}
        />
      </div>
    </section>
  )
}