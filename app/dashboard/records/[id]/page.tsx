"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import {
  FiArrowLeft, FiPrinter, FiEdit2, FiSave, FiX,
  FiCheckCircle, FiCircle, FiAlertTriangle, FiXCircle,
  FiZap, FiLoader, FiImage,
} from "react-icons/fi"
import { createClient } from "@/lib/supabase/client"

// ── Types ──────────────────────────────────────────────────────────────────

type OverallStatus = "Pass" | "Partial" | "Fail"

interface SurveyDetail {
  id: string
  survey_id: string
  bic: string | null
  branch_name: string | null
  zone: string | null
  district: string | null
  state: string | null
  address: string | null
  manager_name: string | null
  phone_no: string | null
  phone_no_alt: string | null
  visit_date: string | null
  survey_type: string | null
  surveyor_emp_id: string | null
  surveyor_email: string | null
  readings: Record<string, string> | null
  equipment: string[] | null
  checklist: Record<string, boolean> | null
  overall_status: string | null
  remarks: string | null
  next_inspection_date: string | null
  site_photo: Record<string, string> | null
  signature: { method: string; base64: string; mimeType: string } | null
  status: string | null
  created_at: string
  updated_at: string | null
}

interface LoggedInUser {
  name: string
  emp_id: string
  designation: string
  email: string
}

// ── Constants ──────────────────────────────────────────────────────────────

const EP_LABELS: Record<string, string> = {
  "EP-1": "Main Building",
  "EP-2": "Server Rack / UPS",
  "EP-3": "ATM Rack",
  "EP-4": "Lightning Arrester",
}

const OVERALL_CONFIG: Record<OverallStatus, {
  badge: string
  icon: React.ReactNode
  bar: string
}> = {
  Pass: {
    badge: "bg-[#027D3F]/10 text-[#027D3F]",
    icon: <FiCheckCircle className="w-4 h-4" />,
    bar: "bg-[#027D3F]",
  },
  Partial: {
    badge: "bg-[#BDD70C]/20 text-[#8A9C08]",
    icon: <FiAlertTriangle className="w-4 h-4" />,
    bar: "bg-[#BDD70C]",
  },
  Fail: {
    badge: "bg-[#E41E23]/10 text-[#E41E23]",
    icon: <FiXCircle className="w-4 h-4" />,
    bar: "bg-[#E41E23]",
  },
}

const SURVEY_TYPE_LABELS: Record<string, string> = {
  routine: "Routine Inspection",
  "post-rectification": "Post-Rectification",
  complaint: "Complaint Based",
  "annual-audit": "Annual Audit",
}

// ── Helpers ────────────────────────────────────────────────────────────────

function formatDate(iso: string | null): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  })
}

function formatDateTime(iso: string | null): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  })
}

function getReadingStatus(value: string): { label: string; badge: string } {
  const v = parseFloat(value)
  if (isNaN(v)) return { label: "—", badge: "bg-gray-100 text-gray-400" }
  if (v <= 1)   return { label: "Good", badge: "bg-[#027D3F]/10 text-[#027D3F]" }
  if (v <= 5)   return { label: "OK",   badge: "bg-[#E6F1FB] text-[#185FA5]" }
  return             { label: "Fail",  badge: "bg-[#E41E23]/10 text-[#E41E23]" }
}

function canEdit(designation: string): boolean {
  return designation === "Admin" || designation === "Developer"
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
  )
}

function Field({
  label,
  value,
  editing,
  onChange,
  type = "text",
}: {
  label: string
  value: string
  editing?: boolean
  onChange?: (v: string) => void
  type?: string
}) {
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
  )
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function RecordDetailPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()

  const surveyId = params?.id as string

  // ── State ───────────────────────────────────────────────────────────────
  const [record, setRecord] = useState<SurveyDetail | null>(null)
  const [currentUser, setCurrentUser] = useState<LoggedInUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState("")

  // Edit mode
  const [editing, setEditing] = useState(false)
  const [editData, setEditData] = useState<Partial<SurveyDetail>>({})
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState("")

  // ── Load user + record ──────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      setLoading(true)

      // Current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push("/login"); return }

      const { data: engineer } = await supabase
        .from("engineers")
        .select("name, emp_id, designation, email")
        .eq("email", user.email)
        .single()

      if (engineer) setCurrentUser({ ...engineer, email: user.email ?? "" })

      // Survey record
      const { data, error } = await supabase
        .from("surveys")
        .select("*")
        .eq("survey_id", surveyId)
        .single()

      setLoading(false)

      if (error || !data) {
        setFetchError("Survey record not found.")
        return
      }

      setRecord(data as SurveyDetail)
    }

    load()
  }, [surveyId])

  // ── Edit handlers ───────────────────────────────────────────────────────
  function startEditing() {
    if (!record) return
    setEditData({ ...record })
    setEditing(true)
    setSaveError("")
  }

  function cancelEditing() {
    setEditing(false)
    setEditData({})
    setSaveError("")
  }

  function setField(field: keyof SurveyDetail, value: string) {
    setEditData((prev) => ({ ...prev, [field]: value }))
  }

  function setReading(epKey: string, value: string) {
    setEditData((prev) => ({
      ...prev,
      readings: { ...(prev.readings ?? record?.readings ?? {}), [epKey]: value },
    }))
  }

  function toggleChecklist(label: string) {
    const current = editData.checklist ?? record?.checklist ?? {}
    setEditData((prev) => ({
      ...prev,
      checklist: { ...current, [label]: !current[label] },
    }))
  }

  async function saveChanges() {
    if (!record) return
    setSaving(true)
    setSaveError("")

    const payload = {
      bic:                  editData.bic,
      branch_name:          editData.branch_name,
      zone:                 editData.zone,
      district:             editData.district,
      state:                editData.state,
      address:              editData.address,
      manager_name:         editData.manager_name,
      phone_no:             editData.phone_no,
      phone_no_alt:         editData.phone_no_alt,
      visit_date:           editData.visit_date,
      survey_type:          editData.survey_type,
      readings:             editData.readings,
      checklist:            editData.checklist,
      overall_status:       editData.overall_status,
      remarks:              editData.remarks,
      next_inspection_date: editData.next_inspection_date,
      updated_at:           new Date().toISOString(),
    }

    const { error } = await supabase
      .from("surveys")
      .update(payload)
      .eq("survey_id", record.survey_id)

    setSaving(false)

    if (error) {
      setSaveError("Save failed. Please try again.")
      return
    }

    // Refresh record
    const { data } = await supabase
      .from("surveys")
      .select("*")
      .eq("survey_id", record.survey_id)
      .single()

    if (data) setRecord(data as SurveyDetail)
    setEditing(false)
    setEditData({})
  }

  // ── Render helpers ──────────────────────────────────────────────────────

  const r = editing ? { ...record!, ...editData } : record
  const isAdmin = currentUser ? canEdit(currentUser.designation) : false
  const overallStatus = (r?.overall_status ?? "") as OverallStatus
  const overallCfg = OVERALL_CONFIG[overallStatus] ?? OVERALL_CONFIG["Partial"]

  // ── Loading / error states ──────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] gap-3">
        <FiLoader size={22} className="text-[#027D3F] animate-spin" />
        <p className="text-sm text-gray-400">Loading record…</p>
      </div>
    )
  }

  if (fetchError || !r) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-base font-semibold text-gray-700">{fetchError || "Record not found."}</p>
        <Link href="/dashboard/records" className="text-sm text-[#027D3F] hover:underline">
          ← Back to Records
        </Link>
      </div>
    )
  }

  // ── Main render ─────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#FAF6EE]">
      <div className="max-w-6xl mx-auto px-4 lg:px-8 py-6 lg:py-8">

        {/* ── Top bar (screen only) ─────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-6 print:hidden">
          <Link
            href="/dashboard/records"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#027D3F] transition-colors group"
          >
            <FiArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            Back to Records
          </Link>

          <div className="flex items-center gap-2">
            {/* Edit / Save / Cancel — admin & developer only */}
            {isAdmin && !editing && (
              <button
                onClick={startEditing}
                className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:border-[#027D3F] hover:text-[#027D3F] transition-all"
              >
                <FiEdit2 size={13} />
                Edit Record
              </button>
            )}
            {editing && (
              <>
                <button
                  onClick={cancelEditing}
                  className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-gray-600 bg-white border border-gray-200 rounded-xl hover:border-gray-300 transition-all"
                >
                  <FiX size={13} />
                  Cancel
                </button>
                <button
                  onClick={saveChanges}
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-[#027D3F] rounded-xl hover:bg-[#02612f] disabled:opacity-60 transition-all"
                >
                  {saving
                    ? <><FiLoader size={13} className="animate-spin" /> Saving…</>
                    : <><FiSave size={13} /> Save Changes</>
                  }
                </button>
              </>
            )}
            {!editing && (
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all"
              >
                <FiPrinter size={13} />
                Print
              </button>
            )}
          </div>
        </div>

        {/* Save error */}
        {saveError && (
          <div className="mb-4 px-4 py-3 rounded-xl border border-[#F5B9B9] bg-[#FDECEC] text-sm text-[#D81F26] print:hidden">
            {saveError}
          </div>
        )}

        {/* Edit mode banner */}
        {editing && (
          <div className="mb-4 px-4 py-3 rounded-xl border border-[#E7E9A9] bg-[#F6F8D7] text-sm text-[#768A06] font-medium print:hidden">
            You are editing this record. Changes will be saved to the database.
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════
            DOCUMENT
        ════════════════════════════════════════════════════════════ */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden print:rounded-none print:border-0">

          {/* ── Letterhead ───────────────────────────────────────────── */}
          <div className="bg-[#027D3F] px-6 sm:px-8 py-6 flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#BDD70C] flex items-center justify-center shrink-0">
                <FiZap className="w-5 h-5 text-[#027D3F]" />
              </div>
              <div>
                <p className="text-sm font-bold text-white leading-tight">Punjab & Sind Bank</p>
                <p className="text-xs text-white/60 mt-0.5">Earthing Survey Report</p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1.5 shrink-0">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-white/15 text-white">
                {overallCfg.icon}
                Overall: {overallStatus || "—"}
              </span>
              <span className="text-[11px] text-white/50 font-mono">{r.survey_id}</span>
            </div>
          </div>

          {/* Status bar */}
          <div className={`h-1 w-full ${overallCfg.bar}`} />

          {/* ── Document body ────────────────────────────────────────── */}
          <div className="px-6 sm:px-8 py-7 flex flex-col gap-8">

            {/* 1. Branch Details */}
            <section>
              <SectionHeading>Branch Details</SectionHeading>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4">
                <Field label="Branch Code"  value={r.bic ?? ""} editing={editing} onChange={(v) => setField("bic", v)} />
                <Field label="Branch Name"  value={r.branch_name ?? ""} editing={editing} onChange={(v) => setField("branch_name", v)} />
                <Field label="Zone"         value={r.zone ?? ""} editing={editing} onChange={(v) => setField("zone", v)} />
                <Field label="State"        value={r.state ?? ""} editing={editing} onChange={(v) => setField("state", v)} />
                <Field label="District"     value={r.district ?? ""} editing={editing} onChange={(v) => setField("district", v)} />
                <Field label="Visit Date"   value={r.visit_date ?? ""} editing={editing} onChange={(v) => setField("visit_date", v)} type="date" />
              </div>
              <div className="mt-4 pt-4 border-t border-gray-50">
                <Field label="Address" value={r.address ?? ""} editing={editing} onChange={(v) => setField("address", v)} />
              </div>
              <div className="mt-4 pt-4 border-t border-gray-50 grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4">
                <Field label="Survey Type" value={SURVEY_TYPE_LABELS[r.survey_type ?? ""] ?? r.survey_type ?? ""} />
                <Field label="Submitted"   value={formatDateTime(r.created_at)} />
                {r.updated_at && <Field label="Last Edited" value={formatDateTime(r.updated_at)} />}
              </div>
            </section>

            {/* 2. Surveyor & Manager */}
            <section>
              <SectionHeading>Surveyor & Manager Info</SectionHeading>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4">
                <Field label="Employee ID"    value={r.surveyor_emp_id ?? ""} />
                <Field label="Surveyor Email" value={r.surveyor_email ?? ""} />
                <Field label="Branch Manager" value={r.manager_name ?? ""} editing={editing} onChange={(v) => setField("manager_name", v)} />
                <Field label="Phone No."      value={r.phone_no ?? ""} editing={editing} onChange={(v) => setField("phone_no", v)} />
                {(r.phone_no_alt || editing) && (
                  <Field label="Alternate Phone" value={r.phone_no_alt ?? ""} editing={editing} onChange={(v) => setField("phone_no_alt", v)} />
                )}
              </div>
            </section>

            {/* 3. Earthing Readings */}
            <section>
              <SectionHeading>Earthing Readings</SectionHeading>
              <div className="overflow-x-auto -mx-1">
                <table className="w-full text-sm min-w-[380px]">
                  <thead>
                    <tr className="bg-[#FAF6EE]">
                      <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide py-2.5 px-3 rounded-l-lg">EP</th>
                      <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide py-2.5 px-3">Location</th>
                      <th className="text-right text-[11px] font-semibold text-gray-400 uppercase tracking-wide py-2.5 px-3">Reading (V)</th>
                      <th className="text-right text-[11px] font-semibold text-gray-400 uppercase tracking-wide py-2.5 px-3 rounded-r-lg">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {Object.entries(r.readings ?? {}).map(([ep, value]) => {
                      const statusCfg = getReadingStatus(value)
                      return (
                        <tr key={ep}>
                          <td className="py-3 px-3 text-xs font-mono text-gray-400">{ep}</td>
                          <td className="py-3 px-3 text-sm text-gray-700">{EP_LABELS[ep] ?? ep}</td>
                          <td className="py-3 px-3 text-right">
                            {editing ? (
                              <input
                                type="number"
                                step="0.1"
                                value={value}
                                onChange={(e) => setReading(ep, e.target.value)}
                                className="w-24 text-right text-sm font-mono border border-gray-200 rounded-lg px-2 py-1 outline-none focus:border-[#027D3F] focus:ring-1 focus:ring-[#027D3F]/20 bg-[#FAF6EE]"
                              />
                            ) : (
                              <span className="font-mono text-sm text-gray-700">{value} V</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusCfg.badge}`}>
                              {statusCfg.label}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Equipment */}
              {(r.equipment ?? []).length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-50 flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] text-gray-400 uppercase tracking-wide">Equipment:</span>
                  {(r.equipment ?? []).map((eq) => (
                    <span key={eq} className="text-xs font-semibold text-gray-600 bg-gray-100 rounded-lg px-2.5 py-1">
                      {eq}
                    </span>
                  ))}
                </div>
              )}
            </section>

            {/* 4. Checklist */}
            <section>
              <SectionHeading>Visual Inspection Checklist</SectionHeading>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {Object.entries(r.checklist ?? {}).map(([label, checked]) => (
                  <div
                    key={label}
                    onClick={() => editing && toggleChecklist(label)}
                    className={`flex items-center gap-2.5 ${editing ? "cursor-pointer select-none rounded-lg px-2 py-1 hover:bg-gray-50 transition-colors" : ""}`}
                  >
                    {checked
                      ? <FiCheckCircle className="w-4 h-4 text-[#027D3F] shrink-0" />
                      : <FiCircle className="w-4 h-4 text-gray-300 shrink-0" />
                    }
                    <span className={`text-sm ${checked ? "text-gray-800" : "text-gray-400"}`}>
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            {/* 5. Overall Status & Remarks */}
            <section>
              <SectionHeading>Overall Status & Observations</SectionHeading>
              <div className="flex flex-wrap items-center gap-4 mb-4">
                {editing ? (
                  <div className="flex gap-2">
                    {(["Pass", "Partial", "Fail"] as OverallStatus[]).map((s) => {
                      const cfg = OVERALL_CONFIG[s]
                      const active = editData.overall_status === s
                      return (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setEditData((prev) => ({ ...prev, overall_status: s }))}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all
                            ${active
                              ? `${cfg.badge} border-current`
                              : "border-gray-200 text-gray-400 hover:border-gray-300"
                            }`}
                        >
                          {cfg.icon}
                          {s}
                        </button>
                      )
                    })}
                  </div>
                ) : (
                  <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold ${overallCfg.badge}`}>
                    {overallCfg.icon}
                    {overallStatus}
                  </span>
                )}

                <div className="flex flex-col gap-0.5">
                  <span className="text-[11px] text-gray-400 uppercase tracking-wide">Next Inspection</span>
                  {editing ? (
                    <input
                      type="date"
                      value={editData.next_inspection_date ?? r.next_inspection_date ?? ""}
                      onChange={(e) => setEditData((prev) => ({ ...prev, next_inspection_date: e.target.value }))}
                      className="text-sm font-semibold text-gray-800 border border-gray-200 rounded-lg px-2.5 py-1 outline-none focus:border-[#027D3F] bg-[#FAF6EE]"
                    />
                  ) : (
                    <span className="text-sm font-semibold text-gray-800">
                      {formatDate(r.next_inspection_date)}
                    </span>
                  )}
                </div>
              </div>

              <div className="bg-[#FAF6EE] rounded-xl px-4 py-3.5 border border-gray-100">
                <p className="text-xs text-gray-400 mb-1.5 uppercase tracking-wide font-medium">
                  Observations / Remarks
                </p>
                {editing ? (
                  <textarea
                    rows={3}
                    value={editData.remarks ?? r.remarks ?? ""}
                    onChange={(e) => setEditData((prev) => ({ ...prev, remarks: e.target.value }))}
                    className="w-full text-sm text-gray-700 bg-white border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-[#027D3F] focus:ring-1 focus:ring-[#027D3F]/20 resize-none"
                  />
                ) : (
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {r.remarks || "No remarks recorded."}
                  </p>
                )}
              </div>
            </section>

            {/* 6. Site Photos */}
            <section>
              <SectionHeading>Site Photos</SectionHeading>
              {r.site_photo && Object.keys(r.site_photo).length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {(["form", "site", "other"] as const).map((key) => {
                    const url = r.site_photo?.[key]
                    const label = key === "form" ? "Form Photo" : key === "site" ? "Site Photo" : "Additional"
                    if (!url) return null
                    return (
                      <div key={key} className="flex flex-col gap-1.5">
                        <div className="aspect-[4/3] rounded-xl overflow-hidden border border-gray-100">
                          <img
                            src={url}
                            alt={label}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <p className="text-[11px] text-gray-400 text-center">{label}</p>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="w-full h-24 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center gap-1.5">
                  <FiImage size={20} className="text-gray-300" />
                  <p className="text-sm text-gray-400">No photos uploaded</p>
                </div>
              )}
            </section>

            {/* 7. Signature */}
            <section className="pt-4 border-t border-gray-100">
              <SectionHeading>Branch Manager Sign-off</SectionHeading>
              <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6">
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] text-gray-400 uppercase tracking-wide">Submitted</span>
                  <span className="text-sm font-medium text-gray-700">{formatDateTime(r.created_at)}</span>
                  <span className="text-xs text-gray-400 mt-1 font-mono">{r.survey_id}</span>
                </div>

                <div className="flex flex-col items-center sm:items-end gap-2 w-full sm:w-auto">
                  <div className="w-full sm:w-64 h-24 rounded-xl border-2 border-dashed border-gray-200 bg-[#FAF6EE] flex items-center justify-center overflow-hidden">
                    {r.signature?.base64 ? (
                      <img
                        src={`data:${r.signature.mimeType};base64,${r.signature.base64}`}
                        alt="Manager signature"
                        className="max-h-full max-w-full object-contain p-2"
                      />
                    ) : (
                      <span className="text-xs text-gray-400">Awaiting manager signature</span>
                    )}
                  </div>
                  <div className="text-center sm:text-right">
                    <p className="text-sm font-semibold text-gray-800">{r.manager_name ?? "—"}</p>
                    <p className="text-xs text-gray-400">Branch Manager · {r.branch_name ?? "—"}</p>
                  </div>
                </div>
              </div>
            </section>

          </div>

          {/* ── Document footer ──────────────────────────────────────── */}
          <div className="px-6 sm:px-8 py-4 bg-[#FAF6EE] border-t border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded bg-[#027D3F] flex items-center justify-center">
                <FiZap className="w-3 h-3 text-[#BDD70C]" />
              </div>
              <span className="text-[11px] text-gray-400">Punjab & Sind Bank — Earthing Survey Report</span>
            </div>
            <span className="text-[11px] text-gray-400 font-mono">{r.survey_id}</span>
          </div>
        </div>

        {/* ── Bottom action row (screen only) ─────────────────────────── */}
        <div className="flex items-center justify-end gap-2 mt-4 print:hidden">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#027D3F] rounded-xl hover:bg-[#02612f] transition-colors"
          >
            <FiPrinter size={15} />
            Print / Save PDF
          </button>
        </div>

      </div>
    </div>
  )
}