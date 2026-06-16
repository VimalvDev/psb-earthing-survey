"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface LockedInputProps {
  label: string
  placeholder: string
  value?: string
  onChange?: (value: string) => void
}

export function LockedInput({ label, placeholder, value, onChange }: LockedInputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-sm font-medium text-gray-700">{label}</Label>
      <Input
        placeholder={placeholder}
        value={value ?? ""}
        readOnly={!onChange}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        className={!onChange ? "bg-[#FAF6EE] text-gray-500 cursor-not-allowed border-gray-200" : ""}
      />
    </div>
  )
}