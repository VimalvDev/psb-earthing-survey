import { FiZap, FiPlus, FiList, FiBarChart2, FiCamera, FiEdit3, FiFileText, FiMoreHorizontal, FiLogOut } from "react-icons/fi"
import Link from "next/link"
 
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#FAF6EE]">
 
      {/* ─────────────────────────────────────────────
          DESKTOP SIDEBAR (lg+)
      ───────────────────────────────────────────── */}
      <aside className="hidden lg:flex fixed top-0 left-0 h-full w-64 bg-[#027D3F] flex-col z-30">
 
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-[#BDD70C]">
            <FiZap className="text-[#027D3F] w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-white leading-tight">PSB Earthing Survey</span>
            <span className="text-[10px] text-white/50 tracking-wide uppercase">Pan India Inspection</span>
          </div>
        </div>
 
        {/* Nav Sections — flex-1 so it fills space, pushing user block to bottom */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-1">
 
          {/* ── Main Navigation ── */}
          <span className="px-2 pb-1 text-[10px] font-semibold text-white/40 uppercase tracking-widest">
            Main
          </span>
 
          {/* New Survey */}
          {/* ACTIVE STATE: add/remove 'bg-[#BDD70C] text-[#027D3F] font-semibold' class via JS later */}
          <Link
            href="/dashboard/survey"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/70 hover:bg-white/10 hover:text-white transition-colors duration-150 group"
          >
            <FiPlus className="w-4 h-4 shrink-0" />
            <span className="text-sm">New Survey</span>
          </Link>
 
          {/* Records */}
          {/* ACTIVE STATE: add/remove 'bg-[#BDD70C] text-[#027D3F] font-semibold' class via JS later */}
          <Link
            href="/dashboard/records"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/70 hover:bg-white/10 hover:text-white transition-colors duration-150 group"
          >
            <FiList className="w-4 h-4 shrink-0" />
            <span className="text-sm">Records</span>
          </Link>
 
          {/* Summary */}
          {/* ACTIVE STATE: add/remove 'bg-[#BDD70C] text-[#027D3F] font-semibold' class via JS later */}
          <Link
            href="/dashboard/summary"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-[#BDD70C] text-[#027D3F] font-semibold transition-colors duration-150"
          >
            <FiBarChart2 className="w-4 h-4 shrink-0" />
            <span className="text-sm">Summary</span>
          </Link>
 
          {/* ── Section Divider ── */}
          <div className="my-3 border-t border-white/10" />
 
          {/* ── Tools Section ── */}
          <span className="px-2 pb-1 text-[10px] font-semibold text-white/40 uppercase tracking-widest">
            Tools
          </span>
 
          {/* Camera */}
          {/* ACTIVE STATE: add/remove 'bg-[#BDD70C] text-[#027D3F] font-semibold' class via JS later */}
          <Link
            href="/dashboard/survey/camera"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/70 hover:bg-white/10 hover:text-white transition-colors duration-150 group"
          >
            <FiCamera className="w-4 h-4 shrink-0" />
            <span className="text-sm">Camera</span>
            <span className="ml-auto text-[9px] font-semibold text-[#EF9447] bg-[#EF9447]/15 px-1.5 py-0.5 rounded">
              Phase 9
            </span>
          </Link>
 
          {/* Signature */}
          {/* ACTIVE STATE: add/remove 'bg-[#BDD70C] text-[#027D3F] font-semibold' class via JS later */}
          <Link
            href="/dashboard/survey/signature"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/70 hover:bg-white/10 hover:text-white transition-colors duration-150 group"
          >
            <FiEdit3 className="w-4 h-4 shrink-0" />
            <span className="text-sm">Signature</span>
            <span className="ml-auto text-[9px] font-semibold text-[#EF9447] bg-[#EF9447]/15 px-1.5 py-0.5 rounded">
              Phase 10
            </span>
          </Link>
 
          {/* Scan Document */}
          {/* ACTIVE STATE: add/remove 'bg-[#BDD70C] text-[#027D3F] font-semibold' class via JS later */}
          <Link
            href="/dashboard/survey/scan"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/70 hover:bg-white/10 hover:text-white transition-colors duration-150 group"
          >
            <FiFileText className="w-4 h-4 shrink-0" />
            <span className="text-sm">Scan Document</span>
            <span className="ml-auto text-[9px] font-semibold text-[#EF9447] bg-[#EF9447]/15 px-1.5 py-0.5 rounded">
              Phase 11
            </span>
          </Link>
 
        </nav>
 
        {/* ── Bottom — User Info + Logout ── */}
        <div className="border-t border-white/10 px-4 py-4">
          <div className="flex items-center gap-3">
            {/* Avatar initials */}
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#BDD70C] text-[#027D3F] text-xs font-semibold shrink-0">
              AK
            </div>
            <div className="flex flex-col flex-1 min-w-0">
              <span className="text-sm font-medium text-white truncate">Amit Kumar</span>
              <span className="text-[11px] text-white/50 truncate">EMP-1042</span>
            </div>
            {/* Logout */}
            <button
              className="flex items-center justify-center w-7 h-7 rounded-md text-white/50 hover:text-white hover:bg-white/10 transition-colors duration-150"
              aria-label="Logout"
            >
              <Link className="w-full h-full flex items-center justify-center" href={"/login"} >
              <FiLogOut className="w-3.5 h-3.5" />
              </Link>
            </button>
          </div>
        </div>
 
      </aside>
 
      {/* ─────────────────────────────────────────────
          MOBILE TOP BAR (below lg)
      ───────────────────────────────────────────── */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-[#027D3F] flex items-center justify-between px-4 z-30">
 
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-7 h-7 rounded-md bg-[#BDD70C]">
            <FiZap className="text-[#027D3F] w-3.5 h-3.5" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-white leading-tight">PSB Earthing</span>
            <span className="text-[9px] text-white/50 tracking-wide uppercase leading-none">Pan India</span>
          </div>
        </div>
 
        {/* Right — Avatar + Logout */}
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-7 h-7 rounded-full bg-[#BDD70C] text-[#027D3F] text-[10px] font-semibold">
            AK
          </div>
          <button
            className="flex items-center justify-center w-7 h-7 rounded-md text-white/60 hover:text-white hover:bg-white/10 transition-colors duration-150"
            aria-label="Logout"
          >
            <FiLogOut className="w-3.5 h-3.5" />
          </button>
        </div>
 
      </header>
 
      {/* ─────────────────────────────────────────────
          MAIN CONTENT AREA
      ───────────────────────────────────────────── */}
      <main className="lg:ml-64 pt-14 lg:pt-0 pb-20 lg:pb-0 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </div>
      </main>
 
      {/* ─────────────────────────────────────────────
          MOBILE BOTTOM NAV (below lg)
      ───────────────────────────────────────────── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30 safe-area-pb">
        <div className="flex items-stretch h-16">
 
          {/* Survey */}
          {/* ACTIVE STATE: add/remove 'text-[#027D3F]' and bg indicator via JS later */}
          <Link
            href="/dashboard/survey"
            className="flex-1 flex flex-col items-center justify-center gap-1 text-gray-400 hover:text-[#027D3F] transition-colors duration-150 relative group"
          >
            <FiPlus className="w-5 h-5" />
            <span className="text-[10px] font-medium">Survey</span>
          </Link>
 
          {/* Records */}
          {/* ACTIVE STATE: add/remove 'text-[#027D3F]' and bg indicator via JS later */}
          <Link
            href="/dashboard/records"
            className="flex-1 flex flex-col items-center justify-center gap-1 text-gray-400 hover:text-[#027D3F] transition-colors duration-150 relative group"
          >
            <FiList className="w-5 h-5" />
            <span className="text-[10px] font-medium">Records</span>
          </Link>
 
          {/* Summary — active example */}
          {/* ACTIVE STATE: add/remove 'text-[#027D3F]' and bg indicator via JS later */}
          <Link
            href="/dashboard/summary"
            className="flex-1 flex flex-col items-center justify-center gap-1 text-[#027D3F] transition-colors duration-150 relative"
          >
            {/* Active indicator bar */}
            <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-[#027D3F] rounded-full" />
            <FiBarChart2 className="w-5 h-5" />
            <span className="text-[10px] font-semibold">Summary</span>
          </Link>
 
          {/* Camera */}
          {/* ACTIVE STATE: add/remove 'text-[#027D3F]' and bg indicator via JS later */}
          <Link
            href="/dashboard/survey/camera"
            className="flex-1 flex flex-col items-center justify-center gap-1 text-gray-400 hover:text-[#027D3F] transition-colors duration-150 relative group"
          >
            <FiCamera className="w-5 h-5" />
            <span className="text-[10px] font-medium">Camera</span>
          </Link>
 
          {/* More — triggers slide-up drawer */}
          {/* JS: toggle open/close state here */}
          <button
            className="flex-1 flex flex-col items-center justify-center gap-1 text-gray-400 hover:text-[#027D3F] transition-colors duration-150"
            aria-label="More options"
          >
            <FiMoreHorizontal className="w-5 h-5" />
            <span className="text-[10px] font-medium">More</span>
          </button>
 
        </div>
      </nav>
 
      {/* ─────────────────────────────────────────────
          MOBILE "MORE" SLIDE-UP DRAWER
          JS: toggle 'translate-y-full' / 'translate-y-0' to open/close
      ───────────────────────────────────────────── */}
 
      {/* Backdrop — JS: toggle 'opacity-0 pointer-events-none' / 'opacity-100' */}
      <div className="lg:hidden fixed inset-0 bg-black/40 z-40 opacity-0 pointer-events-none transition-opacity duration-200" />
 
      {/* Drawer panel */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl translate-y-full transition-transform duration-300 ease-out">
 
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <span className="w-10 h-1 rounded-full bg-gray-200" />
        </div>
 
        {/* Drawer header */}
        <div className="px-5 pt-2 pb-3 border-b border-gray-100">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Tools</span>
        </div>
 
        {/* Drawer items */}
        <div className="px-3 py-3 flex flex-col gap-1">
 
          <Link
            href="/dashboard/survey/signature"
            className="flex items-center gap-4 px-4 py-3.5 rounded-xl text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors duration-150"
          >
            <div className="w-9 h-9 rounded-lg bg-[#027D3F]/10 flex items-center justify-center shrink-0">
              <FiEdit3 className="w-4 h-4 text-[#027D3F]" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-gray-900">Signature Pad</span>
              <span className="text-xs text-gray-400">Manager sign-off</span>
            </div>
          </Link>
 
          <Link
            href="/dashboard/survey/scan"
            className="flex items-center gap-4 px-4 py-3.5 rounded-xl text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors duration-150"
          >
            <div className="w-9 h-9 rounded-lg bg-[#027D3F]/10 flex items-center justify-center shrink-0">
              <FiFileText className="w-4 h-4 text-[#027D3F]" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-gray-900">Scan Document</span>
              <span className="text-xs text-gray-400">OCR paper form</span>
            </div>
          </Link>
 
        </div>
 
        {/* Safe area spacer for bottom nav height */}
        <div className="h-20" />
 
      </div>
 
    </div>
  )
}
 