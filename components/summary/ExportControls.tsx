"use client";

import { useState } from "react";
import { FiDownload, FiEdit3, FiLoader } from "react-icons/fi";
import * as XLSX from "xlsx";
import { createClient } from "@/lib/supabase/client";
import { EditScheduleModal } from "./EditScheduleModal";

interface ExportControlsProps {
  year: string;
}

function formatDateSafely(val: any): string {
  if (!val) return "";
  if (typeof val === "string") {
    const parts = val.split(/[\/\-]/);
    if (parts.length === 3) {
      let d = parts[0], m = parts[1], y = parts[2];
      if (y.length === 2) y = "20" + y;
      if (parts[0].length === 4) {
        y = parts[0]; m = parts[1]; d = parts[2];
      }
      return `${d.padStart(2, "0")}/${m.padStart(2, "0")}/${y}`;
    }
    const d = new Date(val);
    if (!isNaN(d.getTime())) {
      return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
    }
    return val;
  }
  if (val instanceof Date) {
    return `${String(val.getDate()).padStart(2, "0")}/${String(val.getMonth() + 1).padStart(2, "0")}/${val.getFullYear()}`;
  }
  return String(val);
}

function exportExcel(records: any[], yearString: string) {
  const headerText = `PSB REPORT FOR THE YEAR ${yearString} – PRESENT IN APP`
  const headers = ["Branch Code", "Branch Address", "State", "District", "Zone", "Visit Date", "Spd", "Earthing"]
  const aoa: any[][] = [[headerText], headers]
  
  records.forEach(r => {
    aoa.push([
      r.bic ?? "", r.address ?? "", r.state ?? "", r.district ?? "", r.zone ?? "",
      formatDateSafely(r.visit_date), r.spd ?? "", r.earthing ?? ""
    ])
  })
  
  const worksheet = XLSX.utils.aoa_to_sheet(aoa)
  worksheet["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 7 } }]
  
  const cellA1 = worksheet[XLSX.utils.encode_cell({ r: 0, c: 0 })]
  if (cellA1) cellA1.s = { font: { bold: true, sz: 16 }, alignment: { horizontal: "center", vertical: "center" } }
  
  for (let C = 0; C < headers.length; ++C) {
    const address = XLSX.utils.encode_cell({ r: 1, c: C })
    if (worksheet[address]) {
      worksheet[address].s = {
        fill: { fgColor: { rgb: "9BBB59" } },
        font: { bold: true, color: { rgb: "000000" } },
        alignment: { horizontal: "center", vertical: "center" },
        border: { top: { style: "thin", color: { auto: 1 } }, bottom: { style: "thin", color: { auto: 1 } }, left: { style: "thin", color: { auto: 1 } }, right: { style: "thin", color: { auto: 1 } } }
      }
    }
  }

  worksheet["!cols"] = [{ wch: 15 }, { wch: 60 }, { wch: 25 }, { wch: 25 }, { wch: 25 }, { wch: 15 }, { wch: 10 }, { wch: 10 }]
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, "Records")
  XLSX.writeFile(workbook, `psb-earthing-records-${yearString}.xlsx`)
}

export function ExportControls({ year }: ExportControlsProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const supabase = createClient()

  async function handleExport() {
    if (!year) return alert("Please select a specific year to export.")
    setIsExporting(true)
    try {
      let branchesData: any[] = []
      let fromB = 0
      while (true) {
        const { data, error } = await supabase.from("branches").select("bic, address, state, district, zone, branch_name").order("bic", { ascending: true }).range(fromB, fromB + 999)
        if (error) throw error
        branchesData = branchesData.concat(data || [])
        if (!data || data.length < 1000) break
        fromB += 1000
      }

      const [startYear, endYear] = year.split("-")
      let surveysData: any[] = []
      let fromS = 0
      while (true) {
        const { data, error } = await supabase.from("surveys")
          .select("id, bic, visit_date, district")
          .gte("visit_date", `${startYear}-04-01`)
          .lte("visit_date", `${endYear}-03-31`)
          .order("id", { ascending: true })
          .range(fromS, fromS + 999)
        if (error) throw error
        surveysData = surveysData.concat(data || [])
        if (!data || data.length < 1000) break
        fromS += 1000
      }

      const fallbackDatesMap = new Map<string, string>();
      try {
        const scheduleUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/schedules/schedule.xlsx?t=${Date.now()}`;
        const res = await fetch(scheduleUrl);
        if (res.ok) {
          const arrayBuffer = await res.arrayBuffer();
          const workbook = XLSX.read(arrayBuffer, { type: "array" });
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          const json = XLSX.utils.sheet_to_json(worksheet, { raw: false }) as any[];
          for (const row of json) {
            const bic = row["Branch Code"];
            const date = row["Date"];
            if (bic && date) fallbackDatesMap.set(String(bic).trim().toUpperCase(), String(date));
          }
        }
      } catch (err) {
        console.warn("Could not fetch fallback dates excel", err);
      }

      const completedSurveysByBic = new Map<string, any>()
      for (const s of surveysData) {
        if (!s.bic) continue;
        const nbic = String(s.bic).trim().toUpperCase();
        if (!completedSurveysByBic.has(nbic) || new Date(s.visit_date) > new Date(completedSurveysByBic.get(nbic).visit_date)) {
          completedSurveysByBic.set(nbic, s)
        }
      }

      const exportRows = (branchesData || []).map(b => {
        const nbic = String(b.bic || "").trim().toUpperCase()
        const survey = completedSurveysByBic.get(nbic)
        if (survey) completedSurveysByBic.delete(nbic)
        let finalDate = survey ? survey.visit_date : null
        if (!finalDate && fallbackDatesMap.has(nbic)) finalDate = fallbackDatesMap.get(nbic)

        return {
          bic: b.bic, address: b.address, state: b.state, district: b.district, zone: b.zone,
          branch_name: b.branch_name, visit_date: finalDate, spd: survey ? "done" : "", earthing: survey ? "done" : ""
        }
      })

      for (const [nbic, survey] of completedSurveysByBic.entries()) {
        exportRows.push({
          bic: survey.bic, address: "Unknown Address", state: "", district: "", zone: "", branch_name: "Unknown Branch",
          visit_date: survey.visit_date, spd: "done", earthing: "done"
        })
      }

      exportRows.sort((a, b) => {
        if (a.spd && !b.spd) return -1
        if (!a.spd && b.spd) return 1
        return (a.bic || "").localeCompare(b.bic || "")
      })

      exportExcel(exportRows, year)
    } catch (err) {
      console.error(err)
      alert("Failed to export data")
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <>
      <div className="flex gap-2 items-center">
        <button
          onClick={() => setIsEditing(true)}
          className="h-10 px-4 rounded-xl border border-gray-200 bg-white text-gray-700 font-semibold text-sm hover:border-[#027D3F] hover:text-[#027D3F] transition-colors flex items-center justify-center gap-2"
        >
          <FiEdit3 size={16} />
          Edit excel sheet
        </button>

        <button
          onClick={handleExport}
          disabled={isExporting}
          className="h-10 px-4 rounded-xl bg-[#027D3F] hover:bg-[#02612f] text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
        >
          {isExporting ? <FiLoader size={16} className="animate-spin" /> : <FiDownload size={16} />}
          {isExporting ? "Exporting..." : "Download excel sheet"}
        </button>
      </div>
      
      {isEditing && (
        <EditScheduleModal year={year} onClose={() => setIsEditing(false)} />
      )}
    </>
  )
}
