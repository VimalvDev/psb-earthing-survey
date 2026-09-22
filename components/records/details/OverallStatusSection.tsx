import { SectionHeading, StaggerSection, SurveyDetail, OverallStatus, OVERALL_CONFIG, formatDate } from "./Shared";

interface OverallStatusSectionProps {
  r: SurveyDetail;
  editData: Partial<SurveyDetail>;
  editing: boolean;
  setEditData: React.Dispatch<React.SetStateAction<Partial<SurveyDetail>>>;
  overallStatus: string;
  overallCfg: (typeof OVERALL_CONFIG)[OverallStatus];
  index: number;
}

export function OverallStatusSection({ r, editData, editing, setEditData, overallStatus, overallCfg, index }: OverallStatusSectionProps) {
  return (
    <StaggerSection index={index}>
      <section className="bg-white rounded-[14px] border border-gray-100 p-6 sm:p-8 print:border-0 print:p-0 print:rounded-none">
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
    </StaggerSection>
  );
}
