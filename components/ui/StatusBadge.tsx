"use client"

// Earthing resistance thresholds (Ohms):
//   value === null / ""  → "--"    (no reading entered)
//   value <= 2            → "Good"
//   value <= 5             → "Pass"
//   value >  5              → "Fail"

export type BadgeStatus = "--" | "Pass" | "Fail"

export function getStatus(value: string, epId?: string): BadgeStatus {
  const num = parseFloat(value)
  if (value === "" || isNaN(num)) return "--"
  
  if (epId === "EP-1" || epId === "EP-2") {
    if (num >= 200 && num <= 270) return "Pass"
    return "Fail"
  } else {
    if (num <= 5) return "Pass"
    return "Fail"
  }
}

const styles: Record<BadgeStatus, string> = {
  "--": "bg-gray-100 text-gray-400 border border-transparent",
  "Pass": "bg-[#E8F5EE] text-[#027D3F] border border-[#B9DEC8]",
  "Fail": "bg-[#E41E23]/10 text-[#E41E23] border border-[#E41E23]",
}

export function StatusBadge({ status = "--" }: { status?: BadgeStatus }) {
  return (
    <span
      className={`inline-flex justify-center items-center text-xs font-semibold px-2.5 py-1 rounded-full w-14 text-center ${styles[status]}`}
    >
      {status === "Fail" ? "Flagged" : status}
    </span>
  )
}