"use client";

import { useState, useEffect } from "react";
import { FiX, FiSave, FiLoader } from "react-icons/fi";
import * as XLSX from "xlsx";
import { createClient } from "@/lib/supabase/client";

interface EditScheduleModalProps {
  year: string;
  onClose: () => void;
}

export function EditScheduleModal({ year, onClose }: EditScheduleModalProps) {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function loadData() {
      try {
        // 1. Fetch Branches
        let branchesData: any[] = [];
        let fromB = 0;
        while (true) {
          const { data: bData, error } = await supabase.from("branches").select("bic, address, state, district, zone, branch_name").order("bic", { ascending: true }).range(fromB, fromB + 999);
          if (error) throw error;
          branchesData = branchesData.concat(bData || []);
          if (!bData || bData.length < 1000) break;
          fromB += 1000;
        }

        // 2. Fetch Schedule Excel
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
              if (bic) fallbackDatesMap.set(String(bic).trim().toUpperCase(), row);
            }
          }
        } catch (err) {
          console.warn("No existing schedule found or failed to load.", err);
        }

        // 3. Merge
        const merged = branchesData.map(b => {
          const bic = String(b.bic || "").trim().toUpperCase();
          const existing = fallbackDatesMap.get(bic) || {};
          return {
            bic: b.bic,
            address: b.address,
            state: b.state,
            district: b.district,
            zone: b.zone,
            date: existing["Date"] || "",
            spd: existing["Spd"] || "",
            earthing: existing["Earthing"] || ""
          };
        });

        setData(merged);
      } catch (err) {
        console.error(err);
        alert("Failed to load records for editing.");
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [supabase]);

  const handleChange = (index: number, field: string, value: string) => {
    const newData = [...data];
    newData[index] = { ...newData[index], [field]: value };
    setData(newData);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const headers = ["Branch Code", "Address", "State", "District", "ZO", "Date", "Spd", "Earthing"];
      const aoa: any[][] = [headers];

      data.forEach(r => {
        aoa.push([
          r.bic ?? "",
          r.address ?? "",
          r.state ?? "",
          r.district ?? "",
          r.zone ?? "",
          r.date ?? "",
          r.spd ?? "",
          r.earthing ?? ""
        ]);
      });

      const worksheet = XLSX.utils.aoa_to_sheet(aoa);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
      const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });

      const { error } = await supabase.storage
        .from("schedules")
        .upload("schedule.xlsx", new Blob([excelBuffer]), { upsert: true, cacheControl: "0", contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });

      if (error) throw error;
      alert("Schedule saved successfully!");
      onClose();
    } catch (err: any) {
      console.error(err);
      alert("Failed to save schedule: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-6xl h-[85vh] flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Edit Excel Sheet (FY {year})</h2>
            <p className="text-sm text-gray-500">Edit visit dates, SPD, and Earthing status directly.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={isSaving || isLoading}
              className="px-5 py-2.5 rounded-xl bg-[#027D3F] hover:bg-[#02612f] text-white font-semibold text-sm flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              {isSaving ? <FiLoader className="animate-spin" /> : <FiSave />}
              Save Changes
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <FiX size={20} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto bg-gray-50 p-6">
          {isLoading ? (
            <div className="flex h-full items-center justify-center text-gray-400">
              <FiLoader size={24} className="animate-spin mr-2" /> Loading all 1610 branches...
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="max-h-[calc(85vh-140px)] overflow-y-auto">
                <table className="w-full text-sm text-left">
                  <thead className="sticky top-0 bg-gray-100 z-10 text-xs uppercase text-gray-600 font-bold border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 whitespace-nowrap">Branch Code</th>
                      <th className="px-4 py-3 min-w-[200px]">Address</th>
                      <th className="px-4 py-3 whitespace-nowrap">Visit Date</th>
                      <th className="px-4 py-3 whitespace-nowrap">SPD Status</th>
                      <th className="px-4 py-3 whitespace-nowrap">Earthing Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data.map((row, i) => (
                      <tr key={i} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-2 font-medium text-gray-900 whitespace-nowrap">{row.bic}</td>
                        <td className="px-4 py-2 text-gray-500 truncate max-w-xs" title={row.address}>{row.address}</td>
                        <td className="px-4 py-2">
                          <input
                            type="text"
                            placeholder="DD/MM/YYYY"
                            value={row.date}
                            onChange={(e) => handleChange(i, "date", e.target.value)}
                            className="w-full px-3 py-1.5 border border-gray-200 rounded-lg outline-none focus:border-[#027D3F] focus:ring-1 focus:ring-[#027D3F] transition-all bg-white text-gray-800"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <select
                            value={row.spd}
                            onChange={(e) => handleChange(i, "spd", e.target.value)}
                            className="w-full px-3 py-1.5 border border-gray-200 rounded-lg outline-none focus:border-[#027D3F] focus:ring-1 focus:ring-[#027D3F] transition-all bg-white text-gray-800"
                          >
                            <option value="">-</option>
                            <option value="done">done</option>
                            <option value="yes">yes</option>
                            <option value="no">no</option>
                          </select>
                        </td>
                        <td className="px-4 py-2">
                          <select
                            value={row.earthing}
                            onChange={(e) => handleChange(i, "earthing", e.target.value)}
                            className="w-full px-3 py-1.5 border border-gray-200 rounded-lg outline-none focus:border-[#027D3F] focus:ring-1 focus:ring-[#027D3F] transition-all bg-white text-gray-800"
                          >
                            <option value="">-</option>
                            <option value="done">done</option>
                            <option value="yes">yes</option>
                            <option value="no">no</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
