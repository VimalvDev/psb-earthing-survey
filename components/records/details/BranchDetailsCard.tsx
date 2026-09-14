import { Field, SectionHeading, StaggerSection, SurveyDetail, formatDate } from "./Shared";

interface BranchDetailsCardProps {
  r: SurveyDetail;
  editData: Partial<SurveyDetail>;
  editing: boolean;
  setField: (k: keyof SurveyDetail, v: string) => void;
  index: number;
}

export function BranchDetailsCard({ r, editData, editing, setField, index }: BranchDetailsCardProps) {
  return (
    <StaggerSection index={index}>
      <section className="bg-white rounded-[14px] shadow-sm border border-gray-100 p-6 sm:p-8 print:shadow-none print:border-0 print:p-0 print:rounded-none">
        <SectionHeading>Branch Details</SectionHeading>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-8 gap-y-6">
          <Field
            label="Branch Code"
            value={editData.bic ?? r.bic ?? ""}
            editing={editing}
            onChange={(v) => setField("bic", v)}
          />
          <Field
            label="Branch Name"
            value={editData.branch_name ?? r.branch_name ?? ""}
            editing={editing}
            onChange={(v) => setField("branch_name", v)}
          />
          <Field
            label="Zone"
            value={editData.zone ?? r.zone ?? ""}
            editing={editing}
            onChange={(v) => setField("zone", v)}
          />
          <Field
            label="State"
            value={editData.state ?? r.state ?? ""}
            editing={editing}
            onChange={(v) => setField("state", v)}
          />
          <Field
            label="District"
            value={editData.district ?? r.district ?? ""}
            editing={editing}
            onChange={(v) => setField("district", v)}
          />
          <Field
            label="Visit Date"
            value={editing ? (editData.visit_date ?? r.visit_date ?? "") : formatDate(r.visit_date)}
            editing={editing}
            onChange={(v) => setField("visit_date", v)}
            type="text"
          />
        </div>

        <div className="my-6 border-t border-gray-100"></div>
        
        <div className="w-full">
          <Field
            label="Address"
            value={editData.address ?? r.address ?? ""}
            editing={editing}
            onChange={(v) => setField("address", v)}
          />
        </div>
      </section>
    </StaggerSection>
  );
}
