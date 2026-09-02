"use client"

import { useEffect, useState } from "react"
import { SectionHeading } from "@/components/ui/SectionHeading"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"

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
  const [engineers, setEngineers] = useState<any[]>([])
  const [dropdownValue, setDropdownValue] = useState<string>("")
  const supabase = createClient()

  useEffect(() => {
    async function loadEngineers() {
      const { data } = await supabase.from("engineers").select("*")
      if (data) {
        setEngineers(data)
      }
    }
    loadEngineers()
  }, [])

  // Sync dropdown with values.name on mount or when engineers load
  useEffect(() => {
    if (!values.name) {
      setDropdownValue("")
      return
    }
    const exists = engineers.find((e) => e.name === values.name)
    if (exists) {
      setDropdownValue(exists.name)
    } else if (engineers.length > 0) {
      // If name exists but not in DB list, assume it's "Other"
      setDropdownValue("Other")
    }
  }, [values.name, engineers])

  function handleDropdownChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value
    setDropdownValue(val)

    if (val === "Other") {
      onChange("name", "")
      onChange("emp_id", "")
      onChange("designation", "")
      onChange("mobile_number", "")
    } else if (val === "") {
      onChange("name", "")
      onChange("emp_id", "")
      onChange("designation", "")
      onChange("mobile_number", "")
    } else {
      const eng = engineers.find((eng) => eng.name === val)
      if (eng) {
        onChange("name", eng.name || "")
        onChange("emp_id", eng.emp_id || "")
        onChange("designation", eng.designation || "")
        onChange("mobile_number", eng.mobile_number || "")
      }
    }
  }

  return (
    <section className="bg-white border border-gray-100 rounded-xl p-4 md:p-5">
      <SectionHeading>Surveyor Info</SectionHeading>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest">
            Surveyor Name
          </label>
          <div className="flex flex-col gap-2">
            <select
              value={dropdownValue}
              onChange={handleDropdownChange}
              className="h-9 text-sm text-gray-800 bg-white border border-gray-200 rounded-lg px-2.5 outline-none focus:border-[#027D3F] focus:ring-1 focus:ring-[#027D3F]/20 transition-colors"
            >
              <option value="">Select Surveyor...</option>
              {engineers.map((eng, idx) => (
                <option key={eng.emp_id || idx} value={eng.name}>
                  {eng.name}
                </option>
              ))}
              <option value="Other">Other (Manual Entry)</option>
            </select>
            
            {dropdownValue === "Other" && (
              <Input
                value={values.name}
                onChange={(e) => onChange("name", e.target.value)}
                placeholder="Type name manually..."
                className="h-9 text-sm"
              />
            )}
          </div>
        </div>

        <div className="flex flex-col gap-1.5 justify-end">
          <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest">
            Employee ID
          </label>
          <Input
            value={values.emp_id}
            onChange={(e) => onChange("emp_id", e.target.value)}
            placeholder="Emp ID"
            className="h-9 text-sm"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest">
            Designation
          </label>
          <Input
            value={values.designation}
            onChange={(e) => onChange("designation", e.target.value)}
            placeholder="Designation"
            className="h-9 text-sm"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest">
            Contact
          </label>
          <Input
            value={values.mobile_number}
            onChange={(e) => onChange("mobile_number", e.target.value)}
            placeholder="Contact No"
            className="h-9 text-sm"
          />
        </div>
      </div>
    </section>
  )
}