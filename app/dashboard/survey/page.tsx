"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FiSave, FiZap, FiLoader } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

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

// ── Types ──────────────────────────────────────────────────────────────────

interface LoggedInUser {
  name: string;
  emp_id: string;
  designation: string;
  mobile_number: string;
  email: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────

// Generate survey ID: PSB-YYYY-XXXXX
function generateSurveyId(): string {
  const year = new Date().getFullYear();
  const rand = Math.random().toString(36).toUpperCase().slice(2, 7);
  return `PSB-${year}-${rand}`;
}

// Auto-calculate overall status from individual EP reading statuses
function calcOverallStatus(statuses: BadgeStatus[]): OverallStatus {
  const withValues = statuses.filter((s) => s !== "--");
  if (withValues.length === 0) return "";
  if (withValues.every((s) => s === "Good" || s === "Pass")) return "Pass";
  if (withValues.some((s) => s === "Fail")) return "Fail";
  return "Partial";
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function NewSurveyPage() {
  const router = useRouter();
  const supabase = createClient();

  // ── Auth: load logged-in engineer ──────────────────────────────────────
  const [currentUser, setCurrentUser] = useState<LoggedInUser | null>(null);

  useEffect(() => {
    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      // Load engineer profile from `engineers` table using emp_id stored in metadata
      const { data } = await supabase
        .from("engineers")
        .select("name, emp_id, designation, mobile_number")
        .eq("email", user.email)
        .single();

      if (data) setCurrentUser({ ...data, email: user.email ?? "" });
    }
    loadUser();
  }, []);

  // ── Form state ─────────────────────────────────────────────────────────

  const [surveyId, setSurveyId] = useState("");

  useEffect(() => {
    setSurveyId(generateSurveyId());
  }, []);

  // Branch details — flat key-value record
  const [branchValues, setBranchValues] = useState<Record<string, string>>({});

  function handleBranchChange(field: string, value: string) {
    setBranchValues((prev) => ({ ...prev, [field]: value }));
  }

  // Earthing readings + equipment
  const [readingsData, setReadingsData] = useState<ReadingsData>({
    readings: {},
    equipment: [{ make: "", model: "" }],
  });

  // Reading statuses — updated live by EarthingReadingsTable
  const [readingStatuses, setReadingStatuses] = useState<BadgeStatus[]>([]);

  // Checklist
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});

  // Overall status — auto-suggested + manually overrideable
  const [overallStatus, setOverallStatus] = useState<OverallStatus>("");
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

    const payload = {
      survey_id: surveyId,
      ...branchValues,
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
        <div className="flex items-center gap-2 bg-white border border-gray-100 rounded-xl px-4 py-2.5 self-start sm:self-auto">
          <div className="w-5 h-5 rounded bg-[#027D3F] flex items-center justify-center shrink-0">
            <FiZap className="w-3 h-3 text-[#BDD70C]" />
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
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-5 items-start">
        {/* ═══ LEFT COLUMN ════════════════════════════════════════════════ */}
        <div className="flex flex-col gap-5 lg:sticky lg:top-6 lg:self-start">
          <BranchDetailsSection
            values={branchValues}
            onChange={handleBranchChange}
          />
          <SurveyorSection user={currentUser} />
        </div>

        {/* ═══ RIGHT COLUMN ═══════════════════════════════════════════════ */}
        <div className="flex flex-col gap-5">
          <EarthingReadingsTable
            data={readingsData}
            onChange={setReadingsData}
            onStatusChange={setReadingStatuses}
          />

          <ChecklistSection checked={checklist} onChange={setChecklist} />

          <OverallStatusSection
            status={overallStatus}
            remarks={remarks}
            nextInspectionDate={nextInspectionDate}
            autoSuggestedStatus={suggestedStatus}
            onStatusChange={handleStatusChange}
            onRemarksChange={setRemarks}
            onNextDateChange={setNextInspectionDate}
          />

          <PhotoCapture
            surveyId={surveyId}
            photos={sitePhoto}
            onChange={setSitePhoto}
          />

          <ManagerSignature signature={signature} onChange={setSignature} />

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
      </div>
    </form>
  );
}
