"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import {
  FiArrowLeft,
  FiPrinter,
  FiEdit2,
  FiSave,
  FiX,
  FiCheckCircle,
  FiCircle,
  FiAlertTriangle,
  FiXCircle,
  FiZap,
  FiLoader,
  FiImage,
  FiTrash2,
  FiDownload,
} from "react-icons/fi";
import { Flag } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { PhotoCapture } from "@/components/survey/PhotoCapture";
import { useCurrentUser, LoggedInUser } from "@/lib/hooks/use-current-user";

// ── Types ──────────────────────────────────────────────────────────────────

type OverallStatus = "Pass" | "Fail";

interface SurveyDetail {
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

// ── Constants ──────────────────────────────────────────────────────────────

const EP_LABELS: Record<string, string> = {
  "EP-1": "Phase/Neutral (P/N)",
  "EP-2": "Phase/Earth (P/E)",
  "EP-3": "Earth/Neutral (E/N)",
  "EP-4": "Lightning Arrester",
};

const OVERALL_CONFIG: Record<
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

const SURVEY_TYPE_LABELS: Record<string, string> = {
  routine: "Routine Inspection",
  "post-rectification": "Post-Rectification",
  complaint: "Complaint Based",
  "annual-audit": "Annual Audit",
};

// ── Helpers ────────────────────────────────────────────────────────────────

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  if (/^\d{2}-\d{2}-\d{4}$/.test(iso)) return iso;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getReadingStatus(value: string, epId?: string): { label: string; badge: string } {
  const v = parseFloat(value);
  if (isNaN(v)) return { label: "—", badge: "bg-gray-100 text-gray-400" };

  if (epId === "EP-1" || epId === "EP-2") {
    // 210 to 260 range
    if (v >= 210 && v <= 260) return { label: "Pass", badge: "bg-[#E6F1FB] text-[#185FA5]" };
    return { label: "Fail", badge: "bg-[#E41E23]/10 text-[#E41E23]" };
  } else {
    // 0 to 5 range
    if (v <= 5) return { label: "Pass", badge: "bg-[#E6F1FB] text-[#185FA5]" };
    return { label: "Fail", badge: "bg-[#E41E23]/10 text-[#E41E23]" };
  }
}

// ── Skeleton ───────────────────────────────────────────────────────────────

function SkeletonDetail() {
  return (
    <div className="min-h-screen bg-[#FAF6EE]">
      <div className="max-w-6xl">
        <div className="flex items-center justify-between mb-6">
          <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
          <div className="flex gap-2">
            <div className="h-8 w-24 bg-gray-200 rounded-xl animate-pulse" />
            <div className="h-8 w-20 bg-gray-200 rounded-xl animate-pulse" />
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="bg-gray-200 h-20 w-full animate-pulse" />
          <div className="h-1 bg-gray-100 w-full" />
          <div className="px-6 sm:px-8 py-7 flex flex-col gap-8">
            {/* Section skeletons */}
            {[6, 4, 4, 6, 3].map((fields, si) => (
              <div key={si}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-3 w-28 bg-gray-100 rounded animate-pulse" />
                  <div className="flex-1 h-px bg-gray-100" />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4">
                  {Array.from({ length: fields }).map((_, i) => (
                    <div key={i} className="flex flex-col gap-1.5">
                      <div className="h-2.5 w-16 bg-gray-100 rounded animate-pulse" />
                      <div className="h-4 w-32 bg-gray-100 rounded animate-pulse" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="px-6 sm:px-8 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
            <div className="h-3 w-48 bg-gray-200 rounded animate-pulse" />
            <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest whitespace-nowrap">
        {children}
      </span>
      <div className="flex-1 h-px bg-gray-100" />
    </div>
  );
}

function Field({
  label,
  value,
  editing,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  editing?: boolean;
  onChange?: (v: string) => void;
  type?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] text-gray-400 uppercase tracking-wide">
        {label}
      </span>
      {editing && onChange ? (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="text-sm font-medium text-gray-800 border border-gray-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-[#027D3F] focus:ring-1 focus:ring-[#027D3F]/20 transition-colors bg-[#FAF6EE]"
        />
      ) : (
        <span className="text-sm font-medium text-gray-800">
          {value || "—"}
        </span>
      )}
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

const supabase = createClient();

export default function RecordDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const surveyId = params?.id as string;

  const { data: currentUser, isLoading: userLoading } = useCurrentUser();
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<SurveyDetail>>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // ── Fetch user ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!userLoading && currentUser === null) {
      router.push("/login");
    }
  }, [currentUser, userLoading, router]);

  useEffect(() => {
    if (!previewImage) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setPreviewImage(null);
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [previewImage]);

  // ── Fetch survey via TanStack Query (uses prefetch cache if available) ──
  const {
    data: record,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["survey-detail", surveyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("surveys")
        .select("*")
        .eq("survey_id", surveyId)
        .single();
      if (error) throw error;
      
      let surveyor_name = data.surveyor_name || "";
      let surveyor_mobile = data.surveyor_mobile || "";
      
      if (!surveyor_name && data.surveyor_emp_id) {
        const { data: eng } = await supabase
          .from("engineers")
          .select("name, mobile_number")
          .eq("emp_id", data.surveyor_emp_id)
          .single();
        if (eng) {
          surveyor_name = eng.name;
          surveyor_mobile = eng.mobile_number;
        }
      }

      return { ...data, surveyor_name, surveyor_mobile } as SurveyDetail;
    },
    staleTime: 2 * 60 * 1000,
  });

  // ── Edit handlers ───────────────────────────────────────────────────────
  function startEditing() {
    if (!record) return;
    setEditData({ ...record });
    setEditing(true);
    setSaveError("");
  }

  function cancelEditing() {
    setEditing(false);
    setEditData({});
    setSaveError("");
  }

  function setField(field: keyof SurveyDetail, value: string) {
    setEditData((prev) => ({ ...prev, [field]: value }));
  }

  function setReading(epKey: string, value: string) {
    setEditData((prev) => ({
      ...prev,
      readings: {
        ...(prev.readings ?? record?.readings ?? {}),
        [epKey]: value,
      },
    }));
  }

  function toggleChecklist(label: string) {
    const current = editData.checklist ?? record?.checklist ?? {};
    setEditData((prev) => ({
      ...prev,
      checklist: { ...current, [label]: !current[label] },
    }));
  }

  async function saveChanges() {
    if (!record) return;
    setSaving(true);
    setSaveError("");

    let finalVisitDate = editData.visit_date;
    if (finalVisitDate) {
      finalVisitDate = finalVisitDate.trim();
      if (/^\d{2}-\d{2}-\d{4}$/.test(finalVisitDate)) {
        const [dd, mm, yyyy] = finalVisitDate.split("-");
        finalVisitDate = `${yyyy}-${mm}-${dd}`;
      } else if (/^\d{4}$/.test(finalVisitDate)) {
        finalVisitDate = `${finalVisitDate}-01-01`;
      }
    }

    let engineersUpdate = undefined;
    if (
      editData.surveyor_name !== undefined ||
      editData.surveyor_mobile !== undefined ||
      editData.surveyor_emp_id !== undefined
    ) {
      engineersUpdate = {
        name: editData.surveyor_name ?? record.surveyor_name,
        mobile_number: editData.surveyor_mobile ?? record.surveyor_mobile,
        emp_id: editData.surveyor_emp_id ?? record.surveyor_emp_id,
      };
    }

    const surveyUpdate = {
      bic: editData.bic,
      branch_name: editData.branch_name,
      zone: editData.zone,
      district: editData.district,
      state: editData.state,
      address: editData.address,
      manager_name: editData.manager_name,
      phone_no: editData.phone_no,
      phone_no_alt: editData.phone_no_alt,
      visit_date: finalVisitDate,
      survey_type: editData.survey_type,
      surveyor_emp_id: editData.surveyor_emp_id,
      readings: editData.readings,
      checklist: editData.checklist,
      overall_status: editData.overall_status,
      site_photo: editData.site_photo,
      remarks: editData.remarks,
      next_inspection_date: editData.next_inspection_date,
    };

    try {
      const res = await fetch(`/api/surveys/${record.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          surveyUpdate,
          engineersUpdate,
          surveyorEmail: record.surveyor_email,
        }),
      });

      if (!res.ok) {
        throw new Error("Save failed");
      }
    } catch (err) {
      setSaving(false);
      setSaveError("Save failed. Please try again.");
      return;
    }

    setSaving(false);

    // Invalidate cache so fresh data loads
    await queryClient.invalidateQueries({
      queryKey: ["survey-detail", surveyId],
    });
    await queryClient.invalidateQueries({ queryKey: ["records"] });
    setEditing(false);
    setEditData({});
  }

  async function handleDelete() {
    if (!record) return;
    if (!confirm("Are you sure you want to delete this survey record? This action cannot be undone.")) return;

    try {
      const res = await fetch(`/api/surveys/${record.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to delete record.");
        return;
      }

      queryClient.invalidateQueries({ queryKey: ["records"] });
      router.push("/dashboard/records");
    } catch {
      alert("Something went wrong. Please try again.");
    }
  }

  const [isFlagging, setIsFlagging] = useState(false);

  async function toggleFlag() {
    if (!record) return;
    setIsFlagging(true);
    const isCurrentlyFlagged = record.overall_status === "Flagged" || record.overall_status === "Fail";
    const newStatus = isCurrentlyFlagged ? "Pass" : "Fail";
    
    // Snapshot previous value for rollback
    const previousRecord = queryClient.getQueryData(["survey-detail", surveyId]);
    
    // Optimistically update cache
    queryClient.setQueryData(["survey-detail", surveyId], (old: any) => old ? {
      ...old,
      overall_status: newStatus,
    } : old);

    try {
      const res = await fetch(`/api/surveys/${record.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ surveyUpdate: { overall_status: newStatus } }),
      });
      if (!res.ok) {
        throw new Error("Failed to flag report.");
      }
      // invalidate list queries in background
      queryClient.invalidateQueries({ queryKey: ["records"] });
    } catch (err) {
      alert("An error occurred while flagging the report.");
      // Rollback cache on error
      queryClient.setQueryData(["survey-detail", surveyId], previousRecord);
    } finally {
      setIsFlagging(false);
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────
  if (isLoading) return <SkeletonDetail />;

  if (isError || !record) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-base font-semibold text-gray-700">
          Survey record not found.
        </p>
        <Link
          href="/dashboard/records"
          className="text-sm text-[#027D3F] hover:underline"
        >
          ← Back to Records
        </Link>
      </div>
    );
  }

  const r = editing ? { ...record, ...editData } : record;
  const isAdmin = currentUser?.role === "admin";
  const canEditRecord =
    currentUser?.role === "admin" || currentUser?.role === "manager";
  const overallStatus = (r.overall_status ?? "") as OverallStatus;
  const overallCfg = OVERALL_CONFIG[overallStatus] ?? OVERALL_CONFIG["Fail"];
  const hasSignature = !!r.signature?.base64;
  const hasPhotos = !!(r.site_photo && Object.keys(r.site_photo).length > 0);

  return (
    <>
      {/* ── Print styles ─────────────────────────────────────────────────── */}
      <style>{`
  @media print {
    header, nav, aside, footer,
    [data-sidebar], [data-nav],
    .print\\:hidden { display: none !important; }
    
    body { margin: 0 !important; }
    
    @page {
      size: A4;
      margin: 1.54cm;
    }
  }
`}</style>

      <div>
        <div className="max-w-6xl">
          {/* Top bar — screen only */}
          <div className="flex items-center justify-between mb-3 print:hidden">
            <Link
              href="/dashboard/records"
              className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#027D3F] transition-colors group"
            >
              <FiArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              Back
            </Link>
            <div className="flex items-center gap-2">
              <AnimatePresence mode="popLayout">
                {canEditRecord && !editing && (
                  <motion.button
                    key="btn-edit"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    onClick={startEditing}
                    className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 text-[13px] sm:text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-[10px] shadow-sm hover:border-[#027D3F] hover:text-[#027D3F] hover:shadow transition-all"
                  >
                    <FiEdit2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    Edit
                  </motion.button>
                )}
                {isAdmin && !editing && (
                  <motion.button
                    key="btn-delete"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    onClick={handleDelete}
                    className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 text-[13px] sm:text-sm font-semibold text-white bg-red-600 rounded-[10px] shadow-sm hover:bg-red-700 hover:shadow transition-all"
                  >
                    <FiTrash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    Delete
                  </motion.button>
                )}
                {editing && (
                  <motion.div
                    key="btn-group-editing"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="flex items-center gap-1.5 sm:gap-2"
                  >
                    <button
                      onClick={cancelEditing}
                      className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 text-[13px] sm:text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-[10px] shadow-sm hover:bg-gray-50 transition-all"
                    >
                      <FiX className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      Cancel
                    </button>
                    <button
                      onClick={saveChanges}
                      disabled={saving}
                      className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 text-[13px] sm:text-sm font-semibold text-white bg-[#027D3F] rounded-[10px] shadow-sm hover:bg-[#02612f] disabled:opacity-60 transition-all"
                    >
                      {saving ? (
                        <>
                          <FiLoader className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
                          Saving…
                        </>
                      ) : (
                        <>
                          <FiSave className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          Save
                        </>
                      )}
                    </button>
                  </motion.div>
                )}
                {!editing && (() => {
                  const isRecordFlagged = record?.overall_status === "Flagged" || record?.overall_status === "Fail";
                  return (
                    <motion.button
                      key="btn-flag"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      onClick={toggleFlag}
                      disabled={isFlagging}
                      className={`inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 text-[13px] sm:text-sm font-semibold rounded-[10px] shadow-sm transition-all disabled:opacity-60
                        ${isRecordFlagged 
                          ? "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100" 
                          : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
                        }`}
                    >
                      {isFlagging ? (
                        <FiLoader className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
                      ) : (
                        <Flag className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isRecordFlagged ? "fill-red-200" : ""}`} />
                      )}
                      {isRecordFlagged ? "Unflag" : "Flag"}
                    </motion.button>
                  );
                })()}
                {!editing && (
                  <motion.button
                    key="btn-print"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 text-[13px] sm:text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-[10px] shadow-sm hover:bg-gray-50 transition-all"
                  >
                    <FiPrinter className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    Print
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Banners */}
          {saveError && (
            <div className="mb-4 px-4 py-3 rounded-xl border border-[#F5B9B9] bg-[#FDECEC] text-sm text-[#D81F26] print:hidden">
              {saveError}
            </div>
          )}
          {editing && (
            <div className="mb-4 px-4 py-3 rounded-xl border border-[#E7E9A9] bg-[#F6F8D7] text-sm text-[#768A06] font-medium print:hidden">
              You are editing this record. Changes will be saved to the
              database.
            </div>
          )}

          {/* Document */}
          <div
            id="print-document"
            className="flex flex-col gap-1 lg:gap-1 print:block print:bg-white print:gap-0"
          >
            {/* ── Main Report Header (Hero Banner) ── */}
            <div
              className="relative overflow-hidden rounded-[14px] border border-gray-100 print:rounded-none print:border-0 print:shadow-none"
              style={{
                backgroundImage: "url('/psb-header-green.png')",
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
              }}
            >
              {/* Optional subtle overlay for text readability if needed */}
              <div className="absolute inset-0 bg-black/10"></div>
              
              <div className="relative z-10 px-5 sm:px-8 py-5 sm:py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 sm:gap-6">
                
                {/* LEFT: Logo & Title */}
                <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-[10px] sm:rounded-xl bg-white/10 border border-white/15 backdrop-blur-sm flex items-center justify-center shrink-0 p-2 sm:p-2.5 shadow-sm">
                    <Image
                      src="/psb_logo.png"
                      alt="Punjab & Sind Bank"
                      width={36}
                      height={36}
                      className="object-contain"
                    />
                  </div>
                  <div>
                    <h1 className="text-lg sm:text-2xl font-bold text-white leading-tight drop-shadow-sm">
                      Punjab & Sind Bank
                    </h1>
                    <p className="text-[11px] sm:text-sm text-white/90 mt-0.5 font-medium drop-shadow-sm">
                      Earthing Survey Report
                    </p>
                  </div>
                </div>

                {/* RIGHT: Status & Report ID */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-3 sm:gap-2 shrink-0 pt-2 sm:pt-0 border-t border-white/10 sm:border-0 mt-2 sm:mt-0">
                  <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-white/20 backdrop-blur-md border border-white/30 shadow-sm">
                    <div className="text-white drop-shadow-sm scale-90 sm:scale-100">
                      {overallCfg.icon}
                    </div>
                    <span className="text-[11px] sm:text-sm font-bold text-white drop-shadow-sm">
                      Overall: {overallStatus || "—"}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-[10px] sm:text-xs text-white/80 font-mono font-medium drop-shadow-sm bg-black/20 px-2 py-1 rounded">
                      {r.survey_id}
                    </span>
                    <span className="text-[10px] sm:text-xs text-white/90 font-medium drop-shadow-sm bg-black/20 px-2 py-1 rounded uppercase tracking-wider">
                      {SURVEY_TYPE_LABELS[r.survey_type as keyof typeof SURVEY_TYPE_LABELS] ?? r.survey_type ?? "SURVEY"}
                    </span>
                  </div>
                </div>

              </div>
            </div>

            {/* 1. Branch Details Card */}
            <section className="bg-white rounded-[14px] shadow-sm border border-gray-100 p-6 sm:p-8 print:shadow-none print:border-0 print:p-0 print:rounded-none">
              <h2 className="text-base font-bold text-gray-900 mb-6 flex items-center gap-2 uppercase tracking-wide">
                <span className="w-1 h-4 bg-[#027D3F] rounded-full inline-block"></span>
                Branch Details
              </h2>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-8 gap-y-6">
                <Field
                  label="Branch Code"
                  value={editData.bic ?? r.bic ?? ""}
                  editing={editing}
                  onChange={(v) => setField("bic", v)}
                />
                <Field
                  label="Branch Name"
                  value={editData.branch_name ?? r.branch_name ?? ""}
                  editing={editing}
                  onChange={(v) => setField("branch_name", v)}
                />
                <Field
                  label="Zone"
                  value={editData.zone ?? r.zone ?? ""}
                  editing={editing}
                  onChange={(v) => setField("zone", v)}
                />
                <Field
                  label="State"
                  value={editData.state ?? r.state ?? ""}
                  editing={editing}
                  onChange={(v) => setField("state", v)}
                />
                <Field
                  label="District"
                  value={editData.district ?? r.district ?? ""}
                  editing={editing}
                  onChange={(v) => setField("district", v)}
                />
                <Field
                  label="Visit Date"
                  value={editing ? (editData.visit_date ?? r.visit_date ?? "") : formatDate(r.visit_date)}
                  editing={editing}
                  onChange={(v) => setField("visit_date", v)}
                  type={editing ? "date" : "text"}
                />
              </div>

              <div className="my-6 border-t border-gray-100"></div>
              
              <div className="w-full">
                <Field
                  label="Address"
                  value={editData.address ?? r.address ?? ""}
                  editing={editing}
                  onChange={(v) => setField("address", v)}
                />
              </div>
            </section>

            {/* 2. Surveyor & Manager Card */}
            <section className="bg-white rounded-[14px] shadow-sm border border-gray-100 p-6 sm:p-8 print:shadow-none print:border-0 print:p-0 print:rounded-none">
              <h2 className="text-base font-bold text-gray-900 mb-6 flex items-center gap-2 uppercase tracking-wide">
                <span className="w-1 h-4 bg-[#027D3F] rounded-full inline-block"></span>
                Surveyor & Manager Info
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-6">
                <Field
                  label="Surveyor Name"
                  value={editData.surveyor_name ?? r.surveyor_name ?? r.surveyor_emp_id ?? ""}
                  editing={editing}
                  onChange={(v) => setField("surveyor_name", v)}
                />
                <Field
                  label="Surveyor Mobile"
                  value={editData.surveyor_mobile ?? r.surveyor_mobile ?? ""}
                  editing={editing}
                  onChange={(v) => setField("surveyor_mobile", v)}
                />
                <Field
                  label="Branch Manager"
                  value={editData.manager_name ?? r.manager_name ?? ""}
                  editing={editing}
                  onChange={(v) => setField("manager_name", v)}
                />
                <div className="flex flex-col gap-4">
                  <Field
                    label="Manager Mobile"
                    value={editData.phone_no ?? r.phone_no ?? ""}
                    editing={editing}
                    onChange={(v) => setField("phone_no", v)}
                  />
                  {(r.phone_no_alt || editing) && (
                    <Field
                      label="Alternate Mobile"
                      value={editData.phone_no_alt ?? r.phone_no_alt ?? ""}
                      editing={editing}
                      onChange={(v) => setField("phone_no_alt", v)}
                    />
                  )}
                </div>
              </div>
            </section>

            {/* 3. Earthing Readings Card */}
            <section className="bg-white rounded-[14px] shadow-sm border border-gray-100 p-6 sm:p-8 print:shadow-none print:border-0 print:p-0 print:rounded-none">
              <h2 className="text-base font-bold text-gray-900 mb-6 flex items-center gap-2 uppercase tracking-wide">
                <span className="w-1 h-4 bg-[#027D3F] rounded-full inline-block"></span>
                Earthing Readings
              </h2>
              <div className="overflow-x-auto -mx-2 sm:mx-0 rounded-lg border border-gray-100">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50/80 border-b border-gray-100">
                      <th className="text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider py-3 px-4">
                        EP
                      </th>
                      <th className="text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider py-3 px-4">
                        Location
                      </th>
                      <th className="text-right text-[11px] font-bold text-gray-500 uppercase tracking-wider py-3 px-4">
                        Reading (V)
                      </th>
                      <th className="text-right text-[11px] font-bold text-gray-500 uppercase tracking-wider py-3 px-4">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {Object.entries(r.readings ?? {}).map(([ep, value]) => {
                      const statusCfg = getReadingStatus(value, ep);
                      return (
                        <tr key={ep} className="hover:bg-gray-50/30 transition-colors">
                          <td className="py-3 px-4 text-xs font-mono text-gray-500 font-medium">
                            {ep}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-800 font-medium">
                            {EP_LABELS[ep] ?? ep}
                          </td>
                          <td className="py-3 px-4 text-right">
                            {editing ? (
                              <input
                                type="number"
                                step="0.1"
                                value={value}
                                onChange={(e) =>
                                  setReading(ep, e.target.value)
                                }
                                className="w-24 text-right text-sm font-mono border border-gray-200 rounded-md px-2 py-1 outline-none focus:border-[#027D3F] focus:ring-1 focus:ring-[#027D3F]/20"
                              />
                            ) : (
                              <span className="font-mono text-[13px] text-gray-900 font-medium">
                                {value} V
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span
                              className={`inline-block px-2.5 py-1 rounded-[6px] text-[10px] font-bold tracking-wide uppercase ${statusCfg.badge}`}
                            >
                              {statusCfg.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              
              <div className="mt-5 flex items-center gap-2 flex-wrap text-[11px]">
                <span className="text-gray-400 font-medium uppercase tracking-widest">
                  Equipment:
                </span>
                {(r.equipment ?? []).length > 0 ? (
                  (r.equipment ?? []).map((eq, i) => {
                    const label =
                      typeof eq === "string" ? eq : ((eq as any).make ?? "");
                    return (
                      <span
                        key={i}
                        className="font-medium text-gray-600 uppercase"
                      >
                        {label}{i < (r.equipment ?? []).length - 1 ? "," : ""}
                      </span>
                    );
                  })
                ) : (
                  <span className="text-gray-400">—</span>
                )}
              </div>
            </section>

            {/* 4. Visual Inspection Checklist Card (Conditional) */}
            {Object.keys(r.checklist ?? {}).length > 0 && (
              <section className="bg-white rounded-[14px] shadow-sm border border-gray-100 p-6 sm:p-8 print:shadow-none print:border-0 print:p-0 print:rounded-none mb-6">
                <h2 className="text-base font-bold text-gray-900 mb-6 flex items-center gap-2 uppercase tracking-wide">
                  <span className="w-1 h-4 bg-[#027D3F] rounded-full inline-block"></span>
                  Visual Inspection Checklist
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6 mb-2">
                  {Object.entries(r.checklist ?? {}).map(([label, checked]) => (
                    <div
                      key={label}
                      onClick={() => editing && toggleChecklist(label)}
                      className={`flex items-start gap-3 ${editing ? "cursor-pointer select-none rounded-lg p-1.5 -ml-1.5 hover:bg-gray-50 transition-colors" : ""}`}
                    >
                      <div className="mt-0.5">
                        {checked ? (
                          <FiCheckCircle className="w-[15px] h-[15px] text-[#027D3F] shrink-0" />
                        ) : (
                          <FiCircle className="w-[15px] h-[15px] text-gray-300 shrink-0" />
                        )}
                      </div>
                      <span
                        className={`text-[13px] font-medium leading-snug ${checked ? "text-gray-800" : "text-gray-400"}`}
                      >
                        {label}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* 5. Overall Status & Observations Card */}
            <section className="bg-white rounded-[14px] shadow-sm border border-gray-100 p-6 sm:p-8 print:shadow-none print:border-0 print:p-0 print:rounded-none">
                <h3 className="text-base font-bold text-gray-900 mb-6 flex items-center gap-2 uppercase tracking-wide">
                  <span className="w-1 h-4 bg-[#027D3F] rounded-full inline-block"></span>
                  Overall Status & Observations
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                  {/* Status Box */}
                  <div className="flex flex-col gap-2">
                    <span className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold">
                      Current Status
                    </span>
                    {editing ? (
                      <div className="flex gap-2">
                        {(["Pass", "Fail"] as OverallStatus[]).map((s) => {
                          const cfg = OVERALL_CONFIG[s];
                          const active = editData.overall_status === s;
                          return (
                            <button
                              key={s}
                              type="button"
                              onClick={() =>
                                setEditData((prev) => ({
                                  ...prev,
                                  overall_status: s,
                                }))
                              }
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all uppercase tracking-wide
                              ${active ? `${cfg.badge} border-current` : "border-gray-200 text-gray-400 hover:border-gray-300"}`}
                            >
                              {cfg.icon}
                              {s}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="flex items-start">
                        <span
                          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-[11px] font-bold uppercase tracking-wide ${overallCfg.badge}`}
                        >
                          {overallCfg.icon}
                          {overallStatus}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Next Inspection */}
                  <div className="flex flex-col gap-2">
                    <span className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold">
                      Next Inspection
                    </span>
                    {editing ? (
                      <input
                        type="date"
                        value={editData.next_inspection_date ?? r.next_inspection_date ?? ""}
                        onChange={(e) =>
                          setEditData((prev) => ({
                            ...prev,
                            next_inspection_date: e.target.value,
                          }))
                        }
                        className="w-full max-w-[200px] text-sm font-semibold text-gray-800 border border-gray-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-[#027D3F]"
                      />
                    ) : (
                      <span className="text-sm font-semibold text-gray-900">
                        {r.next_inspection_date ? formatDate(r.next_inspection_date) : "—"}
                      </span>
                    )}
                  </div>
                </div>

                {/* Observations Box */}
                <div className="bg-[#FAF6EE] rounded-xl px-5 py-4 border border-[#f0ebd9]">
                  <p className="text-[10px] text-gray-500 mb-2 uppercase tracking-widest font-bold">
                    Observations / Remarks
                  </p>
                  {editing ? (
                    <textarea
                      rows={3}
                      value={editData.remarks ?? r.remarks ?? ""}
                      onChange={(e) =>
                        setEditData((prev) => ({
                          ...prev,
                          remarks: e.target.value,
                        }))
                      }
                      className="w-full text-sm text-gray-800 bg-white border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-[#027D3F] focus:ring-1 focus:ring-[#027D3F]/20 resize-none"
                    />
                  ) : (
                    <p className="text-[13px] text-gray-800 leading-relaxed font-medium">
                      {r.remarks || "No remarks recorded."}
                    </p>
                  )}
                </div>
            </section>

            {/* 5. Photos Card */}
            {(hasPhotos || editing) && (
              <section className="bg-white rounded-[14px] shadow-sm border border-gray-100 p-6 sm:p-8 print:shadow-none print:border-0 print:p-0 print:rounded-none">
                <h2 className="text-base font-bold text-gray-900 mb-6 flex items-center gap-2 uppercase tracking-wide">
                  <span className="w-1 h-4 bg-[#027D3F] rounded-full inline-block"></span>
                  Photos
                </h2>
                {editing ? (
                  <PhotoCapture
                    surveyId={r.survey_id}
                    photos={editData.site_photo ?? r.site_photo ?? {}}
                    onChange={(p) => setEditData((prev) => ({ ...prev, site_photo: p }))}
                  />
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                    {(["form", "site", "other"] as const).map((key) => {
                      const url = r.site_photo?.[key];
                      const label =
                        key === "form"
                          ? "Form Photo"
                          : key === "site"
                            ? "Site Photo"
                            : "Additional";
                      if (!url) return null;
                      return (
                        <div key={key} className="flex flex-col gap-2">
                          <button
                            type="button"
                            onClick={() => setPreviewImage(url)}
                            className="aspect-[4/3] rounded-[10px] overflow-hidden border border-gray-100 shadow-sm cursor-zoom-in group relative"
                          >
                            <img
                              src={url}
                              alt={label}
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
                          </button>
                          <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 text-center">
                            {label}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            )}

            {/* 6. Signature Card (if has signature) */}
            {/*hasSignature && (
              <section className="bg-white rounded-[14px] shadow-sm border border-gray-100 p-6 sm:p-8 print:shadow-none print:border-0 print:p-0 print:rounded-none">
                <h2 className="text-base font-bold text-gray-900 mb-6 flex items-center gap-2 uppercase tracking-wide">
                  <span className="w-1 h-4 bg-[#027D3F] rounded-full inline-block"></span>
                  Branch Manager Sign-off
                </h2>
                <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold">
                      Report ID
                    </span>
                    <span className="text-[13px] text-gray-800 font-mono font-bold tracking-tight">
                      {r.survey_id}
                    </span>
                  </div>
                  <div className="flex flex-col items-center sm:items-end gap-3 w-full sm:w-auto">
                    <div className="w-full sm:w-64 h-24 rounded-xl border border-gray-200 bg-[#FAF6EE] flex items-center justify-center overflow-hidden shadow-inner">
                      <img
                        src={`data:${r.signature!.mimeType};base64,${r.signature!.base64}`}
                        alt="Manager signature"
                        className="max-h-full max-w-full object-contain p-2 mix-blend-multiply"
                      />
                    </div>
                    <div className="text-center sm:text-right">
                      <p className="text-sm font-bold text-gray-900 uppercase tracking-wide">
                        {r.manager_name ?? "—"}
                      </p>
                      <p className="text-[11px] text-gray-400 uppercase tracking-widest font-semibold mt-0.5">
                        Branch Manager · {r.branch_name ?? "—"}
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Footer */}
            
          </div>
        </div>
      </div>

      {previewImage && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 sm:p-8 print:hidden"
          onClick={() => setPreviewImage(null)}
        >
          {/* Top Actions */}
          <div className="absolute top-4 right-4 sm:top-6 sm:right-6 flex items-center gap-3 z-[60]">
            <button
              onClick={async (e) => {
                e.stopPropagation();
                try {
                  const res = await fetch(previewImage);
                  const blob = await res.blob();
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `survey-photo-${r?.survey_id || Date.now()}.jpg`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                } catch (err) {
                  // Fallback if CORS blocks the fetch
                  window.open(previewImage, "_blank");
                }
              }}
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center text-white transition-colors backdrop-blur-md"
              title="Download Image"
            >
              <FiDownload size={18} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setPreviewImage(null);
              }}
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center text-white transition-colors backdrop-blur-md"
              aria-label="Close preview"
            >
              <FiX size={20} />
            </button>
          </div>

          <img
            src={previewImage}
            alt="Full size preview"
            onClick={(e) => e.stopPropagation()}
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
          />
        </div>
      )}
    </>
  );
}
