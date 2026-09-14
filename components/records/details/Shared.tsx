import { motion } from "framer-motion";
import { FiCheckCircle, FiXCircle } from "react-icons/fi";

export type OverallStatus = "Pass" | "Fail";

export interface SurveyDetail {
  id: string;
  survey_id: string;
  bic: string | null;
  branch_name: string | null;
  zone: string | null;
  district: string | null;
  state: string | null;
  address: string | null;
  manager_name: string | null;
  phone_no: string | null;
  phone_no_alt: string | null;
  visit_date: string | null;
  survey_type: string | null;
  surveyor_emp_id: string | null;
  surveyor_email: string | null;
  surveyor_name?: string;
  surveyor_mobile?: string;
  readings: Record<string, string> | null;
  equipment: string[] | null;
  checklist: Record<string, boolean> | null;
  overall_status: string | null;
  remarks: string | null;
  next_inspection_date: string | null;
  site_photo: Record<string, string> | null;
  signature: { method: string; base64: string; mimeType: string } | null;
  status: string | null;
  created_at: string;
  updated_at: string | null;
  is_flagged?: boolean;
}

export const EP_LABELS: Record<string, string> = {
  "EP-1": "Phase/Neutral (P/N)",
  "EP-2": "Phase/Earth (P/E)",
  "EP-3": "Earth/Neutral (E/N)",
  "EP-4": "Lightning Arrester",
};

export const OVERALL_CONFIG: Record<
  OverallStatus,
  { badge: string; icon: React.ReactNode; bar: string }
> = {
  Pass: {
    badge: "bg-[#027D3F]/10 text-[#027D3F]",
    icon: <FiCheckCircle className="w-4 h-4" />,
    bar: "bg-[#027D3F]",
  },
  Fail: {
    badge: "bg-[#E41E23]/10 text-[#E41E23]",
    icon: <FiXCircle className="w-4 h-4" />,
    bar: "bg-[#E41E23]",
  },
};

export const SURVEY_TYPE_LABELS: Record<string, string> = {
  routine: "Routine Inspection",
  "post-rectification": "Post-Rectification",
  complaint: "Complaint Based",
  "annual-audit": "Annual Audit",
};

export function formatDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return iso;
  }
}

export function getReadingStatus(value: string, epId?: string): { label: string; badge: string } {
  const num = parseFloat(value);
  if (isNaN(num)) return { label: "N/A", badge: "bg-gray-100 text-gray-600 border-gray-200" };

  if (epId === "EP-1" || epId === "EP-2") {
    if (num >= 220 && num <= 240) return { label: "Normal", badge: "bg-green-50 text-green-700 border-green-200" };
    return { label: "Abnormal", badge: "bg-red-50 text-red-700 border-red-200" };
  } else if (epId === "EP-3" || epId === "EP-4") {
    if (num < 2) return { label: "Excellent", badge: "bg-green-50 text-green-700 border-green-200" };
    if (num <= 5) return { label: "Acceptable", badge: "bg-yellow-50 text-yellow-700 border-yellow-200" };
    return { label: "High", badge: "bg-red-50 text-red-700 border-red-200" };
  }
  return { label: "Unknown", badge: "bg-gray-100 text-gray-600 border-gray-200" };
}

export function StaggerSection({ children, index }: { children: React.ReactNode; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.45,
        delay: index * 0.1,
        ease: [0.25, 0.1, 0.25, 1],
      }}
    >
      {children}
    </motion.div>
  );
}

export function Field({ label, value, editing, onChange, type = "text" }: { label: string; value: string; editing?: boolean; onChange?: (v: string) => void; type?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] text-gray-400 uppercase tracking-wide">{label}</span>
      {editing && onChange ? (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="text-sm font-medium text-gray-800 border border-gray-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-[#027D3F] focus:ring-1 focus:ring-[#027D3F]/20 transition-colors bg-[#FAF6EE]"
        />
      ) : (
        <span className="text-sm font-medium text-gray-800">{value || "—"}</span>
      )}
    </div>
  );
}

export function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-base font-bold text-gray-900 mb-6 flex items-center gap-2 uppercase tracking-wide">
      <span className="w-1 h-4 bg-[#027D3F] rounded-full inline-block"></span>
      {children}
    </h2>
  );
}
