"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { FiPlus, FiLoader } from "react-icons/fi"
import { LockedInput } from "@/components/ui/LockedInput"
import { SectionHeading } from "@/components/ui/SectionHeading"
import { createClient } from "@/lib/supabase/client"

// Shape of a branch row from Supabase
interface BranchData {
  bic: string
  branch_name: string
  zone: string
  district: string
  state: string
  address: string
  manager_name: string
  phone_no: string
}

interface BranchDetailsSectionProps {
  // Parent form state setters — passed down from page
  onChange: (field: string, value: string) => void
  values: Record<string, string>
}

export function BranchDetailsSection({ onChange, values }: BranchDetailsSectionProps) {
  const [loading, setLoading] = useState(false)
  const [notFound, setNotFound] = useState(false)
  const [showSecondPhone, setShowSecondPhone] = useState(false)

  const supabase = createClient()

  // Called when engineer finishes typing branch code and tabs/clicks away
  async function handleBranchCodeBlur(e: React.FocusEvent<HTMLInputElement>) {
    const code = e.target.value.trim().toUpperCase()
    if (!code) return

    setLoading(true)
    setNotFound(false)

    const { data, error } = await supabase
      .from("branches")
      .select("*")
      .eq("bic", code)
      .single()

    setLoading(false)

    if (error || !data) {
      setNotFound(true)
      // Clear any previously filled fields
      ;["branch_name", "zone", "district", "state", "address", "manager_name", "phone_no"].forEach(
        (f) => onChange(f, "")
      )
      return
    }

    const branch = data as BranchData
    onChange("branch_name", branch.branch_name)
    onChange("zone", branch.zone)
    onChange("district", branch.district)
    onChange("state", branch.state)
    onChange("address", branch.address)
    onChange("manager_name", branch.manager_name)
    onChange("phone_no", branch.phone_no)
  }

  return (
    <section className="bg-white border border-gray-100 rounded-xl p-5">
      <SectionHeading>Branch Details</SectionHeading>

      {/* Branch Code + Name */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div className="flex flex-col gap-1.5">
          <Label className="text-sm font-medium text-gray-700">Branch Code</Label>
          <div className="relative">
            <Input
              placeholder="e.g. A0001"
              value={values.bic ?? ""}
              onChange={(e) => onChange("bic", e.target.value)}
              onBlur={handleBranchCodeBlur}
              className={notFound ? "border-[#E41E23] focus-visible:ring-[#E41E23]" : ""}
            />
            {loading && (
              <FiLoader
                size={14}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 animate-spin"
              />
            )}
          </div>
          {notFound && (
            <span className="text-[11px] text-[#E41E23]">Branch code not found in records</span>
          )}
        </div>
        <LockedInput
          label="Branch Name"
          placeholder="Auto-filled from Branch Code"
          value={values.branch_name}
        />
      </div>

      {/* State / District / Zone */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        <LockedInput label="State" placeholder="Auto-filled" value={values.state} />
        <LockedInput label="District" placeholder="Auto-filled" value={values.district} />
        <LockedInput label="Zone" placeholder="Auto-filled" value={values.zone} />
      </div>

      {/* Address */}
      <div className="flex flex-col gap-1.5 mb-4">
        <LockedInput label="Address" placeholder="Auto-filled" value={values.address} />
      </div>

      {/* Branch Manager + Phone */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div className="flex flex-col gap-1.5">
          <Label className="text-sm font-medium text-gray-700">Branch Manager Name</Label>
          <Input
            placeholder="e.g. Suresh Nair"
            value={values.manager_name ?? ""}
            onChange={(e) => onChange("manager_name", e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className="text-sm font-medium text-gray-700">Phone No.</Label>
          <Input
            placeholder="10-digit number"
            maxLength={10}
            value={values.phone_no ?? ""}
            onChange={(e) => onChange("phone_no", e.target.value)}
          />
          {showSecondPhone && (
            <Input
              placeholder="Alternate number"
              maxLength={10}
              value={values.phone_no_alt ?? ""}
              onChange={(e) => onChange("phone_no_alt", e.target.value)}
              className="mt-1"
            />
          )}
          <button
            type="button"
            onClick={() => setShowSecondPhone((v) => !v)}
            className="text-[11px] text-[#027D3F] hover:text-[#02612f] cursor-pointer text-left w-fit flex items-center gap-1 transition-colors duration-150 font-medium"
          >
            <FiPlus size={11} />
            {showSecondPhone ? "Remove Alternate" : "Add Alternate Number"}
          </button>
        </div>
      </div>

      {/* Date of Visit + Survey Type */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label className="text-sm font-medium text-gray-700">Date of Visit</Label>
          <Input
            type="date"
            value={values.visit_date ?? ""}
            onChange={(e) => onChange("visit_date", e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label className="text-sm font-medium text-gray-700">Survey Type</Label>
          <Select
            value={values.survey_type ?? ""}
            onValueChange={(v) => onChange("survey_type", v ?? "")}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="routine">Routine Inspection</SelectItem>
              <SelectItem value="post-rectification">Post-Rectification</SelectItem>
              <SelectItem value="complaint">Complaint Based</SelectItem>
              <SelectItem value="annual-audit">Annual Audit</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </section>
  )
}