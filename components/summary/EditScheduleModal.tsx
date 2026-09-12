"use client";

import { useState, useEffect, useRef } from "react";
import { FiX, FiSave, FiLoader, FiSearch, FiTrash2, FiUploadCloud, FiCamera } from "react-icons/fi";
import * as XLSX from "xlsx";
import { createClient } from "@/lib/supabase/client";

interface EditScheduleModalProps {
  year: string;
  onClose: () => void;
}

export function EditScheduleModal({ year, onClose }: EditScheduleModalProps) {
  const [data, setData] = useState<any[]>([]);
  const [engineers, setEngineers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [deletedBics, setDeletedBics] = useState<string[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newBranch, setNewBranch] = useState({ bic: "", branch_name: "", address: "", state: "", district: "", zone: "" });
  const [uploadingRow, setUploadingRow] = useState<number | null>(null);
  const [draggedRow, setDraggedRow] = useState<number | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function loadData() {
      try {
        // 1. Fetch Branches
        let branchesData: any[] = [];
        let fromB = 0;
        while (true) {
          const { data: bData, error } = await supabase.from("branches").select("bic, address, state, district, zone, branch_name, manager_name, phone_no").order("bic", { ascending: true }).range(fromB, fromB + 999);
          if (error) throw error;
          branchesData = branchesData.concat(bData || []);
          if (!bData || bData.length < 1000) break;
          fromB += 1000;
        }

        // 1b. Fetch Engineers
        const { data: engData, error: engErr } = await supabase.from("engineers").select("name, emp_id, email, mobile_number, designation").order("name");
        if (!engErr && engData) setEngineers(engData);

        // 2. Fetch Surveys for the selected year
        const [startYear, endYear] = year.split("-");
        let surveysData: any[] = [];
        let fromS = 0;
        while (true) {
          const { data: sData, error } = await supabase
            .from("surveys")
            .select("bic, visit_date, surveyor_emp_id, surveyor_name")
            .gte("visit_date", `${startYear}-04-01`)
            .lte("visit_date", `${endYear}-03-31`)
            .order("id", { ascending: true })
            .range(fromS, fromS + 999);
          if (error) throw error;
          surveysData = surveysData.concat(sData || []);
          if (!sData || sData.length < 1000) break;
          fromS += 1000;
        }

        const completedSurveysByBic = new Map<string, any>();
        for (const s of surveysData) {
          if (!s.bic) continue;
          const nbic = String(s.bic).trim().toUpperCase();
          if (!completedSurveysByBic.has(nbic) || new Date(s.visit_date) > new Date(completedSurveysByBic.get(nbic).visit_date)) {
            completedSurveysByBic.set(nbic, s);
          }
        }

        // 3. Fetch Schedule Excel
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

        // 4. Merge
        const merged = branchesData.map(b => {
          const bic = String(b.bic || "").trim().toUpperCase();
          const existing = fallbackDatesMap.get(bic) || {};
          const survey = completedSurveysByBic.get(bic);

          return {
            bic: b.bic,
            branch_name: b.branch_name,
            address: b.address,
            state: b.state,
            district: b.district,
            zone: b.zone,
            manager_name: b.manager_name,
            phone_no: b.phone_no,
            date: survey ? survey.visit_date : (existing["Date"] || ""),
            spd: existing["Spd"] || "yes",
            earthing: existing["Earthing"] || "yes",
            surveyor_emp_id: survey ? survey.surveyor_emp_id : (existing["surveyor_emp_id"] || ""),
            original_surveyor_emp_id: survey ? survey.surveyor_emp_id : (existing["surveyor_emp_id"] || ""),
            surveyor_name: survey ? survey.surveyor_name : "",
            hasSurvey: !!survey
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
  }, [supabase, year]);

  const handleChange = (index: number, field: string, value: string) => {
    const newData = [...data];
    newData[index] = { ...newData[index], [field]: value };
    setData(newData);
  };

  const handleAddBranch = () => {
    setIsAddModalOpen(true);
  };

  const submitNewBranch = () => {
    if (!newBranch.bic) return alert("Branch Code is required.");
    setData([{ ...newBranch, date: "", spd: "yes", earthing: "yes", hasSurvey: false, isNew: true, surveyor_emp_id: "" }, ...data]);
    setNewBranch({ bic: "", branch_name: "", address: "", state: "", district: "", zone: "" });
    setIsAddModalOpen(false);
  };

  const handleImageUpload = (index: number, file: File) => {
    const row = data[index];
    if (!row.bic || !row.surveyor_emp_id) {
      alert("Please ensure Branch Code and Surveyor are selected before uploading.");
      return;
    }
    const newData = [...data];
    newData[index].pendingFile = file;
    setData(newData);
  };

  const handleDeleteBranch = (index: number) => {
    const row = data[index];
    if (row.bic && !row.isNew) {
      setDeletedBics(prev => [...prev, String(row.bic).trim().toUpperCase()]);
    }
    const newData = [...data];
    newData.splice(index, 1);
    setData(newData);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // 0. Process pending survey uploads
      const pendingRows = data.filter(r => r.pendingFile && !r.hasSurvey && r.surveyor_emp_id);
      
      if (pendingRows.length > 0) {
        const results = await Promise.allSettled(pendingRows.map(async (row) => {
          const surveyor = engineers.find(e => String(e.emp_id) === String(row.surveyor_emp_id));
          const surveyId = `PSB-${new Date().getFullYear()}-${Math.random().toString(36).toUpperCase().slice(2, 7)}`;
          const fileName = `${surveyId}/form-${Date.now()}.jpg`;
          const { error: uploadError } = await supabase.storage
            .from('survey-photos')
            .upload(fileName, row.pendingFile, { contentType: row.pendingFile.type, upsert: true });

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage.from('survey-photos').getPublicUrl(fileName);

          let formattedDate = row.date || new Date().toISOString().split('T')[0];
          if (formattedDate.includes('/')) {
            const parts = formattedDate.split('/');
            if (parts.length === 3 && parts[2].length === 4) {
              formattedDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
            }
          } else if (formattedDate.includes('-')) {
            const parts = formattedDate.split('-');
            if (parts.length === 3 && parts[2].length === 4) {
              formattedDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
            }
          }

          const payload = {
            survey_id: surveyId,
            bic: row.bic,
            branch_name: row.branch_name,
            address: row.address,
            state: row.state,
            district: row.district,
            zone: row.zone,
            manager_name: row.manager_name || "",
            phone_no: row.phone_no || "",
            surveyor_name: surveyor?.name || "",
            surveyor_emp_id: surveyor?.emp_id || "",
            surveyor_email: surveyor?.email || "",
            surveyor_mobile: surveyor?.mobile_number || "",
            surveyor_designation: surveyor?.designation || "",
            survey_type: "annual-audit",
            visit_date: formattedDate,
            readings: {
              "EP-1": "229",
              "EP-2": "229",
              "EP-3": "1",
            },
            equipment: [{ make: "WACO", model: "KEW 4105A" }],
            checklist: {},
            overall_status: "Pass",
            site_photo: { form: publicUrl }
          };

          const res = await fetch("/api/surveys", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

          if (!res.ok) {
            const err = await res.json();
            throw new Error(`Branch ${row.bic}: ` + (err.error || "Failed to submit survey"));
          }
          
          return row.bic;
        }));

        const successfulBics = new Set(
          results.filter(r => r.status === 'fulfilled').map(r => (r as PromiseFulfilledResult<string>).value)
        );

        if (successfulBics.size > 0) {
          setData(prev => prev.map(r => 
            successfulBics.has(r.bic) ? { ...r, hasSurvey: true, pendingFile: null as any } : r
          ));
        }

        const failures = results.filter(r => r.status === 'rejected');
        if (failures.length > 0) {
          const errorMsg = failures.map(f => (f as PromiseRejectedResult).reason.message).join("\n");
          throw new Error("Some surveys failed to submit:\n" + errorMsg);
        }
      }

      const branchesToUpsert: any[] = [];
      const surveyUpdates: any[] = [];

      data.forEach(r => {
        if (!r.bic) return; // Skip empty branch codes

        branchesToUpsert.push({
          bic: r.bic.trim().toUpperCase(),
          address: r.address || "",
          state: r.state || "",
          district: r.district || "",
          zone: r.zone || "",
          branch_name: r.branch_name || ""
        });

        // Track surveyor changes for completed surveys
        if (r.hasSurvey && r.surveyor_emp_id && r.surveyor_emp_id !== r.original_surveyor_emp_id) {
          const surveyor = engineers.find(e => String(e.emp_id) === String(r.surveyor_emp_id));
          if (surveyor) {
            surveyUpdates.push({
              bic: r.bic.trim().toUpperCase(),
              surveyor_emp_id: surveyor.emp_id,
              surveyor_name: surveyor.name,
              surveyor_email: surveyor.email
            });
          }
        }
      });

      // Build the schedule rows for server-side Excel generation
      const scheduleRows = data.filter(r => r.bic).map(r => ({
        bic: r.bic ?? "",
        address: r.address ?? "",
        state: r.state ?? "",
        district: r.district ?? "",
        zone: r.zone ?? "",
        date: r.date ?? "",
        spd: r.spd ?? "",
        earthing: r.earthing ?? ""
      }));

      // 2. Save Branches to DB + generate Excel server-side
      const res = await fetch("/api/admin/save-branches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ branches: branchesToUpsert, deletedBics, surveyUpdates, scheduleRows })
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error || "Failed to save branch details to database.");
      }

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
      <div className="bg-white rounded-3xl w-full max-w-[95vw] lg:max-w-[1400px] h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Edit Excel Sheet (FY {year}) <span className="text-sm font-medium text-gray-500 ml-2">(Total: {data.length})</span>
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">Edit visit dates, SPD, and Earthing status directly.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search branches..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2 w-48 rounded-xl border border-gray-200 text-sm focus:border-[#027D3F] focus:ring-1 focus:ring-[#027D3F] outline-none"
                />
              </div>
              <select
                value={selectedState}
                onChange={(e) => {
                  setSelectedState(e.target.value);
                  setSelectedDistrict(""); // Reset district when state changes
                }}
                className="px-3 py-2 rounded-xl border border-gray-200 text-sm focus:border-[#027D3F] focus:ring-1 focus:ring-[#027D3F] outline-none bg-white text-gray-700 max-w-[150px]"
              >
                <option value="">All States</option>
                {Array.from(new Set(data.map(d => d.state).filter(Boolean))).sort().map(s => (
                  <option key={s as string} value={s as string}>{s as string}</option>
                ))}
              </select>
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="px-3 py-2 rounded-xl border border-gray-200 text-sm focus:border-[#027D3F] focus:ring-1 focus:ring-[#027D3F] outline-none bg-white text-gray-700 max-w-[150px]"
              >
                <option value="">All Districts</option>
                {Array.from(new Set(data.filter(d => !selectedState || d.state === selectedState).map(d => d.district).filter(Boolean))).sort().map(d => (
                  <option key={d as string} value={d as string}>{d as string}</option>
                ))}
              </select>
            </div>
            <button
              onClick={handleAddBranch}
              className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium text-sm transition-colors"
            >
              + Add Branch
            </button>
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
                      <th className="px-4 py-3 whitespace-nowrap">State</th>
                      <th className="px-4 py-3 whitespace-nowrap">District</th>
                      <th className="px-4 py-3 whitespace-nowrap min-w-[200px]">Surveyor Name</th>
                      <th className="px-4 py-3 whitespace-nowrap">Visit Date</th>
                      <th className="px-4 py-3 whitespace-nowrap">SPD Status</th>
                      <th className="px-4 py-3 whitespace-nowrap">Earthing Status</th>
                      <th className="px-4 py-3 whitespace-nowrap">Image Upload</th>
                      <th className="px-4 py-3 whitespace-nowrap w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data.map((row, i) => {
                      if (selectedState && row.state !== selectedState) return null;
                      if (selectedDistrict && row.district !== selectedDistrict) return null;

                      if (searchQuery) {
                        const searchLower = searchQuery.toLowerCase();
                        const matchesBic = row.bic?.toLowerCase().includes(searchLower);
                        const matchesAddress = row.address?.toLowerCase().includes(searchLower);
                        if (!matchesBic && !matchesAddress) return null;
                      }
                      
                      return (
                      <tr key={i} className={`transition-colors ${row.hasSurvey ? 'bg-green-50/50 hover:bg-green-50' : 'hover:bg-gray-50'}`}>
                        <td className="px-4 py-2 font-medium text-gray-900 whitespace-nowrap w-32">
                          <input
                            type="text"
                            placeholder="A0000"
                            value={row.bic}
                            onChange={(e) => handleChange(i, "bic", e.target.value)}
                            disabled={row.hasSurvey}
                            className={`w-full px-2 py-1.5 border border-transparent rounded-lg outline-none focus:border-[#027D3F] focus:ring-1 focus:ring-[#027D3F] transition-all bg-transparent text-gray-800 ${row.hasSurvey ? 'opacity-70 cursor-not-allowed' : ''}`}
                          />
                        </td>
                        <td className="px-4 py-2 text-gray-500">
                           <input
                            type="text"
                            placeholder="State"
                            value={row.state || ""}
                            onChange={(e) => handleChange(i, "state", e.target.value)}
                            className="w-full px-2 py-1.5 border border-transparent rounded-lg outline-none focus:border-[#027D3F] focus:ring-1 focus:ring-[#027D3F] transition-all bg-transparent text-gray-800"
                          />
                        </td>
                        <td className="px-4 py-2 text-gray-500">
                           <input
                            type="text"
                            placeholder="District"
                            value={row.district || ""}
                            onChange={(e) => handleChange(i, "district", e.target.value)}
                            className="w-full px-2 py-1.5 border border-transparent rounded-lg outline-none focus:border-[#027D3F] focus:ring-1 focus:ring-[#027D3F] transition-all bg-transparent text-gray-800"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <select
                            value={row.surveyor_emp_id || ""}
                            onChange={(e) => handleChange(i, "surveyor_emp_id", e.target.value)}
                            className={`w-full px-3 py-1.5 border border-gray-200 rounded-lg outline-none focus:border-[#027D3F] focus:ring-1 focus:ring-[#027D3F] transition-all bg-white text-gray-800 ${row.hasSurvey ? 'opacity-90 bg-green-50/50' : ''}`}
                          >
                            <option value="">Select Surveyor</option>
                            {engineers.map(e => (
                              <option key={e.emp_id} value={e.emp_id}>{e.name} ({e.emp_id})</option>
                            ))}
                            {row.hasSurvey && row.surveyor_emp_id && !engineers.find(e => String(e.emp_id) === String(row.surveyor_emp_id)) && (
                              <option value={row.surveyor_emp_id}>{row.surveyor_name || row.surveyor_emp_id}</option>
                            )}
                          </select>
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="text"
                            placeholder="DD/MM/YYYY"
                            value={row.date}
                            onChange={(e) => handleChange(i, "date", e.target.value)}
                            disabled={row.hasSurvey}
                            className={`w-full px-3 py-1.5 border border-gray-200 rounded-lg outline-none focus:border-[#027D3F] focus:ring-1 focus:ring-[#027D3F] transition-all bg-white text-gray-800 ${row.hasSurvey ? 'opacity-70 cursor-not-allowed bg-gray-50' : ''}`}
                          />
                        </td>
                        <td className="px-4 py-2">
                          <select
                            value={row.spd}
                            onChange={(e) => handleChange(i, "spd", e.target.value)}
                            className="w-full px-3 py-1.5 border border-gray-200 rounded-lg outline-none focus:border-[#027D3F] focus:ring-1 focus:ring-[#027D3F] transition-all bg-white text-gray-800"
                          >
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
                            <option value="yes">yes</option>
                            <option value="no">no</option>
                          </select>
                        </td>
                        <td className="px-4 py-2">
                          {!row.hasSurvey && (
                            <div className="relative">
                              {row.pendingFile ? (
                                <div className="text-[#027D3F] flex items-center justify-between gap-1.5 text-xs font-semibold px-2 py-1.5 bg-green-50 rounded-lg border border-green-200">
                                  <span>Pending Save</span>
                                  <button onClick={() => { const nd = [...data]; nd[i].pendingFile = null; setData(nd); }} className="text-red-500 hover:text-red-700 bg-red-50 rounded-full p-1" title="Remove photo">
                                    <FiX size={12} />
                                  </button>
                                </div>
                              ) : (
                                <>
                                  <label 
                                    className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border ${draggedRow === i ? 'border-[#027D3F] bg-green-50 text-[#027D3F] border-dashed border-2' : 'border-[#027D3F] text-[#027D3F] hover:bg-[#027D3F] hover:text-white'} cursor-pointer transition-colors text-xs font-semibold`}
                                    onDragOver={(e) => { e.preventDefault(); setDraggedRow(i); }}
                                    onDragLeave={(e) => { e.preventDefault(); setDraggedRow(null); }}
                                    onDrop={(e) => {
                                      e.preventDefault();
                                      setDraggedRow(null);
                                      if (e.dataTransfer.files?.[0]) {
                                        handleImageUpload(i, e.dataTransfer.files[0]);
                                      }
                                    }}
                                  >
                                    <FiCamera size={14} /> {draggedRow === i ? 'Drop Photo!' : 'Photo'}
                                    <input
                                      type="file"
                                      accept="image/*"
                                      className="hidden"
                                      onChange={(e) => e.target.files?.[0] && handleImageUpload(i, e.target.files[0])}
                                    />
                                  </label>
                                </>
                              )}
                            </div>
                          )}
                          {row.hasSurvey && (
                            <span className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-1 rounded-md block text-center">Uploaded</span>
                          )}
                        </td>
                        <td className="px-4 py-2 text-right">
                          {!row.hasSurvey && (
                            <button
                              onClick={() => handleDeleteBranch(i)}
                              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete branch"
                            >
                              <FiTrash2 size={16} />
                            </button>
                          )}
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Branch Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Add New Branch</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Branch Code</label>
                <input
                  type="text"
                  value={newBranch.bic}
                  onChange={e => setNewBranch(p => ({ ...p, bic: e.target.value.toUpperCase() }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-[#027D3F] focus:border-[#027D3F] outline-none text-sm"
                  placeholder="e.g. A0000"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Branch Name</label>
                <input
                  type="text"
                  value={newBranch.branch_name}
                  onChange={e => setNewBranch(p => ({ ...p, branch_name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-[#027D3F] focus:border-[#027D3F] outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Address</label>
                <input
                  type="text"
                  value={newBranch.address}
                  onChange={e => setNewBranch(p => ({ ...p, address: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-[#027D3F] focus:border-[#027D3F] outline-none text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">State</label>
                  <input
                    type="text"
                    value={newBranch.state}
                    onChange={e => setNewBranch(p => ({ ...p, state: e.target.value.toUpperCase() }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-[#027D3F] focus:border-[#027D3F] outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">District</label>
                  <input
                    type="text"
                    value={newBranch.district}
                    onChange={e => setNewBranch(p => ({ ...p, district: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-[#027D3F] focus:border-[#027D3F] outline-none text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Zone</label>
                <input
                  type="text"
                  value={newBranch.zone}
                  onChange={e => setNewBranch(p => ({ ...p, zone: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-[#027D3F] focus:border-[#027D3F] outline-none text-sm"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="flex-1 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={submitNewBranch}
                className="flex-1 py-2 text-white bg-[#027D3F] hover:bg-[#02612f] rounded-lg font-medium text-sm transition-colors"
              >
                Add Branch
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
