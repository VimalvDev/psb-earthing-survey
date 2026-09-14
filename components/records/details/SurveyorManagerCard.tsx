import { Field, SectionHeading, StaggerSection, SurveyDetail } from "./Shared";

interface SurveyorManagerCardProps {
  r: SurveyDetail;
  editData: Partial<SurveyDetail>;
  editing: boolean;
  setField: (k: keyof SurveyDetail, v: string) => void;
  index: number;
  engineers: any[];
}

export function SurveyorManagerCard({ r, editData, editing, setField, index, engineers }: SurveyorManagerCardProps) {
  return (
    <StaggerSection index={index}>
      <section className="bg-white rounded-[14px] shadow-sm border border-gray-100 p-6 sm:p-8 print:shadow-none print:border-0 print:p-0 print:rounded-none">
        <SectionHeading>Surveyor & Manager Info</SectionHeading>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-6">
          <div className="flex flex-col gap-1">
            <span className="text-[11px] text-gray-400 uppercase tracking-wide">Surveyor Name</span>
            {editing ? (
              <div className="flex flex-col gap-2">
                <select
                  value={engineers.some((e) => e.name === (editData.surveyor_name ?? r.surveyor_name)) ? (editData.surveyor_name ?? r.surveyor_name) : (editData.surveyor_name ?? r.surveyor_name ? "Other" : "")}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "Other") {
                      // Manual entry branch
                    } else if (val === "") {
                      setField("surveyor_name", "");
                      setField("surveyor_emp_id", "");
                      setField("surveyor_mobile", "");
                      setField("surveyor_email", "");
                    } else {
                      const eng = engineers.find((e) => e.name === val);
                      if (eng) {
                        setField("surveyor_name", eng.name);
                        setField("surveyor_emp_id", eng.emp_id);
                        setField("surveyor_mobile", eng.mobile_number);
                        setField("surveyor_email", eng.gmail || eng.email || "");
                      }
                    }
                  }}
                  className="text-sm font-medium text-gray-800 border border-gray-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-[#027D3F] focus:ring-1 focus:ring-[#027D3F]/20 transition-colors bg-[#FAF6EE]"
                >
                  <option value="">Select Surveyor...</option>
                  {engineers.map((eng, idx) => (
                    <option key={eng.emp_id || idx} value={eng.name}>{eng.name}</option>
                  ))}
                  <option value="Other">Other (Manual Entry)</option>
                </select>
                {(!engineers.some((e) => e.name === (editData.surveyor_name ?? r.surveyor_name)) && (editData.surveyor_name ?? r.surveyor_name)) && (
                  <input
                    type="text"
                    value={editData.surveyor_name ?? r.surveyor_name ?? ""}
                    onChange={(e) => setField("surveyor_name", e.target.value)}
                    className="text-sm font-medium text-gray-800 border border-gray-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-[#027D3F] focus:ring-1 focus:ring-[#027D3F]/20 transition-colors bg-[#FAF6EE]"
                    placeholder="Type name manually..."
                  />
                )}
              </div>
            ) : (
              <span className="text-sm font-medium text-gray-800">{r.surveyor_name || r.surveyor_emp_id || "—"}</span>
            )}
          </div>
          <Field
            label="Surveyor Mobile"
            value={editData.surveyor_mobile ?? r.surveyor_mobile ?? ""}
            editing={editing}
            onChange={(v) => setField("surveyor_mobile", v)}
          />
          <Field
            label="Branch Manager"
            value={editData.manager_name ?? r.manager_name ?? ""}
            editing={editing}
            onChange={(v) => setField("manager_name", v)}
          />
          <div className="flex flex-col gap-4">
            <Field
              label="Manager Mobile"
              value={editData.phone_no ?? r.phone_no ?? ""}
              editing={editing}
              onChange={(v) => setField("phone_no", v)}
            />
            {(r.phone_no_alt || editing) && (
              <Field
                label="Alternate Mobile"
                value={editData.phone_no_alt ?? r.phone_no_alt ?? ""}
                editing={editing}
                onChange={(v) => setField("phone_no_alt", v)}
              />
            )}
          </div>
        </div>
      </section>
    </StaggerSection>
  );
}
