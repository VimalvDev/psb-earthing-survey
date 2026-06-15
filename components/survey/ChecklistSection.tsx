"use client"

import { SectionHeading } from "@/components/ui/SectionHeading"

const CHECKLIST_ITEMS = [
  "Earth pit cover intact",
  "Earth wire visible & undamaged",
  "No corrosion on clamps",
  "Proper G.I. wire used",
  "Earth pits filled with charcoal/salt",
  "All panels bonded to earth",
  "Separate neutral & earth bus",
  "Earth continuity verified",
  "Masonry/inspection pit in good shape",
  "Documentation updated",
]

interface ChecklistSectionProps {
  checked: Record<string, boolean>
  onChange: (checked: Record<string, boolean>) => void
}

export function ChecklistSection({ checked, onChange }: ChecklistSectionProps) {
  function toggle(label: string) {
    onChange({ ...checked, [label]: !checked[label] })
  }

  function selectAll() {
    const all: Record<string, boolean> = {}
    CHECKLIST_ITEMS.forEach((item) => (all[item] = true))
    onChange(all)
  }

  function clearAll() {
    const none: Record<string, boolean> = {}
    CHECKLIST_ITEMS.forEach((item) => (none[item] = false))
    onChange(none)
  }

  const checkedCount = Object.values(checked).filter(Boolean).length

  return (
    <section className="bg-white border border-gray-100 rounded-xl p-5">
      <div className="flex items-center gap-3 mb-5">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest whitespace-nowrap">
          Visual Inspection Checklist
        </h2>
        <div className="flex-1 h-px bg-gray-100" />
        {/* Checked count */}
        <span className="text-[11px] text-gray-400 shrink-0">
          {checkedCount}/{CHECKLIST_ITEMS.length}
        </span>
        <span className="text-gray-200 text-xs">|</span>
        <button
          type="button"
          onClick={selectAll}
          className="text-xs text-gray-500 hover:text-[#027D3F] transition-colors duration-150 font-medium shrink-0"
        >
          Select All
        </button>
        <span className="text-gray-200 text-xs">|</span>
        <button
          type="button"
          onClick={clearAll}
          className="text-xs text-gray-500 hover:text-[#E41E23] transition-colors duration-150 font-medium shrink-0"
        >
          Clear All
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {CHECKLIST_ITEMS.map((item) => (
          <label
            key={item}
            className={`flex items-center gap-2.5 text-sm text-gray-700 border rounded-lg px-3 py-2.5 cursor-pointer transition-colors duration-150 select-none
              ${
                checked[item]
                  ? "bg-[#027D3F]/5 border-[#027D3F]/25 text-[#027D3F]"
                  : "bg-white border-gray-100 hover:bg-[#027D3F]/5 hover:border-[#027D3F]/20"
              }`}
          >
            <input
              type="checkbox"
              className="w-4 h-4 shrink-0 accent-[#027D3F]"
              checked={!!checked[item]}
              onChange={() => toggle(item)}
            />
            {item}
          </label>
        ))}
      </div>
    </section>
  )
}