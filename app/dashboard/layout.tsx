"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { FiPlus, FiList, FiBarChart2, FiLogOut, FiShield, FiSettings, FiMenu, FiX } from "react-icons/fi"
import { createClient } from "@/lib/supabase/client"

import { useCurrentUser } from "@/lib/hooks/use-current-user"

const MAIN_NAV_ITEMS = [
  { href: "/dashboard/survey", label: "Survey", icon: FiPlus },
  { href: "/dashboard/records", label: "Records", icon: FiList },
  { href: "/dashboard/summary", label: "Summary", icon: FiBarChart2 },
]

const ADMIN_NAV_ITEM = { href: "/dashboard/admin", label: "Admin", icon: FiShield }
const SETTINGS_NAV_ITEM = { href: "/dashboard/settings", label: "Settings", icon: FiSettings }

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("")
}

function NavLink({
  href, label, icon: Icon, isActive, onClick
}: { href: string; label: string; icon: any; isActive: boolean; onClick?: () => void }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors duration-150 ${
        isActive
          ? "bg-[#BDD70C] text-[#027D3F] font-semibold"
          : "text-white/70 hover:bg-white/10 hover:text-white"
      }`}
    >
      <Icon className="w-[18px] h-[18px] shrink-0" />
      <span className="text-[13px]">{label}</span>
    </Link>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const { data: user, isLoading: userLoading } = useCurrentUser()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push("/login")
  }

  const displayName = user?.name ?? "Loading..."
  const empId = user?.emp_id ?? ""
  const initials = user?.name ? getInitials(user.name) : "--"
  const isAdmin = user?.role === "admin"
  const isVisitor = user?.role === "visitor"

  const filteredMainNav = isVisitor 
    ? MAIN_NAV_ITEMS.filter(item => item.label !== "Survey")
    : MAIN_NAV_ITEMS

  const secondaryNavItems = isAdmin ? [ADMIN_NAV_ITEM, SETTINGS_NAV_ITEM] : [SETTINGS_NAV_ITEM]

  return (
    <div className="min-h-screen bg-[#FAF6EE]">

      {/* ─────────────────────────────────────────────
          MOBILE TOP BAR (below lg)
      ───────────────────────────────────────────── */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-[#027D3F] flex items-center justify-between px-4 z-40">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="text-white hover:bg-white/10 p-1.5 rounded-md transition-colors"
          >
            <FiMenu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2.5">
            <Image
              src="/structureindia.png"
              alt="Structure India"
              width={22}
              height={22}
              className="object-contain brightness-0 invert"
            />
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-white leading-tight">PSB Earthing</span>
              <span className="text-[9px] text-white/50 tracking-wide uppercase leading-none">Pan India</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-7 h-7 rounded-full bg-[#BDD70C] text-[#027D3F] text-[10px] font-semibold shrink-0">
            {initials}
          </div>
        </div>
      </header>

      {/* ─────────────────────────────────────────────
          MOBILE DRAWER
      ───────────────────────────────────────────── */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/50 transition-opacity" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="relative w-72 max-w-[85vw] bg-[#027D3F] h-full flex flex-col shadow-none">
            <div className="flex items-center justify-between px-5 py-5 border-b border-white/10">
              <div className="flex items-center gap-2.5 min-w-0">
                <Image
                  src="/structureindia.png"
                  alt="Structure India"
                  width={24}
                  height={24}
                  className="object-contain brightness-0 invert shrink-0"
                />
                <div className="flex flex-col min-w-0">
                  <span className="text-[13px] font-bold text-white leading-tight truncate">PSB Earthing Survey</span>
                </div>
              </div>
              <button onClick={() => setIsMobileMenuOpen(false)} className="text-white/70 hover:text-white p-2 -mr-2 rounded-md hover:bg-white/10 transition-colors">
                <FiX className="w-5 h-5" />
              </button>
            </div>
            
            <nav className="flex-1 overflow-y-auto px-4 py-5 flex flex-col gap-6">
              <div className="flex flex-col gap-1">
                <span className="px-3 pb-2 text-[10px] font-bold text-white/40 uppercase tracking-widest">
                  Main
                </span>
                {filteredMainNav.map(({ href, label, icon }) => (
                  <NavLink
                    key={href}
                    href={href}
                    label={label}
                    icon={icon}
                    isActive={pathname.startsWith(href)}
                    onClick={() => setIsMobileMenuOpen(false)}
                  />
                ))}
              </div>
              <div className="flex flex-col gap-1">
                <span className="px-3 pb-2 text-[10px] font-bold text-white/40 uppercase tracking-widest">
                  Account
                </span>
                {secondaryNavItems.map(({ href, label, icon }) => (
                  <NavLink
                    key={href}
                    href={href}
                    label={label}
                    icon={icon}
                    isActive={pathname === href || pathname.startsWith(href + "/")}
                    onClick={() => setIsMobileMenuOpen(false)}
                  />
                ))}
              </div>
            </nav>
            <div className="border-t border-white/10 px-5 py-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-9 h-9 rounded-full bg-[#BDD70C] text-[#027D3F] text-xs font-bold shrink-0">
                  {initials}
                </div>
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="text-[13px] font-semibold text-white truncate">{displayName}</span>
                  <span className="text-[11px] font-medium text-white/50 truncate">{empId}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center justify-center w-8 h-8 rounded-md text-white/50 hover:text-white hover:bg-white/10 transition-colors duration-150 shrink-0"
                  aria-label="Logout"
                >
                  <FiLogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────
          DESKTOP SIDEBAR (lg+)
      ───────────────────────────────────────────── */}
      <aside className="hidden lg:flex fixed top-0 left-0 h-full w-56 bg-[#027D3F] flex-col z-30 shadow-none border-r border-[#027D3F]">

        {/* Brand Header */}
        <div className="flex items-center gap-3 px-6 py-6 border-b border-white/10">
          <Image
            src="/structureindia.png"
            alt="Structure India"
            width={24}
            height={24}
            className="object-contain brightness-0 invert shrink-0"
          />
          <div className="flex flex-col min-w-0">
            <span className="text-[13px] font-bold text-white leading-tight truncate">PSB Earthing Survey</span>
            <span className="text-[9px] font-medium text-white/50 tracking-wider uppercase mt-0.5">Pan India Inspection</span>
          </div>
        </div>

        {/* Main & Account Nav */}
        <div className="flex-1 overflow-y-auto px-4 py-6 flex flex-col gap-8">
          <nav className="flex flex-col gap-1">
            <span className="px-3 pb-2 text-[10px] font-bold text-white/40 uppercase tracking-widest">
              Main
            </span>
            {filteredMainNav.map(({ href, label, icon }) => (
              <NavLink
                key={href}
                href={href}
                label={label}
                icon={icon}
                isActive={pathname.startsWith(href)}
              />
            ))}
          </nav>

          <nav className="flex flex-col gap-1">
            <span className="px-3 pb-2 text-[10px] font-bold text-white/40 uppercase tracking-widest">
              Account
            </span>
            {secondaryNavItems.map(({ href, label, icon }) => (
              <NavLink
                key={href}
                href={href}
                label={label}
                icon={icon}
                isActive={pathname === href || pathname.startsWith(href + "/")}
              />
            ))}
          </nav>
        </div>

        {/* Bottom — User Info + Logout */}
        <div className="border-t border-white/10 px-5 py-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#BDD70C] text-[#027D3F] text-xs font-bold shrink-0">
              {initials}
            </div>
            <div className="flex flex-col flex-1 min-w-0">
              <span className="text-[13px] font-semibold text-white truncate">{displayName}</span>
              <span className="text-[11px] font-medium text-white/50 truncate">{empId}</span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center justify-center w-7 h-7 rounded-md text-white/50 hover:text-white hover:bg-white/10 transition-colors duration-150 shrink-0"
              aria-label="Logout"
            >
              <FiLogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

      </aside>

      {/* ─────────────────────────────────────────────
          MAIN CONTENT AREA
      ───────────────────────────────────────────── */}
      <main className="lg:ml-56 pt-14 lg:pt-0 min-h-screen flex flex-col">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 w-full flex-1">
          {children}
        </div>
      </main>

    </div>
  )
}