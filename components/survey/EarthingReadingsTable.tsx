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
import { Button } from "@/components/ui/button"
import { FiPlus } from "react-icons/fi"
import { SectionHeading } from "@/components/ui/SectionHeading"
import { StatusBadge, getStatus, BadgeStatus } from "@/components/ui/StatusBadge"

// The 4 fixed earth pit rows
const EARTH_PITS = [
  { epId: "EP-1", label: "Main Building" },
  { epId: "EP-2", label: "Server Rack / UPS" },
  { epId: "EP-3", label: "ATM Rack" },
  { epId: "EP-4", label: "Lightning Arrester" },
]

// Equipment makes and their models
const EQUIPMENT_OPTIONS: Record<string, string[]> = {
  WACO: ["KEW 4105A", "4102AH", "4300"],
  FLUKE: ["1625-2 GEO", "1623-2 GEO"],
}

export interface ReadingsData {
  readings: Record<string, string>   // { "EP-1": "0.8", "EP-2": "", ... }
  equipment: { make: string; model: string }[]
}

interface EarthingReadingsTableProps {
  data: ReadingsData
  onChange: (data: ReadingsData) => void
  // Called every time readings change so parent can auto-calc overall status
  onStatusChange: (statuses: BadgeStatus[]) => void
}

export function EarthingReadingsTable({
  data,
  onChange,
  onStatusChange,
}: EarthingReadingsTableProps) {
  // Update a single reading value
  function handleReadingChange(epId: string, value: string) {
    const newReadings = { ...data.readings, [epId]: value }
    const newData = { ...data, readings: newReadings }
    onChange(newData)

    // Push all statuses to parent for overall status calculation
    const statuses = EARTH_PITS.map((ep) => getStatus(newReadings[ep.epId] ?? ""))
    onStatusChange(statuses)
  }

  // Equipment row handlers
  function handleEquipmentChange(
    index: number,
    field: "make" | "model",
    value: string
  ) {
    const updated = data.equipment.map((eq, i) =>
      i === index ? { ...eq, [field]: value, ...(field === "make" ? { model: "" } : {}) } : eq
    )
    onChange({ ...data, equipment: updated })
  }

  function addEquipmentRow() {
    onChange({ ...data, equipment: [...data.equipment, { make: "", model: "" }] })
  }

  function removeEquipmentRow(index: number) {
    if (data.equipment.length === 1) return // keep at least one row
    onChange({ ...data, equipment: data.equipment.filter((_, i) => i !== index) })
  }

  return (
    <section className="bg-white border border-gray-100 rounded-xl p-5">
      <SectionHeading>Earthing Resistance Readings (Ohms)</SectionHeading>

      {/* Table header */}
      <div className="grid grid-cols-[auto_2fr_1fr_auto] gap-3 pb-2 border-b border-gray-100 mb-1">
        <span className="text-[11px] font-semibold text-gray-400 w-8">EP</span>
        <span className="text-[11px] font-semibold text-gray-400">Point / Location</span>
        <span className="text-[11px] font-semibold text-gray-400 text-right">Reading (Ω)</span>
        <span className="text-[11px] font-semibold text-gray-400 w-14 text-center">Status</span>
      </div>

      {/* Reading rows */}
      {EARTH_PITS.map((pit, idx) => {
        const value = data.readings[pit.epId] ?? ""
        const status = getStatus(value)
        const isLast = idx === EARTH_PITS.length - 1

        return (
          <div
            key={pit.epId}
            className={`grid grid-cols-[auto_2fr_1fr_auto] gap-3 items-center py-2.5 ${
              isLast ? "" : "border-b border-gray-50"
            }`}
          >
            <span className="text-[11px] font-mono text-gray-400 w-8">{pit.epId}</span>
            <span className="text-sm text-gray-700 leading-snug">{pit.label}</span>
            <Input
              type="number"
              step="0.1"
              min="0"
              placeholder="0.0"
              value={value}
              onChange={(e) => handleReadingChange(pit.epId, e.target.value)}
              className="h-9 text-right tabular-nums"
            />
            <StatusBadge status={status} />
          </div>
        )
      })}

      {/* Divider */}
      <div className="h-px bg-gray-100 my-4" />

      {/* Test Equipment */}
      <div className="flex flex-col gap-3">
        <Label className="text-sm font-medium text-gray-700">Test Equipment Used</Label>

        {data.equipment.map((eq, idx) => (
          <div key={idx} className="grid grid-cols-2 gap-3 items-center">
            {/* Make */}
            <Select
              value={eq.make}
              onValueChange={(v) => handleEquipmentChange(idx, "make", v ?? "")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Make" />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(EQUIPMENT_OPTIONS).map((make) => (
                  <SelectItem key={make} value={make}>{make}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Model — depends on selected make */}
            <div className="flex gap-2 items-center">
              <Select
                value={eq.model}
                onValueChange={(v) => handleEquipmentChange(idx, "model", v ?? "")}
                disabled={!eq.make}
              >
                <SelectTrigger>
                  <SelectValue placeholder={eq.make ? "Model" : "Select make first"} />
                </SelectTrigger>
                <SelectContent>
                  {(EQUIPMENT_OPTIONS[eq.make] ?? []).map((model) => (
                    <SelectItem key={model} value={model}>{model}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Remove button — only show if more than 1 row */}
              {data.equipment.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeEquipmentRow(idx)}
                  className="text-xs text-gray-400 hover:text-[#E41E23] transition-colors duration-150 shrink-0"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        ))}

        <Button
          type="button"
          variant="outline"
          onClick={addEquipmentRow}
          className="w-full text-sm text-gray-500 border-dashed border-gray-200 hover:border-[#027D3F] hover:text-[#027D3F] transition-colors duration-150 flex items-center gap-1.5"
        >
          <FiPlus size={14} />
          Add Another Equipment
        </Button>
      </div>
    </section>
  )
}