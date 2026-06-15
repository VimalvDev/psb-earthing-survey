import { FiCheckCircle, FiAlertTriangle, FiXCircle, FiGrid, FiFileText, FiChevronRight } from "react-icons/fi";
 
export default function SummaryPage() {
  return (
    <div className="min-h-screen bg-[#FAF6EE]">
      <div className="max-w-6xl mx-auto px-4 lg:px-8 py-6 lg:py-8">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Summary</h1>
            <p className="text-sm text-gray-500 mt-1">
              Earthing survey coverage across all branches
            </p>
          </div>
 
          <div className="flex gap-3">
            <button className="inline-flex items-center gap-2 bg-[#027D3F] rounded-lg px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#02612f] transition-colors">
              <FiGrid size={16} />
              Export Excel
            </button>
            {/* JS: trigger xlsx download */}
 
            <button className="inline-flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm font-medium text-gray-700 hover:border-[#EF9447] hover:text-[#EF9447] transition-colors">
              <FiFileText size={16} />
              Export CSV
            </button>
            {/* JS: trigger csv download */}
          </div>
        </div>
 
        {/* Stat row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {/* Total */}
          <div className="bg-[#EF9447] rounded-xl p-5 flex flex-col gap-2">
            <div className="w-10 h-10 rounded-lg bg-[#BDD70C] flex items-center justify-center">
              <FiGrid size={18} className="text-[#027D3F]" />
            </div>
            <span className="text-3xl font-bold text-white">248</span>
            <span className="text-xs text-white/70">Total Surveys</span>
          </div>
 
          {/* Pass */}
          <div className="bg-white rounded-xl border border-gray-100 p-5 flex flex-col gap-2">
            <div className="w-10 h-10 rounded-lg bg-[#027D3F]/10 flex items-center justify-center">
              <FiCheckCircle size={18} className="text-[#027D3F]" />
            </div>
            <span className="text-3xl font-bold text-gray-900">189</span>
            <span className="text-xs text-gray-500">Pass</span>
          </div>
 
          {/* Partial */}
          <div className="bg-white rounded-xl border border-gray-100 p-5 flex flex-col gap-2">
            <div className="w-10 h-10 rounded-lg bg-[#BDD70C]/20 flex items-center justify-center">
              <FiAlertTriangle size={18} className="text-[#8A9C08]" />
            </div>
            <span className="text-3xl font-bold text-gray-900">41</span>
            <span className="text-xs text-gray-500">Partial</span>
          </div>
 
          {/* Fail */}
          <div className="bg-white rounded-xl border border-gray-100 p-5 flex flex-col gap-2">
            <div className="w-10 h-10 rounded-lg bg-[#E41E23]/10 flex items-center justify-center">
              <FiXCircle size={18} className="text-[#E41E23]" />
            </div>
            <span className="text-3xl font-bold text-gray-900">18</span>
            <span className="text-xs text-gray-500">Fail</span>
          </div>
          {/* JS: calculate counts from records data */}
        </div>
 
        {/* State-wise coverage */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-1">State-wise Coverage</h2>
 
          <div className="flex items-center gap-4 text-xs text-gray-400 mb-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#027D3F]" />
              Pass
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#BDD70C]" />
              Partial
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#E41E23]" />
              Fail
            </span>
          </div>
 
          <div className="flex flex-col">
            {/* Delhi */}
            <div className="py-4 border-b border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-gray-900">Delhi</span>
                <span className="text-xs text-gray-400">9 / 12 branches</span>
              </div>
              <div className="h-2.5 w-full rounded-full overflow-hidden flex bg-gray-100">
                <div className="bg-[#027D3F]" style={{ width: "50%" }} />
                <div className="bg-[#BDD70C]" style={{ width: "16.7%" }} />
                <div className="bg-[#E41E23]" style={{ width: "8.3%" }} />
                {/* JS: calculate segment widths from pass/partial/fail counts */}
              </div>
            </div>
 
            {/* Uttar Pradesh */}
            <div className="py-4 border-b border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-gray-900">Uttar Pradesh</span>
                <span className="text-xs text-gray-400">14 / 20 branches</span>
              </div>
              <div className="h-2.5 w-full rounded-full overflow-hidden flex bg-gray-100">
                <div className="bg-[#027D3F]" style={{ width: "50%" }} />
                <div className="bg-[#BDD70C]" style={{ width: "15%" }} />
                <div className="bg-[#E41E23]" style={{ width: "5%" }} />
                {/* JS: calculate segment widths from pass/partial/fail counts */}
              </div>
            </div>
 
            {/* Punjab */}
            <div className="py-4 border-b border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-gray-900">Punjab</span>
                <span className="text-xs text-gray-400">18 / 22 branches</span>
              </div>
              <div className="h-2.5 w-full rounded-full overflow-hidden flex bg-gray-100">
                <div className="bg-[#027D3F]" style={{ width: "68.2%" }} />
                <div className="bg-[#BDD70C]" style={{ width: "9.1%" }} />
                <div className="bg-[#E41E23]" style={{ width: "4.5%" }} />
                {/* JS: calculate segment widths from pass/partial/fail counts */}
              </div>
            </div>
 
            {/* Maharashtra */}
            <div className="py-4 border-b border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-gray-900">Maharashtra</span>
                <span className="text-xs text-gray-400">11 / 16 branches</span>
              </div>
              <div className="h-2.5 w-full rounded-full overflow-hidden flex bg-gray-100">
                <div className="bg-[#027D3F]" style={{ width: "50%" }} />
                <div className="bg-[#BDD70C]" style={{ width: "12.5%" }} />
                <div className="bg-[#E41E23]" style={{ width: "6.25%" }} />
                {/* JS: calculate segment widths from pass/partial/fail counts */}
              </div>
            </div>
 
            {/* Rajasthan */}
            <div className="py-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-gray-900">Rajasthan</span>
                <span className="text-xs text-gray-400">7 / 10 branches</span>
              </div>
              <div className="h-2.5 w-full rounded-full overflow-hidden flex bg-gray-100">
                <div className="bg-[#027D3F]" style={{ width: "50%" }} />
                <div className="bg-[#BDD70C]" style={{ width: "10%" }} />
                <div className="bg-[#E41E23]" style={{ width: "10%" }} />
                {/* JS: calculate segment widths from pass/partial/fail counts */}
              </div>
            </div>
          </div>
 
          <button className="inline-flex items-center gap-1 bg-[#BDD70C] text-[#027D3F] text-sm font-semibold rounded-lg px-3 py-1.5 mt-4 hover:bg-[#a9c00b] transition-colors">
            View all states
            <FiChevronRight size={16} />
          </button>
          {/* JS: link to full state-wise breakdown */}
        </div>
 
        <p className="text-xs text-gray-400 mt-4">Exports include all filtered records</p>
      </div>
    </div>
  );
}
 