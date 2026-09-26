"use client";

import { useState } from "react";
import { FiDownload, FiEdit3, FiLoader } from "react-icons/fi";
import * as XLSX from "xlsx-js-style";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { createClient } from "@/lib/supabase/client";
import { EditScheduleModal } from "./EditScheduleModal";
import { useCurrentUser } from "@/lib/hooks/use-current-user";

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
      r._isSpecialNextYear ? r.visit_date : formatDateSafely(r.visit_date), r.spd ?? "", r.earthing ?? ""
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

  // Apply row highlights for special records
  records.forEach((r, i) => {
    if (r._isSpecialNextYear) {
      const rowIndex = i + 2; // +2 because header is row 0 and 1
      for (let C = 0; C < headers.length; ++C) {
        const address = XLSX.utils.encode_cell({ r: rowIndex, c: C });
        if (!worksheet[address]) {
          worksheet[address] = { t: "s", v: "" };
        }
        worksheet[address].s = { fill: { fgColor: { rgb: "D9F99D" } } };
      }
    }
  });

  worksheet["!cols"] = [{ wch: 15 }, { wch: 60 }, { wch: 25 }, { wch: 25 }, { wch: 25 }, { wch: 30 }, { wch: 10 }, { wch: 10 }]
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, "Records")
  XLSX.writeFile(workbook, `psb-earthing-records-${yearString}.xlsx`)
}

export function ExportControls({ year }: ExportControlsProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const supabase = createClient()
  const { data: user } = useCurrentUser()

  async function handleExport() {
    if (!year) return alert("Please select a specific year to export.")
    setIsExporting(true)
    try {
      let branchesData: any[] = []
      let fromB = 0
      while (true) {
        const { data, error } = await supabase.from("branches").select("id, bic, address, state, district, zone, branch_name, branch_category").order("bic", { ascending: true }).range(fromB, fromB + 999)
        if (error) throw error
        branchesData = branchesData.concat(data || [])
        if (!data || data.length < 1000) break
        fromB += 1000
      }

      let surveysData: any[] = []
      let fromS = 0
      while (true) {
        const { data, error } = await supabase.from("surveys")
          .select("id, branch_id, bic, visit_date, district, financial_year")
          .in("financial_year", [year, "2026-27"])
          .order("id", { ascending: true })
          .range(fromS, fromS + 999)
        if (error) throw error
        surveysData = surveysData.concat(data || [])
        if (!data || data.length < 1000) break
        fromS += 1000
      }

      const fallbackDatesMap = new Map<string, any>();
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
            if (bic) {
              fallbackDatesMap.set(String(bic).trim().toUpperCase(), {
                date: row["Date"] || "",
                spd: row["Spd"] || "",
                earthing: row["Earthing"] || ""
              });
            }
          }
        }
      } catch (err) {
        console.warn("Could not fetch fallback dates excel", err);
      }

      const currentYearSurveysByBranchId = new Map<string, any>()
      const nextYearSurveysByBranchId = new Map<string, any>()
      
      for (const s of surveysData) {
        if (!s.branch_id) continue;
        if (s.financial_year === year) {
          if (!currentYearSurveysByBranchId.has(s.branch_id) || new Date(s.visit_date) > new Date(currentYearSurveysByBranchId.get(s.branch_id).visit_date)) {
            currentYearSurveysByBranchId.set(s.branch_id, s)
          }
        } else if (s.financial_year === "2026-27") {
          if (!nextYearSurveysByBranchId.has(s.branch_id) || new Date(s.visit_date) > new Date(nextYearSurveysByBranchId.get(s.branch_id).visit_date)) {
            nextYearSurveysByBranchId.set(s.branch_id, s)
          }
        }
      }

      const exportRows = (branchesData || []).map(b => {
        const nbic = String(b.bic || "").trim().toUpperCase()
        
        let finalDate = "";
        let spd = "";
        let earthing = "";
        let isSpecialNextYear = false;
        let isCompleted = false;

        if (b.branch_category === "existing_amc") {
          const survey = currentYearSurveysByBranchId.get(b.id);
          spd = "yes";
          earthing = "yes";
          if (survey) {
             finalDate = survey.visit_date;
          } else if (fallbackDatesMap.has(nbic)) {
             finalDate = fallbackDatesMap.get(nbic).date || "";
          }
          isCompleted = !!finalDate;
        } else if (b.branch_category === "new_installation") {
          const currentSurvey = currentYearSurveysByBranchId.get(b.id);
          const nextSurvey = nextYearSurveysByBranchId.get(b.id);
          
          if (currentSurvey) {
             finalDate = currentSurvey.visit_date;
             spd = "yes";
             earthing = "yes";
             isCompleted = true;
          } else if (nextSurvey) {
             finalDate = `NEW INSTALLATION - ${formatDateSafely(nextSurvey.visit_date)}`;
             spd = "yes";
             earthing = "yes";
             isSpecialNextYear = true;
             isCompleted = false; // Special rows go into group 2
          } else {
             finalDate = "";
             spd = "no";
             earthing = "no";
             isCompleted = false; // Unsurveyed goes into group 3
          }
        }

        return {
          bic: b.bic, address: b.address, state: b.state, district: b.district, zone: b.zone,
          branch_name: b.branch_name, visit_date: finalDate, spd, earthing,
          _category: b.branch_category,
          _isCompleted: isCompleted,
          _isSpecialNextYear: isSpecialNextYear
        }
      })

      exportRows.sort((a, b) => {
        if (a._category === "existing_amc" && b._category !== "existing_amc") return -1;
        if (a._category !== "existing_amc" && b._category === "existing_amc") return 1;

        if (a._category === "existing_amc") {
           if (a._isCompleted && !b._isCompleted) return -1;
           if (!a._isCompleted && b._isCompleted) return 1;
        } else {
           const getGroup = (r: any) => {
              if (r._isCompleted && !r._isSpecialNextYear) return 1;
              if (r._isSpecialNextYear) return 2;
              return 3;
           }
           const groupA = getGroup(a);
           const groupB = getGroup(b);
           if (groupA !== groupB) return groupA - groupB;
        }

        return String(a.bic || "").localeCompare(String(b.bic || ""));
      })

      exportExcel(exportRows, year)
    } catch (err) {
      console.error(err)
      alert("Failed to export data")
    } finally {
      setIsExporting(false)
    }
  }

  const [isExportingImages, setIsExportingImages] = useState(false)
  const [imageProgress, setImageProgress] = useState("")

  async function handleExportImages() {
    if (!year) return alert("Please select a specific year to export.")
    setIsExportingImages(true)
    setImageProgress("Fetching records...")
    try {
      const { data, error } = await supabase
        .from("surveys")
        .select("id, bic, site_photo, branch_name, state, district, zone, visit_date, overall_status, surveyor_emp_id")
        .eq("financial_year", year)
        .limit(10000)

      if (error) throw error

      const recordsWithPhotos = data.filter(r => r.site_photo && (typeof r.site_photo === "string" || r.site_photo.form || r.site_photo.site))
      if (recordsWithPhotos.length === 0) {
        alert("No images found for the selected year.")
        return
      }

      setImageProgress(`Downloading 0 of ${recordsWithPhotos.length} images...`)
      
      const zip = new JSZip()
      let downloadedCount = 0
      const usedNames: Record<string, number> = {}

      const batchSize = 5;
      for (let i = 0; i < recordsWithPhotos.length; i += batchSize) {
        const batch = recordsWithPhotos.slice(i, i + batchSize);
        await Promise.all(batch.map(async (record) => {
          const photosToDownload: { type: string; url: string }[] = []
          if (typeof record.site_photo === "string") {
            photosToDownload.push({ type: 'photo', url: record.site_photo })
          } else {
            if (record.site_photo?.form) photosToDownload.push({ type: 'form', url: record.site_photo.form })
            if (record.site_photo?.site) photosToDownload.push({ type: 'site', url: record.site_photo.site })
          }

          for (const photo of photosToDownload) {
            try {
              const response = await fetch(photo.url)
              if (!response.ok) throw new Error(`HTTP ${response.status}`)
              const blob = await response.blob()

              const code = record.bic || 'Unknown'
              const nameKey = code
              usedNames[nameKey] = (usedNames[nameKey] || 0) + 1
              const filename = usedNames[nameKey] === 1 ? `${code}.jpg` : `${code}_${usedNames[nameKey]}.jpg`
              zip.file(filename, blob)
            } catch (err) {
              console.error("Failed to download image for", record.bic, err)
            }
          }
          downloadedCount++
        }));
        setImageProgress(`Downloading ${downloadedCount} of ${recordsWithPhotos.length} records...`)
      }

      setImageProgress("Zipping files...")
      const zipBlob = await zip.generateAsync({ type: "blob" })
      saveAs(zipBlob, `psb-earthing-images-${year}.zip`)
    } catch (err) {
      console.error(err)
      alert("Failed to export images")
    } finally {
      setIsExportingImages(false)
      setImageProgress("")
    }
  }

  return (
    <>
      <div className="flex gap-2 items-center flex-wrap">
        {user?.role !== "visitor" && (
          <button
            onClick={() => setIsEditing(true)}
            className="h-10 px-4 rounded-xl border border-gray-200 bg-white text-gray-700 font-semibold text-sm hover:border-[#027D3F] hover:text-[#027D3F] transition-colors flex items-center justify-center gap-2"
          >
            <FiEdit3 size={16} />
            Edit excel sheet
          </button>
        )}

        <button
          onClick={handleExportImages}
          disabled={isExportingImages || isExporting}
          className="h-10 px-4 rounded-xl border border-[#F0D9A8] text-[#854F0B] font-semibold text-sm hover:bg-[#FAEEDA] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isExportingImages ? <FiLoader size={16} className="animate-spin" /> : <FiDownload size={16} />}
          {isExportingImages ? imageProgress : "Download Reports"}
        </button>

        <button
          onClick={handleExport}
          disabled={isExporting || isExportingImages}
          className="h-10 px-4 rounded-xl bg-[#027D3F] hover:bg-[#02612f] text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
        >
          {isExporting ? <FiLoader size={16} className="animate-spin" /> : <FiDownload size={16} />}
          {isExporting ? "Exporting..." : "Download Excel"}
        </button>
      </div>
      
      {isEditing && (
        <EditScheduleModal year={year} onClose={() => setIsEditing(false)} />
      )}
    </>
  )
}
