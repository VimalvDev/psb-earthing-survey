"use client" // JS: needed for print action, export buttons

import Link from "next/link"
import {
  FiArrowLeft,
  FiDownload,
  FiPrinter,
  FiCheckCircle,
  FiCircle,
  FiAlertTriangle,
  FiXCircle,
  FiZap,
  FiLock,
} from "react-icons/fi"

// ─── Mock Record ────────────────────────────────────────────────────────────────
// JS: Replace with fetch(`/api/records/${params.id}`) in Phase 7+
const MOCK_RECORD = {
  id: "PSB-2026-001",
  surveyCode: "PSB-2026-001",
  submittedAt: "12 Jun 2026, 03:45 PM",

  branchCode: "PSB-DL-001",
  branchName: "Connaught Place Branch",
  state: "Delhi",
  district: "Central Delhi",
  zone: "North Zone",
  address: "12, Block A, Connaught Place, New Delhi – 110001",
  branchManagerName: "Suresh Nair",
  branchManagerPhone: "+91 98765 43210",

  employeeId: "EMP-4821",
  surveyorName: "Rajesh Kumar",
  designation: "Senior Site Engineer",
  surveyorContact: "+91 91234 56789",
  surveyDate: "12 Jun 2026",

  earthingReadings: [
    { id: "EP-1", name: "Main Building",  reading: "1.2 Ω", status: "Pass"    as const },
    { id: "EP-2", name: "Sub-Station Panel",         reading: "0.9 Ω", status: "Pass"    as const },
    { id: "EP-3", name: "Generator",                 reading: "4.8 Ω", status: "Fail"    as const },
    { id: "EP-4", name: "Strong Room",               reading: "2.1 Ω", status: "OK"      as const },
    { id: "EP-5", name: "AC / HVAC Panel",           reading: "1.5 Ω", status: "Pass"    as const },
    { id: "EP-6", name: "Server Rack / UPS",         reading: "2.6 Ω", status: "OK"      as const },
  ],

  checklist: [
    { label: "Earth electrode accessible and inspectable",   checked: true  },
    { label: "Earth conductor continuity verified",          checked: true  },
    { label: "No visible corrosion or physical damage",      checked: true  },
    { label: "Earthing connections tight and secure",        checked: false },
    { label: "Earth pit moisture check done",                checked: true  },
    { label: "Bonding of metallic structures verified",      checked: false },
    { label: "Lightning arrester earthing checked",          checked: true  },
    { label: "Records / logbook updated at branch",          checked: true  },
  ],

  overallStatus: "Partial" as const,
  observations: "Generator earth pit shows elevated resistance — likely due to dry soil conditions. Recommend water treatment and re-testing within 30 days. Earthing connections at EP-4 found slightly loose — tightened on-site during inspection.",
  nextInspectionDate: "12 Sep 2026",

  testEquipment: [
    "Kyoritsu KEW 4105A Earth Tester",
    "Fluke 1625-2 GEO Earth Ground Tester",
  ],

  hasSitePhoto: true,
  // JS: sitePhotoUrl: string — from camera capture (Phase 9)
  // JS: managerSignatureUrl: string — from signature pad (Phase 10)
}

// ─── Status Configs ─────────────────────────────────────────────────────────────
const READING_STATUS = {
  Pass: { badge: "bg-[#027D3F]/10 text-[#027D3F]",   label: "Pass" },
  OK:   { badge: "bg-[#E6F1FB] text-[#185FA5]",       label: "OK"   },
  Fail: { badge: "bg-[#E41E23]/10 text-[#E41E23]",    label: "Fail" },
  "--": { badge: "bg-gray-100 text-gray-400",          label: "--"   },
}

const OVERALL_STATUS = {
  Pass:    { badge: "bg-[#027D3F]/10 text-[#027D3F]", icon: <FiCheckCircle  className="w-4 h-4" />, bar: "bg-[#027D3F]" },
  Partial: { badge: "bg-[#BDD70C]/20 text-[#8A9C08]", icon: <FiAlertTriangle className="w-4 h-4" />, bar: "bg-[#BDD70C]" },
  Fail:    { badge: "bg-[#E41E23]/10 text-[#E41E23]", icon: <FiXCircle      className="w-4 h-4" />, bar: "bg-[#E41E23]" },
}

// ─── Helpers ────────────────────────────────────────────────────────────────────
function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">{children}</span>
      <div className="flex-1 h-px bg-gray-100" />
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] text-gray-400 uppercase tracking-wide">{label}</span>
      <span className="text-sm font-medium text-gray-800">{value || "—"}</span>
    </div>
  )
}

// ─── Page ───────────────────────────────────────────────────────────────────────
// JS: export default function RecordDetailPage({ params }: { params: { id: string } })
// JS: Use params.id to fetch from API: const record = await fetch(`/api/records/${params.id}`)
export default function RecordDetailPage() {
  const r = MOCK_RECORD
  const overallCfg = OVERALL_STATUS[r.overallStatus]

  return (
    <div className="min-h-screen bg-[#FAF6EE]">
      <div className="max-w-6xl mx-auto px-4 lg:px-8 py-6 lg:py-8">

        {/* ── Screen-only top bar (hidden on print) ── */}
        <div className="flex items-center justify-between mb-6 print:hidden">
          <Link
            href="/dashboard/records"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#027D3F] transition-colors duration-150 group"
          >
            <FiArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform duration-150" />
            Back to Records
          </Link>

          <div className="flex items-center gap-2">
            {/* Edit — admin only */}
            <div className="flex flex-col items-end gap-0.5">
              <button
                disabled
                className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-gray-400 bg-white border border-gray-200 rounded-lg cursor-not-allowed opacity-50"
              >
                {/* JS: show active for admin role */}
                <FiLock className="w-3.5 h-3.5" />
                Edit Record
              </button>
            </div>
            <button
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all"
            >
              {/* JS: onClick → window.print() */}
              <FiPrinter className="w-3.5 h-3.5" />
              Print
            </button>
            <button
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-white bg-[#027D3F] rounded-lg hover:bg-[#02612f] transition-colors"
            >
              {/* JS: onClick → trigger PDF export */}
              <FiDownload className="w-3.5 h-3.5" />
              Export PDF
            </button>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════
            DOCUMENT — This entire block is what prints
        ════════════════════════════════════════════════════════════ */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden print:rounded-none print:border-0 print:shadow-none">

          {/* ── LETTERHEAD ─────────────────────────────────────────── */}
          <div className="bg-[#027D3F] px-8 py-6 flex items-start justify-between">
            {/* Left — Brand */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#BDD70C] flex items-center justify-center flex-shrink-0">
                <FiZap className="w-5 h-5 text-[#027D3F]" />
              </div>
              <div>
                <p className="text-sm font-bold text-white leading-tight">Punjab & Sind Bank</p>
                <p className="text-xs text-white/60 mt-0.5">Earthing Survey Report</p>
              </div>
            </div>
            {/* Right — Overall status badge */}
            <div className="flex flex-col items-end gap-1.5">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-white/15 text-white`}>
                {overallCfg.icon}
                Overall: {r.overallStatus}
              </span>
              <span className="text-[11px] text-white/50">Survey ID: {r.surveyCode}</span>
            </div>
          </div>

          {/* ── Status bar (colored strip) ──────────────────────────── */}
          <div className={`h-1 w-full ${overallCfg.bar}`} />

          {/* ── DOCUMENT BODY ─────────────────────────────────────── */}
          <div className="px-8 py-7 flex flex-col gap-8">

            {/* 1. BRANCH DETAILS */}
            <section>
              <SectionHeading>Branch Details</SectionHeading>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4">
                <Field label="Branch Code"    value={r.branchCode} />
                <Field label="Branch Name"    value={r.branchName} />
                <Field label="Zone"           value={r.zone} />
                <Field label="State"          value={r.state} />
                <Field label="District"       value={r.district} />
                <Field label="Survey Date"    value={r.surveyDate} />
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <Field label="Branch Address" value={r.address} />
              </div>
            </section>

            {/* 2. SURVEYOR + MANAGER */}
            <section>
              <SectionHeading>Surveyor & Manager Info</SectionHeading>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4">
                <Field label="Employee ID"     value={r.employeeId} />
                <Field label="Surveyor Name"   value={r.surveyorName} />
                <Field label="Designation"     value={r.designation} />
                <Field label="Surveyor Phone"  value={r.surveyorContact} />
                <Field label="Branch Manager"  value={r.branchManagerName} />
                <Field label="Manager Phone"   value={r.branchManagerPhone} />
              </div>
            </section>

            {/* 3. EARTHING READINGS */}
            <section>
              <SectionHeading>Earthing Readings</SectionHeading>
              <div className="overflow-x-auto -mx-1">
                <table className="w-full text-sm min-w-[400px]">
                  <thead>
                    <tr className="bg-[#FAF6EE]">
                      <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide py-2.5 px-3 rounded-l-lg">EP</th>
                      <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide py-2.5 px-3">Location / Panel</th>
                      <th className="text-right text-[11px] font-semibold text-gray-400 uppercase tracking-wide py-2.5 px-3">Reading</th>
                      <th className="text-right text-[11px] font-semibold text-gray-400 uppercase tracking-wide py-2.5 px-3 rounded-r-lg">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {r.earthingReadings.map((row) => {
                      const cfg = READING_STATUS[row.status] ?? READING_STATUS["--"]
                      return (
                        <tr key={row.id}>
                          <td className="py-3 px-3 text-xs font-mono text-gray-400">{row.id}</td>
                          <td className="py-3 px-3 text-sm text-gray-800">{row.name}</td>
                          <td className="py-3 px-3 text-right font-mono text-sm text-gray-700">{row.reading}</td>
                          <td className="py-3 px-3 text-right">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${cfg.badge}`}>
                              {cfg.label}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </section>

            {/* 4. VISUAL INSPECTION CHECKLIST */}
            <section>
              <SectionHeading>Visual Inspection Checklist</SectionHeading>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {r.checklist.map((item, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    {item.checked
                      ? <FiCheckCircle className="w-4 h-4 text-[#027D3F] flex-shrink-0" />
                      : <FiCircle className="w-4 h-4 text-gray-300 flex-shrink-0" />
                    }
                    <span className={`text-sm ${item.checked ? "text-gray-800" : "text-gray-400"}`}>
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            {/* 5. OVERALL STATUS + OBSERVATIONS */}
            <section>
              <SectionHeading>Overall Status & Observations</SectionHeading>
              <div className="flex items-center gap-3 mb-4">
                <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold ${overallCfg.badge}`}>
                  {overallCfg.icon}
                  {r.overallStatus}
                </span>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[11px] text-gray-400 uppercase tracking-wide">Next Inspection Due</span>
                  <span className="text-sm font-semibold text-gray-800">{r.nextInspectionDate}</span>
                </div>
              </div>
              <div className="bg-[#FAF6EE] rounded-xl px-4 py-3.5 border border-gray-100">
                <p className="text-xs text-gray-400 mb-1.5 uppercase tracking-wide font-medium">Observations / Remarks</p>
                <p className="text-sm text-gray-700 leading-relaxed">{r.observations}</p>
              </div>
            </section>

            {/* 6. TEST EQUIPMENT */}
            <section>
              <SectionHeading>Test Equipment Used</SectionHeading>
              <div className="flex flex-col gap-2">
                {r.testEquipment.map((eq, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#027D3F]/40 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{eq}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* 7. SITE PHOTO */}
            <section>
              <SectionHeading>Site Photo</SectionHeading>
              {r.hasSitePhoto ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {/* JS: map over r.sitePhotos[] in Phase 9 — multiple photos per survey */}
                  <div className="aspect-[4/3] rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                    {/* JS: <Image src={r.sitePhotoUrl} alt="Site photo" fill className="object-cover" /> */}
                    <div className="w-full h-full bg-gradient-to-br from-[#027D3F]/8 to-[#BDD70C]/12 flex flex-col items-center justify-center gap-1.5">
                      <FiCheckCircle className="w-5 h-5 text-[#027D3F]/30" />
                      <p className="text-[10px] text-gray-400 text-center px-2">Photo · Phase 9</p>
                    </div>
                  </div>
                  <div className="aspect-[4/3] rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center gap-1.5">
                    <p className="text-[10px] text-gray-300 text-center px-2">Additional photo</p>
                  </div>
                  <div className="aspect-[4/3] rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 hidden sm:flex flex-col items-center justify-center gap-1.5">
                    <p className="text-[10px] text-gray-300 text-center px-2">Additional photo</p>
                  </div>
                </div>
              ) : (
                <div className="w-full h-28 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center gap-1.5">
                  <p className="text-sm text-gray-400">No site photo uploaded</p>
                  <p className="text-xs text-gray-300">Use the Camera tool after filling the survey</p>
                </div>
              )}
            </section>

            {/* 8. SIGNATURE BLOCK */}
            <section className="pt-4 border-t border-gray-100">
              <SectionHeading>Branch Manager Sign-off</SectionHeading>

              <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6">
                {/* Left — submission info */}
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] text-gray-400 uppercase tracking-wide">Submitted</span>
                  <span className="text-sm font-medium text-gray-700">{r.submittedAt}</span>
                  <span className="text-xs text-gray-400 mt-1">Survey ID: <span className="font-mono">{r.surveyCode}</span></span>
                </div>

                {/* Right — signature box */}
                <div className="flex flex-col items-center sm:items-end gap-2 w-full sm:w-auto">
                  {/* Signature image area */}
                  <div className="w-full sm:w-64 h-24 rounded-xl border-2 border-dashed border-gray-200 bg-[#FAF6EE] flex items-center justify-center">
                    {/* JS: if r.managerSignatureUrl exists → <Image src={r.managerSignatureUrl} ... /> */}
                    {/* JS: else → show "Awaiting signature" */}
                    <span className="text-xs text-gray-400">Awaiting manager signature</span>
                  </div>
                  {/* Manager name + designation */}
                  <div className="text-center sm:text-right">
                    <p className="text-sm font-semibold text-gray-800">{r.branchManagerName}</p>
                    <p className="text-xs text-gray-400">Branch Manager · {r.branchName}</p>
                  </div>
                </div>
              </div>
            </section>

          </div>

          {/* ── DOCUMENT FOOTER ────────────────────────────────────── */}
          <div className="px-8 py-4 bg-[#FAF6EE] border-t border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded bg-[#027D3F] flex items-center justify-center">
                <FiZap className="w-3 h-3 text-[#BDD70C]" />
              </div>
              <span className="text-[11px] text-gray-400">Punjab & Sind Bank — Earthing Survey Report</span>
            </div>
            <span className="text-[11px] text-gray-400 font-mono">{r.surveyCode}</span>
          </div>

        </div>

        {/* ── Screen-only export row (hidden on print) ── */}
        <div className="flex items-center justify-end gap-2 mt-4 print:hidden">
          <button className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all">
            {/* JS: trigger Excel export for this record */}
            <FiDownload className="w-4 h-4" />
            Export Excel
          </button>
          <button className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#027D3F] rounded-lg hover:bg-[#02612f] transition-colors">
            {/* JS: window.print() */}
            <FiPrinter className="w-4 h-4" />
            Print / Save PDF
          </button>
        </div>

      </div>
    </div>
  )
}