"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FiLock } from "react-icons/fi"

interface LockedInputProps {
  label: string
  placeholder: string
  value?: string
}

export function LockedInput({ label, placeholder, value }: LockedInputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-sm font-medium text-gray-700">{label}</Label>
      <div className="relative">
        <Input
          disabled
          placeholder={placeholder}
          value={value ?? ""}
          className="bg-[#FAF6EE] text-gray-500 cursor-not-allowed pr-8 border-gray-200"
        />
        <FiLock size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-300" />
      </div>
      <span className="text-[11px] text-gray-400">Auto-filled · editable by admin</span>
    </div>
  )
}