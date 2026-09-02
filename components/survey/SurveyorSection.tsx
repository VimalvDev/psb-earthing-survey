"use client"

import { SectionHeading } from "@/components/ui/SectionHeading"
import { Input } from "@/components/ui/input"

interface SurveyorSectionProps {
  values: {
    name: string
    emp_id: string
    designation: string
    mobile_number: string
  }
  onChange: (field: string, value: string) => void
}

export function SurveyorSection({ values, onChange }: SurveyorSectionProps) {
  return (
    <section className="bg-white border border-gray-100 rounded-xl p-4 md:p-5">
      <SectionHeading>Surveyor Info</SectionHeading>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest">Surveyor Name</label>
          <Input value={values.name} onChange={(e) => onChange("name", e.target.value)} placeholder="Name" className="h-9 text-sm" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest">Employee ID</label>
          <Input value={values.emp_id} onChange={(e) => onChange("emp_id", e.target.value)} placeholder="Emp ID" className="h-9 text-sm" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest">Designation</label>
          <Input value={values.designation} onChange={(e) => onChange("designation", e.target.value)} placeholder="Designation" className="h-9 text-sm" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest">Contact</label>
          <Input value={values.mobile_number} onChange={(e) => onChange("mobile_number", e.target.value)} placeholder="Contact No" className="h-9 text-sm" />
        </div>
      </div>
    </section>
  )
}