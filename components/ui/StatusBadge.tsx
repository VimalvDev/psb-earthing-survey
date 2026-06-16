"use client"

// Earthing resistance thresholds (Ohms):
//   value === null / ""  → "--"    (no reading entered)
//   value <= 2            → "Good"
//   value <= 5             → "Pass"
//   value >  5              → "Fail"

export type BadgeStatus = "--" | "Good" | "Pass" | "Fail"

export function getStatus(value: string): BadgeStatus {
  const num = parseFloat(value)
  if (value === "" || isNaN(num)) return "--"
  if (num <= 2) return "Good"
  if (num <= 5) return "Pass"
  return "Fail"
}

const styles: Record<BadgeStatus, string> = {
  "--":   "bg-gray-100 text-gray-400",
  "Good": "bg-[#027D3F]/10 text-[#027D3F]",
  "Pass": "bg-[#BDD70C]/20 text-[#8A9C08]",
  "Fail": "bg-[#E41E23]/10 text-[#E41E23]",
}

export function StatusBadge({ status = "--" }: { status?: BadgeStatus }) {
  return (
    <span
      className={`inline-flex justify-center items-center text-xs font-semibold px-2.5 py-1 rounded-full w-14 text-center ${styles[status]}`}
    >
      {status}
    </span>
  )
}