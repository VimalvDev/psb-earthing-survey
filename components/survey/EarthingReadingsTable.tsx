"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SectionHeading } from "@/components/ui/SectionHeading";
import {
  StatusBadge,
  getStatus,
  BadgeStatus,
} from "@/components/ui/StatusBadge";

const EARTH_PITS = [
  { epId: "EP-1", label: "Phase/Neutral (P/N)" },
  { epId: "EP-2", label: "Phase/Earth (P/E)" },
  { epId: "EP-3", label: "Earth/Neutral (E/N)" },
  { epId: "EP-4", label: "Lightning Arrester" },
];

const EQUIPMENT_OPTIONS: Record<string, string[]> = {
  WACO: ["KEW 4105A", "4102AH", "4300"],
  FLUKE: ["1625-2 GEO", "1623-2 GEO"],
};

export interface ReadingsData {
  readings: Record<string, string>;
  equipment: { make: string; model: string }[];
}

interface EarthingReadingsTableProps {
  data: ReadingsData;
  onChange: (data: ReadingsData) => void;
  onStatusChange: (statuses: BadgeStatus[]) => void;
}

export function EarthingReadingsTable({
  data,
  onChange,
  onStatusChange,
}: EarthingReadingsTableProps) {
  function handleReadingChange(epId: string, value: string) {
    const newReadings = { ...data.readings, [epId]: value };
    onChange({ ...data, readings: newReadings });
    const statuses = EARTH_PITS.map((ep) =>
      getStatus(newReadings[ep.epId] ?? "", ep.epId),
    );
    onStatusChange(statuses);
  }
  return (
    <section className="bg-white border border-gray-200 rounded-xl p-4 md:p-5">
      <SectionHeading>Earthing Readings (v)</SectionHeading>

      {/* ── Desktop table header (hidden on mobile) ── */}
      <div className="hidden md:grid md:grid-cols-[auto_2fr_1fr_auto] gap-3 pb-2 border-b border-gray-100 mb-1">
        <span className="text-[10px] font-semibold text-gray-400 w-8">EP</span>
        <span className="text-[10px] font-semibold text-gray-400">
          Point / Location
        </span>
        <span className="text-[10px] font-semibold text-gray-400 text-right">
          Reading (V)
        </span>
        <span className="text-[10px] font-semibold text-gray-400 w-14 text-center">
          Status
        </span>
      </div>

      {/* ── Rows ── */}
      {EARTH_PITS.map((pit, idx) => {
        const value = data.readings[pit.epId] ?? "";
        const status = getStatus(value, pit.epId);
        const isLast = idx === EARTH_PITS.length - 1;

        return (
          <div
            key={pit.epId}
            className={`py-2 ${isLast ? "" : "border-b border-gray-50"}`}
          >
            {/* Mobile layout */}
            <div className="md:hidden flex flex-col gap-2">
              <div className="flex flex-col">
                <span className="text-[10px] font-mono font-semibold text-gray-500 uppercase tracking-wider mb-0.5">
                  {pit.epId}
                </span>
                <span className="text-sm font-semibold text-gray-800">
                  {pit.label}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 items-center mt-1">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-gray-500 uppercase">
                    Reading
                  </span>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="0.0"
                    value={value}
                    onChange={(e) =>
                      handleReadingChange(pit.epId, e.target.value)
                    }
                    className="h-9 text-sm text-right tabular-nums flex-1 bg-gray-50 border-gray-200"
                  />
                </div>
                <div className="flex items-center gap-2 justify-end">
                  <span className="text-[11px] font-semibold text-gray-500 uppercase">
                    Status
                  </span>
                  <StatusBadge status={status} />
                </div>
              </div>
            </div>

            {/* Desktop layout */}
            <div className="hidden md:grid md:grid-cols-[auto_2fr_1fr_auto] gap-3 items-center">
              <span className="text-xs font-mono font-semibold text-gray-500 w-8">
                {pit.epId}
              </span>
              <span className="text-sm font-medium text-gray-800">
                {pit.label}
              </span>
              <Input
                type="number"
                step="0.1"
                min="0"
                placeholder="0.0"
                value={value}
                onChange={(e) => handleReadingChange(pit.epId, e.target.value)}
                className="h-9 text-sm text-right tabular-nums bg-gray-50 border-gray-200"
              />
              <StatusBadge status={status} />
            </div>
          </div>
        );
      })}

      {/* Divider */}
      <div className="h-px bg-gray-100 my-3" />

      {/* ── Test Equipment ── */}
      <div className="flex flex-col gap-2">
        <Label className="text-[13px] font-semibold text-gray-700">
          Test Equipment Used
        </Label>
        <div className="flex gap-2">
          {(["WACO", "FLUKE"] as const).map((make) => {
            const selected = data.equipment.some((eq) => eq.make === make)
            return (
              <button
                key={make}
                type="button"
                onClick={() => {
                  const has = data.equipment.some((eq) => eq.make === make)
                  const updated = has
                    ? data.equipment.filter((eq) => eq.make !== make)
                    : [...data.equipment, { make, model: "" }]
                  onChange({ ...data, equipment: updated })
                }}
                className={`flex-1 py-2 rounded-lg border text-[13px] font-semibold transition-all duration-150 outline-none
                  ${selected
                    ? "bg-[#027D3F]/10 border-[#027D3F] text-[#027D3F]"
                    : "bg-white border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700 hover:bg-gray-50"
                  }`}
              >
                {make}
              </button>
            )
          })}
        </div>
        {data.equipment.length === 0 && (
          <p className="text-xs font-medium text-amber-600 mt-0.5">
            Select at least one instrument used for testing
          </p>
        )}
      </div>
    </section>
  );
}
