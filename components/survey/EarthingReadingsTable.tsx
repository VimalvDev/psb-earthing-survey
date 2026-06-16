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

const EARTH_PITS = [
  { epId: "EP-1", label: "Main Building" },
  { epId: "EP-2", label: "Server Rack / UPS" },
  { epId: "EP-3", label: "ATM Rack" },
  { epId: "EP-4", label: "Lightning Arrester" },
]

const EQUIPMENT_OPTIONS: Record<string, string[]> = {
  WACO: ["KEW 4105A", "4102AH", "4300"],
  FLUKE: ["1625-2 GEO", "1623-2 GEO"],
}

export interface ReadingsData {
  readings: Record<string, string>
  equipment: { make: string; model: string }[]
}

interface EarthingReadingsTableProps {
  data: ReadingsData
  onChange: (data: ReadingsData) => void
  onStatusChange: (statuses: BadgeStatus[]) => void
}

export function EarthingReadingsTable({
  data,
  onChange,
  onStatusChange,
}: EarthingReadingsTableProps) {
  function handleReadingChange(epId: string, value: string) {
    const newReadings = { ...data.readings, [epId]: value }
    onChange({ ...data, readings: newReadings })
    const statuses = EARTH_PITS.map((ep) => getStatus(newReadings[ep.epId] ?? ""))
    onStatusChange(statuses)
  }

  function handleEquipmentChange(index: number, field: "make" | "model", value: string) {
    const updated = data.equipment.map((eq, i) =>
      i === index ? { ...eq, [field]: value, ...(field === "make" ? { model: "" } : {}) } : eq
    )
    onChange({ ...data, equipment: updated })
  }

  function addEquipmentRow() {
    onChange({ ...data, equipment: [...data.equipment, { make: "", model: "" }] })
  }

  function removeEquipmentRow(index: number) {
    if (data.equipment.length === 1) return
    onChange({ ...data, equipment: data.equipment.filter((_, i) => i !== index) })
  }

  return (
    <section className="bg-white border border-gray-100 rounded-xl p-4 md:p-5">
      <SectionHeading>Earthing Readings (Ohms)</SectionHeading>

      {/* ── Desktop table header (hidden on mobile) ── */}
      <div className="hidden md:grid md:grid-cols-[auto_2fr_1fr_auto] gap-3 pb-2 border-b border-gray-100 mb-1">
        <span className="text-[10px] font-semibold text-gray-400 w-8">EP</span>
        <span className="text-[10px] font-semibold text-gray-400">Point / Location</span>
        <span className="text-[10px] font-semibold text-gray-400 text-right">Reading (Ω)</span>
        <span className="text-[10px] font-semibold text-gray-400 w-14 text-center">Status</span>
      </div>

      {/* ── Rows ── */}
      {EARTH_PITS.map((pit, idx) => {
        const value = data.readings[pit.epId] ?? ""
        const status = getStatus(value)
        const isLast = idx === EARTH_PITS.length - 1

        return (
          <div
            key={pit.epId}
            className={`py-2 ${isLast ? "" : "border-b border-gray-50"}`}
          >
            {/* Mobile layout */}
            <div className="md:hidden">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[9px] font-mono font-semibold text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded shrink-0">
                  {pit.epId}
                </span>
                <span className="text-xs font-medium text-gray-800 leading-tight">
                  {pit.label}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 flex-1">
                  <span className="text-[10px] text-gray-400 shrink-0">Reading (Ω)</span>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="0.0"
                    value={value}
                    onChange={(e) => handleReadingChange(pit.epId, e.target.value)}
                    className="h-8 text-xs text-right tabular-nums flex-1"
                  />
                </div>
                <StatusBadge status={status} />
              </div>
            </div>

            {/* Desktop layout */}
            <div className="hidden md:grid md:grid-cols-[auto_2fr_1fr_auto] gap-3 items-center">
              <span className="text-[10px] font-mono text-gray-400 w-8">{pit.epId}</span>
              <span className="text-xs text-gray-700 leading-snug">{pit.label}</span>
              <Input
                type="number"
                step="0.1"
                min="0"
                placeholder="0.0"
                value={value}
                onChange={(e) => handleReadingChange(pit.epId, e.target.value)}
                className="h-8 text-xs text-right tabular-nums"
              />
              <StatusBadge status={status} />
            </div>
          </div>
        )
      })}

      {/* Divider */}
      <div className="h-px bg-gray-100 my-3" />

      {/* ── Test Equipment ── */}
      <div className="flex flex-col gap-2">
        <Label className="text-xs font-medium text-gray-600">Test Equipment Used</Label>

        {data.equipment.map((eq, idx) => (
          <div key={idx} className="flex flex-col sm:grid sm:grid-cols-2 gap-2 sm:items-center">
            {/* Make */}
            <Select
              value={eq.make}
              onValueChange={(v) => handleEquipmentChange(idx, "make", v ?? "")}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Make" />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(EQUIPMENT_OPTIONS).map((make) => (
                  <SelectItem key={make} value={make} className="text-xs">{make}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Model + remove */}
            <div className="flex gap-2 items-center">
              <Select
                value={eq.model}
                onValueChange={(v) => handleEquipmentChange(idx, "model", v ?? "")}
                disabled={!eq.make}
              >
                <SelectTrigger className="flex-1 h-8 text-xs">
                  <SelectValue placeholder={eq.make ? "Model" : "Select make first"} />
                </SelectTrigger>
                <SelectContent>
                  {(EQUIPMENT_OPTIONS[eq.make] ?? []).map((model) => (
                    <SelectItem key={model} value={model} className="text-xs">{model}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {data.equipment.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeEquipmentRow(idx)}
                  className="text-[10px] text-gray-400 hover:text-[#E41E23] transition-colors duration-150 shrink-0 w-6 h-6 flex items-center justify-center rounded hover:bg-red-50"
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
          className="w-full h-8 text-xs text-gray-500 border-dashed border-gray-200 hover:border-[#027D3F] hover:text-[#027D3F] transition-colors duration-150 flex items-center gap-1.5"
        >
          <FiPlus size={12} />
          Add Another Equipment
        </Button>
      </div>
    </section>
  )
}