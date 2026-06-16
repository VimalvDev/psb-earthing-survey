"use client"

import { LockedInput } from "@/components/ui/LockedInput"
import { SectionHeading } from "@/components/ui/SectionHeading"

// User object passed down from the page (read from Supabase session)
interface SurveyorSectionProps {
  user: {
    name: string
    emp_id: string
    designation: string
    mobile_number: string
  } | null
}

export function SurveyorSection({ user }: SurveyorSectionProps) {
  return (
    <section className="bg-white border border-gray-100 rounded-xl p-5">
      <SectionHeading>Surveyor Info</SectionHeading>

      {!user ? (
        <p className="text-sm text-gray-400">Loading surveyor info...</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <LockedInput label="Surveyor Name" placeholder="—" value={user.name} />
          <LockedInput label="Employee ID" placeholder="—" value={user.emp_id} />
          <LockedInput label="Designation" placeholder="—" value={user.designation} />
          <LockedInput label="Contact" placeholder="—" value={user.mobile_number} />
        </div>
      )}
    </section>
  )
}