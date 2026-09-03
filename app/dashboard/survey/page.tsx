"use client";
import Image from "next/image"
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FiSave, FiZap, FiLoader } from "react-icons/fi";
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!branchValues.bic) {
      setSubmitError("Branch code is required");
      return;
    }
    if (!overallStatus) {
      setSubmitError("Please set the overall earthing status");
      return;
    }

    setSubmitting(true);
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

    setSubmitting(false);

    if (!res.ok) {
      const { error } = await res.json();
      setSubmitError(error ?? "Submission failed. Please try again.");
      return;
    }

    router.push("/dashboard/records");
  }

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <form onSubmit={handleSubmit}>
      {/* ── Page header ──────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">New Survey</h1>
          <p className="text-sm text-gray-500 mt-1">
            Earthing inspection report · PSB Pan-India
          </p>
        </div>
        <div className="flex items-center gap-2 bg-white border border-gray-100 rounded-xl px-3 py-2.5 self-start sm:self-auto">
          <div className="w-9 h-9 rounded-md bg-[#027D3F] flex items-center justify-center shrink-0 p-1">
            <Image
              src="/structureindia.png"
              alt="Structure India"
              width={34}
              height={34}
              className="object-contain brightness-0 invert"
            />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-400 uppercase tracking-wide">
              Survey ID
            </span>
            <span className="text-xs font-mono font-semibold text-gray-700">
              {surveyId}
            </span>
          </div>
        </div>
      </div>

      {/* ── Two-column grid ──────────────────────────────────────────────── */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-5 items-start"
      >
        {/* ═══ LEFT COLUMN ════════════════════════════════════════════════ */}
        <div className="flex flex-col gap-5 lg:sticky lg:top-6 lg:self-start">
          <motion.div variants={itemVariants}>
            <BranchDetailsSection
              values={branchValues}
              onChange={handleBranchChange}
            />
          </motion.div>
          <motion.div variants={itemVariants}>
            <SurveyorSection
              values={surveyorInfo}
              onChange={(field, value) =>
                setSurveyorInfo((prev) => ({ ...prev, [field]: value }))
              }
            />
          </motion.div>
        </div>

        {/* ═══ RIGHT COLUMN ═══════════════════════════════════════════════ */}
        <div className="flex flex-col gap-5">
          <motion.div variants={itemVariants}>
            <EarthingReadingsTable
              data={readingsData}
              onChange={setReadingsData}
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
              onStatusChange={handleStatusChange}
              onRemarksChange={setRemarks}
              onNextDateChange={setNextInspectionDate}
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

          {/* ── Submit ─────────────────────────────────────────────────── */}
          <div>
            {submitError && (
              <p className="text-sm text-[#E41E23] mb-3 text-center">
                {submitError}
              </p>
            )}
            <Button
              type="submit"
              disabled={submitting}
              className="w-full bg-[#027D3F] hover:bg-[#02612f] text-white h-12 rounded-xl flex items-center justify-center gap-2 text-base font-semibold transition-colors duration-150 disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <FiLoader className="animate-spin" size={18} /> Saving...
                </>
              ) : (
                <>
                  <FiSave size={18} /> Save Survey Record
                </>
              )}
            </Button>
            <p className="text-xs text-gray-400 text-center mt-2">
              Saved records appear in the Records tab · Admin can edit submitted
              records
            </p>
          </div>
        </div>
      </motion.div>
    </form>
  );
}
