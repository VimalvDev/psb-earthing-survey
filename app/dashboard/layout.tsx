"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import { FiZap, FiPlus, FiList, FiBarChart2, FiLogOut } from "react-icons/fi"
import { createClient } from "@/lib/supabase/client"

interface SidebarUser {
  name: string
  emp_id: string
}

const NAV_ITEMS = [
  { href: "/dashboard/survey", label: "Survey", icon: FiPlus },
  { href: "/dashboard/records", label: "Records", icon: FiList },
  { href: "/dashboard/summary", label: "Summary", icon: FiBarChart2 },
]

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("")
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const [user, setUser] = useState<SidebarUser | null>(null)

  useEffect(() => {
    async function loadUser() {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) return

      const { data } = await supabase
        .from("engineers")
        .select("name, emp_id")
        .eq("email", authUser.email)
        .single()

      if (data) setUser(data)
    }
    loadUser()
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push("/login")
  }

  const displayName = user?.name ?? "Loading..."
  const empId = user?.emp_id ?? ""
  const initials = user?.name ? getInitials(user.name) : "--"

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

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-1">
          <span className="px-2 pb-1 text-[10px] font-semibold text-white/40 uppercase tracking-widest">
            Main
          </span>

          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || pathname.startsWith(href + "/")
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-150 ${
                  isActive
                    ? "bg-[#BDD70C] text-[#027D3F] font-semibold"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="text-sm">{label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Bottom — User Info + Logout */}
        <div className="border-t border-white/10 px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#BDD70C] text-[#027D3F] text-xs font-semibold shrink-0">
              {initials}
            </div>
            <div className="flex flex-col flex-1 min-w-0">
              <span className="text-sm font-medium text-white truncate">{displayName}</span>
              <span className="text-[11px] text-white/50 truncate">{empId}</span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center justify-center w-7 h-7 rounded-md text-white/50 hover:text-white hover:bg-white/10 transition-colors duration-150"
              aria-label="Logout"
            >
              <FiLogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </aside>

      {/* ─────────────────────────────────────────────
          MOBILE TOP BAR (below lg)
      ───────────────────────────────────────────── */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-[#027D3F] flex items-center justify-between px-4 z-30">

        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-7 h-7 rounded-md bg-[#BDD70C]">
            <FiZap className="text-[#027D3F] w-3.5 h-3.5" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-white leading-tight">PSB Earthing</span>
            <span className="text-[9px] text-white/50 tracking-wide uppercase leading-none">Pan India</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-7 h-7 rounded-full bg-[#BDD70C] text-[#027D3F] text-[10px] font-semibold">
            {initials}
          </div>
          <button
            onClick={handleLogout}
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
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || pathname.startsWith(href + "/")
            return (
              <Link
                key={href}
                href={href}
                className={`flex-1 flex flex-col items-center justify-center gap-1 transition-colors duration-150 relative ${
                  isActive ? "text-[#027D3F]" : "text-gray-400 hover:text-[#027D3F]"
                }`}
              >
                {isActive && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-[#027D3F] rounded-full" />
                )}
                <Icon className="w-5 h-5" />
                <span className={`text-[10px] ${isActive ? "font-semibold" : "font-medium"}`}>{label}</span>
              </Link>
            )
          })}
        </div>
      </nav>

    </div>
  )
}