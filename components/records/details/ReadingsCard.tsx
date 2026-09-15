import { EP_LABELS, SectionHeading, StaggerSection, SurveyDetail, getReadingStatus } from "./Shared";

interface ReadingsCardProps {
  r: SurveyDetail;
  editing: boolean;
  setReading: (ep: string, value: string) => void;
  index: number;
}

export function ReadingsCard({ r, editing, setReading, index }: ReadingsCardProps) {
  return (
    <StaggerSection index={index}>
      <section className="bg-white rounded-[14px] border border-gray-100 p-6 sm:p-8 print:border-0 print:p-0 print:rounded-none">
        <SectionHeading>Earthing Readings</SectionHeading>
        <div className="overflow-x-auto -mx-2 sm:mx-0 rounded-lg border border-gray-100">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100">
                <th className="text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider py-3 px-4">EP</th>
                <th className="text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider py-3 px-4">Location</th>
                <th className="text-right text-[11px] font-bold text-gray-500 uppercase tracking-wider py-3 px-4">Reading (V)</th>
                <th className="text-right text-[11px] font-bold text-gray-500 uppercase tracking-wider py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {Object.entries(r.readings ?? {}).map(([ep, value]) => {
                const statusCfg = getReadingStatus(value, ep);
                return (
                  <tr key={ep} className="hover:bg-gray-50/30 transition-colors">
                    <td className="py-3 px-4 text-xs font-mono text-gray-500 font-medium">{ep}</td>
                    <td className="py-3 px-4 text-sm text-gray-800 font-medium">{EP_LABELS[ep] ?? ep}</td>
                    <td className="py-3 px-4 text-right">
                      {editing ? (
                        <input
                          type="number"
                          step="0.1"
                          value={value}
                          onChange={(e) => setReading(ep, e.target.value)}
                          className="w-24 text-right text-sm font-mono border border-gray-200 rounded-md px-2 py-1 outline-none focus:border-[#027D3F] focus:ring-1 focus:ring-[#027D3F]/20"
                        />
                      ) : (
                        <span className="font-mono text-[13px] text-gray-900 font-medium">{value} V</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className={`inline-block px-2.5 py-1 rounded-[6px] text-[10px] font-bold tracking-wide uppercase ${statusCfg.badge}`}>
                        {statusCfg.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        <div className="mt-5 flex items-center gap-2 flex-wrap text-[11px]">
          <span className="text-gray-400 font-medium uppercase tracking-widest">Equipment:</span>
          {(r.equipment ?? []).length > 0 ? (
            (r.equipment ?? []).map((eq, i) => {
              const label = typeof eq === "string" ? eq : ((eq as any).make ?? "");
              return (
                <span key={i} className="font-medium text-gray-600 uppercase">
                  {label}{i < (r.equipment ?? []).length - 1 ? "," : ""}
                </span>
              );
            })
          ) : (
            <span className="text-gray-400">—</span>
          )}
        </div>
      </section>
    </StaggerSection>
  );
}
