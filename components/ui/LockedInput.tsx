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
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <Label className="text-[13px] font-semibold text-gray-700">{label}</Label>
        {!onChange && <span className="text-[10px] font-medium text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">Auto-filled</span>}
      </div>
      <Input
        placeholder={placeholder}
        value={value ?? ""}
        readOnly={!onChange}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        className={`h-9 text-sm ${!onChange ? "bg-gray-50 text-gray-900 border-gray-200 focus-visible:ring-0" : ""}`}
      />
    </div>
  )
}