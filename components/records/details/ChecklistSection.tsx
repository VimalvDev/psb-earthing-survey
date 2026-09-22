import { FiCheckCircle, FiCircle } from "react-icons/fi";
import { SectionHeading, StaggerSection, SurveyDetail } from "./Shared";

interface ChecklistSectionProps {
  r: SurveyDetail;
  editing: boolean;
  toggleChecklist: (label: string) => void;
  index: number;
}

export function ChecklistSection({ r, editing, toggleChecklist, index }: ChecklistSectionProps) {
  if (Object.keys(r.checklist ?? {}).length === 0) return null;

  return (
    <StaggerSection index={index}>
      <section className="bg-white rounded-[14px] border border-gray-100 p-6 sm:p-8 print:border-0 print:p-0 print:rounded-none mb-6">
        <SectionHeading>Visual Inspection Checklist</SectionHeading>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6 mb-2">
          {Object.entries(r.checklist ?? {}).map(([label, checked]) => (
            <div
              key={label}
              onClick={() => editing && toggleChecklist(label)}
              className={`flex items-start gap-3 ${editing ? "cursor-pointer select-none rounded-lg p-1.5 -ml-1.5 hover:bg-gray-50 transition-colors" : ""}`}
            >
              <div className="mt-0.5">
                {checked ? (
                  <FiCheckCircle className="w-[15px] h-[15px] text-[#027D3F] shrink-0" />
                ) : (
                  <FiCircle className="w-[15px] h-[15px] text-gray-300 shrink-0" />
                )}
              </div>
              <span
                className={`text-[13px] font-medium leading-snug ${checked ? "text-gray-800" : "text-gray-400"}`}
              >
                {label}
              </span>
            </div>
          ))}
        </div>
      </section>
    </StaggerSection>
  );
}
