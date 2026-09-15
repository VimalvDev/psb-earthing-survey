"use client";
import Image from "next/image"
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { FiSave, FiZap, FiLoader, FiCheckSquare } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { motion, Variants } from "framer-motion";

import { BranchDetailsSection } from "@/components/survey/BranchDetailsSection";
import { SurveyorSection } from "@/components/survey/SurveyorSection";
import {
  EarthingReadingsTable,
  ReadingsData,
} from "@/components/survey/EarthingReadingsTable";
import { ChecklistSection } from "@/components/survey/ChecklistSection";
import {
  OverallStatusSection,
  OverallStatus,
} from "@/components/survey/OverallStatusSection";
import { DocScanBanner } from "@/components/survey/DocScanBanner";
import { PhotoCapture } from "@/components/survey/PhotoCapture";
import {
  ManagerSignature,
  ManagerSignatureData,
} from "@/components/survey/ManagerSignature";
import { BadgeStatus } from "@/components/ui/StatusBadge";
import { useCurrentUser } from "@/lib/hooks/use-current-user";

// ── Variants ─────────────────────────────────────────────────────────────

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.25, ease: "easeOut" },
  },
};

// ── Helpers ────────────────────────────────────────────────────────────────

// Generate survey ID: PSB-YYYY-XXXXX
function generateSurveyId(): string {
  const year = new Date().getFullYear();
  const rand = Math.random().toString(36).toUpperCase().slice(2, 7);
  return `PSB-${year}-${rand}`;
}

function calcOverallStatus(statuses: BadgeStatus[]): OverallStatus {
  const withValues = statuses.filter((s) => s !== "--");
  if (withValues.some((s) => s === "Fail")) return "Fail";
  return "Pass";
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function NewSurveyPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const supabase = createClient();

  // ── Auth: load logged-in engineer ──────────────────────────────────────
  const { data: currentUser, isLoading: userLoading } = useCurrentUser();
  const [surveyorInfo, setSurveyorInfo] = useState({
    name: "",
    emp_id: "",
    designation: "",
    mobile_number: "",
  });

  useEffect(() => {
    if (!userLoading && currentUser === null) {
      router.push("/login");
    } else if (currentUser) {
      if (currentUser.role === "visitor") {
        router.replace("/dashboard/records");
        return;
      }
      setSurveyorInfo({
        name: currentUser.name ?? "",
        emp_id: currentUser.emp_id ?? "",
        designation: currentUser.designation ?? "",
        mobile_number: currentUser.mobile_number ?? "",
      });
    }
  }, [currentUser, userLoading, router]);

  // ── Form state ─────────────────────────────────────────────────────────

  const [surveyId, setSurveyId] = useState("");
  const [isDirty, setIsDirty] = useState(false);
  const [saveState, setSaveState] = useState<"Saved" | "Saving..." | "Unsaved changes">("Saved");

  useEffect(() => {
    if (isDirty) setSaveState("Unsaved changes");
  }, [isDirty]);

  useEffect(() => {
    setSurveyId(generateSurveyId());
  }, []);

  // Branch details — flat key-value record
  const [branchValues, setBranchValues] = useState<Record<string, string>>({
    survey_type: "annual-audit",
    visit_date: "01-01-2026",
  });

  function handleBranchChange(field: string, value: string) {
    setBranchValues((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
  }

  // Earthing readings + equipment
  const [readingsData, setReadingsData] = useState<ReadingsData>({
    readings: {
      "EP-1": "229",
      "EP-2": "229",
      "EP-3": "1",
    },
    equipment: [{ make: "WACO", model: "KEW 4105A" }],
  });

  // Reading statuses — updated live by EarthingReadingsTable
  const [readingStatuses, setReadingStatuses] = useState<BadgeStatus[]>([]);

  // Checklist
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});

  // Overall status — auto-suggested + manually overrideable
  const [overallStatus, setOverallStatus] = useState<OverallStatus>("Pass");
  const [statusTouched, setStatusTouched] = useState(false);
  const [remarks, setRemarks] = useState("");
  const [nextInspectionDate, setNextInspectionDate] = useState("");

  // When reading statuses change → re-compute suggested overall status
  const suggestedStatus = calcOverallStatus(readingStatuses);
  // Site photo
  const [sitePhoto, setSitePhoto] = useState<Record<string, string>>({});

  // Manager signature
  const [signature, setSignature] = useState<ManagerSignatureData | null>(null);
  // Auto-apply suggestion until the user manually picks a status
  useEffect(() => {
    if (!statusTouched) setOverallStatus(suggestedStatus);
  }, [suggestedStatus, statusTouched]);

  function handleStatusChange(s: OverallStatus) {
    setStatusTouched(true);
    setOverallStatus(s);
  }

  // ── Doc scan: OCR fills branch fields ─────────────────────────────────

  function handleOcrFields(fields: Record<string, string>) {
    // Map OCR output keys to our form state keys
    const mapped: Record<string, string> = {
      bic: fields.bic ?? "",
      branch_name: fields.branch_name ?? "",
      zone: fields.zone ?? "",
      district: fields.district ?? "",
      state: fields.state ?? "",
      manager_name: fields.manager_name ?? "",
      phone_no: fields.phone_no ?? "",
      visit_date: fields.visit_date ?? "",
      survey_type: fields.survey_type ?? "",
    };

    // Merge into branch values (engineer reviews and corrects)
    setBranchValues((prev) => ({ ...prev, ...mapped }));

    // EP readings
    const newReadings: Record<string, string> = { ...readingsData.readings };
    if (fields.ep1_reading) newReadings["EP-1"] = fields.ep1_reading;
    if (fields.ep2_reading) newReadings["EP-2"] = fields.ep2_reading;
    if (fields.ep3_reading) newReadings["EP-3"] = fields.ep3_reading;
    if (fields.ep4_reading) newReadings["EP-4"] = fields.ep4_reading;
    setReadingsData((prev) => ({ ...prev, readings: newReadings }));

    if (fields.remarks) setRemarks(fields.remarks);
    if (fields.overall_status)
      setOverallStatus(fields.overall_status as OverallStatus);
  }

  // ── Submit ─────────────────────────────────────────────────────────────

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  async function saveData() {
    if (!branchValues.bic) {
      setSubmitError("Branch code is required");
      return;
    }
    if (!overallStatus) {
      setSubmitError("Please set the overall earthing status to submit");
      return;
    }

    setSubmitting(true);
    setSaveState("Saving...");
    setSubmitError("");

    let finalVisitDate = branchValues.visit_date?.trim();
    if (finalVisitDate) {
      if (/^\d{2}-\d{2}-\d{4}$/.test(finalVisitDate)) {
        const [dd, mm, yyyy] = finalVisitDate.split("-");
        finalVisitDate = `${yyyy}-${mm}-${dd}`;
      } else if (/^\d{4}$/.test(finalVisitDate)) {
        finalVisitDate = `${finalVisitDate}-01-01`;
      }
    }

    const payload = {
      survey_id: surveyId,
      ...branchValues,
      surveyor_name: surveyorInfo.name,
      surveyor_emp_id: surveyorInfo.emp_id,
      surveyor_designation: surveyorInfo.designation,
      surveyor_mobile: surveyorInfo.mobile_number,
      visit_date: finalVisitDate || null,
      readings: readingsData.readings,
      equipment: readingsData.equipment,
      checklist,
      overall_status: overallStatus,
      remarks,
      next_inspection_date: nextInspectionDate || null,
      site_photo: sitePhoto,
      signature: signature
        ? {
            method: signature.method,
            base64: signature.base64,
            mimeType: signature.mimeType,
          }
        : null,
    };

    const res = await fetch("/api/surveys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      setSubmitting(false);
      setSaveState("Unsaved changes");
      const { error } = await res.json();
      setSubmitError(error ?? "Submission failed. Please try again.");
      return;
    }

    setSaveState("Saved");
    setIsDirty(false);

    // Invalidate records cache so fresh data (with photos) loads
    queryClient.invalidateQueries({ queryKey: ["records"] });
    queryClient.invalidateQueries({ queryKey: ["record-stats"] });
    queryClient.invalidateQueries({ queryKey: ["filter-options"] });

    // Optimistic navigation — redirect immediately
    router.push("/dashboard/records");
  }

  // ── Render ─────────────────────────────────────────────────────────────

  if (currentUser?.role === "visitor") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-base font-semibold text-gray-700">
          Access restricted. Visitors cannot create new surveys.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full pb-20 sm:pb-24 relative">
      {/* ── Page header ──────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 sm:mb-5">
        <div className="flex items-center gap-3.5">
          <div className="hidden sm:flex w-11 h-11 rounded-lg bg-[#027D3F]/10 border border-[#027D3F]/20 items-center justify-center shrink-0">
             <FiCheckSquare className="text-[#027D3F] w-5 h-5" />
          </div>
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">New Survey</h1>
              <span className="px-2 py-0.5 bg-gray-100 border border-gray-200 text-gray-700 text-[10px] font-mono font-bold rounded uppercase tracking-widest leading-none mt-1">
                {surveyId}
              </span>
            </div>
            <p className="text-[13px] text-gray-500">
              Earthing inspection report · PSB Pan-India
            </p>
          </div>
        </div>
        
        {/* Status Badge */}
        <div className="flex items-center">
           <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[11px] font-semibold transition-colors
             ${saveState === 'Unsaved changes' 
                ? 'bg-amber-50 border-amber-200 text-amber-700' 
                : saveState === 'Saving...'
                ? 'bg-blue-50 border-blue-200 text-blue-700'
                : 'bg-gray-50 border-gray-200 text-gray-600'
             }`}
           >
              {saveState === 'Unsaved changes' && <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shrink-0" />}
              {saveState === 'Saving...' && <FiLoader className="animate-spin w-3 h-3 shrink-0" />}
              {saveState === 'Saved' && <FiSave className="w-3 h-3 text-gray-400 shrink-0" />}
              <span>{saveState}</span>
           </div>
        </div>
      </div>

      {/* ── Two-column grid ──────────────────────────────────────────────── */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-3 sm:gap-4 items-start"
      >
        {/* ═══ LEFT COLUMN ════════════════════════════════════════════════ */}
        <div className="flex flex-col gap-3 sm:gap-4 lg:sticky lg:top-6 lg:self-start">
          <motion.div variants={itemVariants}>
            <BranchDetailsSection
              values={branchValues}
              onChange={handleBranchChange}
            />
          </motion.div>
          <motion.div variants={itemVariants}>
            <SurveyorSection
              values={surveyorInfo}
              onChange={(field, value) => {
                setSurveyorInfo((prev) => ({ ...prev, [field]: value }));
                setIsDirty(true);
              }}
            />
          </motion.div>
        </div>

        {/* ═══ RIGHT COLUMN ═══════════════════════════════════════════════ */}
        <div className="flex flex-col gap-3 sm:gap-4">
          <motion.div variants={itemVariants}>
            <EarthingReadingsTable
              data={readingsData}
              onChange={(d) => { setReadingsData(d); setIsDirty(true); }}
              onStatusChange={setReadingStatuses}
            />
          </motion.div>

          {/* <motion.div variants={itemVariants}>
            <ChecklistSection checked={checklist} onChange={setChecklist} />
          </motion.div> */}

          <motion.div variants={itemVariants}>
            <OverallStatusSection
              status={overallStatus}
              remarks={remarks}
              nextInspectionDate={nextInspectionDate}
              autoSuggestedStatus={suggestedStatus}
              onStatusChange={(s) => { handleStatusChange(s); setIsDirty(true); }}
              onRemarksChange={(r) => { setRemarks(r); setIsDirty(true); }}
              onNextDateChange={(d) => { setNextInspectionDate(d); setIsDirty(true); }}
            />
          </motion.div>

          <motion.div variants={itemVariants}>
            <PhotoCapture
              surveyId={surveyId}
              photos={sitePhoto}
              onChange={setSitePhoto}
            />
          </motion.div>

          {/* <motion.div variants={itemVariants}>
            <ManagerSignature signature={signature} onChange={setSignature} />
          </motion.div> */}

          {/* Sticky Actions */}
          <div className="fixed bottom-0 left-0 right-0 lg:left-64 bg-white border-t border-gray-200 py-3 sm:py-4 z-20">
            <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row sm:items-center justify-end gap-3">
              {submitError && (
                <p className="text-sm text-[#E41E23] sm:mr-auto shrink-0 font-medium">
                  {submitError}
                </p>
              )}
              <div className="flex items-center justify-end gap-3 w-full sm:w-auto">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => router.push("/dashboard/records")}
                  disabled={submitting}
                  className="flex-1 sm:flex-none text-gray-600 hover:text-gray-900 h-10 px-5"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  disabled={submitting}
                  onClick={() => saveData()}
                  className="flex-1 sm:flex-none bg-[#027D3F] hover:bg-[#02612f] text-white flex items-center justify-center gap-2 text-sm font-semibold transition-colors duration-150 disabled:opacity-60 h-10 px-6"
                >
                  {submitting ? (
                    <>
                      <FiLoader className="animate-spin" size={16} /> Saving...
                    </>
                  ) : (
                    <>
                      Submit Survey
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
