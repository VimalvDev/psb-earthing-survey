"use client"

import { useState, useMemo } from "react"
import { FiSearch, FiMoreVertical, FiKey, FiTrash2, FiX, FiCheck, FiLoader, FiUserPlus, FiFilter, FiCalendar } from "react-icons/fi"
import { Engineer, Role, useUpdateRole, useDeleteUser, useUpdateAllowedYears, useCreateUser } from "./hooks"

export const ROLE_STYLES: Record<Role, { bg: string, text: string, label: string }> = {
  admin: { bg: "bg-[#EAF3DE]", text: "text-[#3B6D11]", label: "Admin" },
  manager: { bg: "bg-[#FAEEDA]", text: "text-[#854F0B]", label: "Manager" },
  engineer: { bg: "bg-[#E6F1FB]", text: "text-[#185FA5]", label: "Engineer" },
  visitor: { bg: "bg-[#F3F4F6]", text: "text-[#4B5563]", label: "Visitor" },
}

export const ALL_YEARS = [
  "2026-27",
  "2025-26",
  "2024-25",
  "2023-24",
  "2022-23",
  "2021-22",
]

export function UserManagementHeader({ 
  users, 
  onAddUser,
  roleFilter,
  setRoleFilter
}: { 
  users: Engineer[], 
  onAddUser: () => void,
  roleFilter: string,
  setRoleFilter: (r: string) => void
}) {
  const counts = useMemo(() => {
    const base = { total: users.length, admin: 0, manager: 0, engineer: 0, visitor: 0 }
    users.forEach((u) => { base[u.role] += 1 })
    return base
  }, [users])

  return (
    <div className="flex flex-col gap-4 mb-2">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">User Management</h1>
          <p className="text-[13px] text-gray-500 mt-1">Manage users, roles, and report-year access.</p>
        </div>
        <button
          onClick={onAddUser}
          className="h-8 px-3.5 rounded-md bg-[#027D3F] hover:bg-[#02612f] text-white text-[13px] font-semibold flex items-center gap-2 transition-all duration-200 shadow-sm hover:shadow active:scale-95"
        >
          <FiUserPlus size={14} /> Add User
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100">
        <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mr-2 hidden sm:block">Quick Filter:</span>
        <SummaryBadge label="All Users" count={counts.total} active={roleFilter === "all"} onClick={() => setRoleFilter("all")} />
        <SummaryBadge label="Admins" count={counts.admin} active={roleFilter === "admin"} colorClass="text-[#3B6D11]" onClick={() => setRoleFilter("admin")} />
        <SummaryBadge label="Managers" count={counts.manager} active={roleFilter === "manager"} colorClass="text-[#854F0B]" onClick={() => setRoleFilter("manager")} />
        <SummaryBadge label="Engineers" count={counts.engineer} active={roleFilter === "engineer"} colorClass="text-[#185FA5]" onClick={() => setRoleFilter("engineer")} />
        <SummaryBadge label="Visitors" count={counts.visitor} active={roleFilter === "visitor"} colorClass="text-[#4B5563]" onClick={() => setRoleFilter("visitor")} />
      </div>
    </div>
  )
}

function SummaryBadge({ 
  label, count, active, onClick, colorClass = "text-gray-900" 
}: { 
  label: string, count: number, active: boolean, onClick: () => void, colorClass?: string 
}) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[13px] transition-colors ${
        active ? 'bg-gray-100 border border-gray-300' : 'bg-transparent hover:bg-gray-50 border border-transparent hover:border-gray-200'
      }`}
    >
      <span className={active ? 'text-gray-900 font-medium' : 'text-gray-500'}>{label}</span>
      <span className={`font-bold ${colorClass}`}>{count}</span>
    </button>
  )
}

export function UserFilters({ 
  search, 
  setSearch, 
  roleFilter, 
  setRoleFilter,
  yearFilter,
  setYearFilter
}: { 
  search: string, 
  setSearch: (s: string) => void,
  roleFilter: string,
  setRoleFilter: (r: string) => void,
  yearFilter: string,
  setYearFilter: (y: string) => void
}) {
  return (
    <div className="flex flex-col sm:flex-row gap-2 mb-3">
      <div className="relative flex-1 max-w-md">
        <FiSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          placeholder="Search name, ID, email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-9 pl-9 pr-4 text-[13px] border border-gray-200 rounded-md bg-white outline-none transition-all duration-200 focus:border-[#027D3F] focus:ring-4 focus:ring-[#027D3F]/10 hover:border-gray-300"
        />
      </div>
      <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 hide-scrollbar">
        <div className="relative shrink-0">
          <FiFilter size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="h-9 pl-8 pr-7 text-[13px] border border-gray-200 rounded-md bg-white outline-none transition focus:border-[#027D3F] appearance-none font-medium text-gray-700 cursor-pointer min-w-[130px]"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="manager">Manager</option>
            <option value="engineer">Engineer</option>
            <option value="visitor">Visitor</option>
          </select>
        </div>
        <div className="relative shrink-0">
          <FiCalendar size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className="h-9 pl-8 pr-7 text-[13px] border border-gray-200 rounded-md bg-white outline-none transition focus:border-[#027D3F] appearance-none font-medium text-gray-700 cursor-pointer min-w-[140px]"
          >
            <option value="all">All Year Access</option>
            <option value="all_years">All Years</option>
            {ALL_YEARS.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
            <option value="no_access">No Access</option>
          </select>
        </div>
      </div>
    </div>
  )
}

export function YearAccessDisplay({ 
  years, 
  onManage 
}: { 
  years?: string[] | null, 
  onManage: () => void 
}) {
  let display = ""
  const isNoAccess = years?.length === 1 && years[0] === "NONE"
  const isAllYears = !years || years.length === 0

  if (isNoAccess) {
    display = "No Access"
  } else if (isAllYears) {
    display = "All Years"
  } else if (years.length === 1) {
    display = years[0]
  } else if (years.length === 2) {
    display = years.join(" · ")
  } else {
    display = `${years.length} Years`
  }

  return (
    <div className="flex items-center justify-between gap-2 group cursor-pointer" onClick={onManage}>
      <span className={`text-[12px] font-semibold ${isAllYears ? "text-gray-900" : isNoAccess ? "text-[#A32D2D]" : "text-gray-700"}`}>
        {display}
      </span>
      <button className="text-[11px] font-semibold text-[#027D3F] opacity-0 group-hover:opacity-100 transition-opacity">
        Manage
      </button>
    </div>
  )
}

export function YearAccessEditor({ 
  user, 
  onClose 
}: { 
  user: Engineer, 
  onClose: () => void 
}) {
  const updateYears = useUpdateAllowedYears()
  
  const hasNoAccess = user.allowed_years?.length === 1 && user.allowed_years[0] === "NONE"
  const initialAllYears = !hasNoAccess && (!user.allowed_years || user.allowed_years.length === 0)
  
  const [isAllYears, setIsAllYears] = useState(initialAllYears)
  const [selected, setSelected] = useState<Set<string>>(new Set(hasNoAccess ? [] : (user.allowed_years || [])))

  function handleToggleYear(fy: string) {
    const next = new Set(selected)
    if (next.has(fy)) next.delete(fy)
    else next.add(fy)
    setSelected(next)
    if (next.size > 0) setIsAllYears(false)
  }

  function handleToggleAllYears() {
    setIsAllYears(!isAllYears)
    if (!isAllYears) {
      setSelected(new Set())
    }
  }

  function handleSelectAll() {
    setSelected(new Set(ALL_YEARS))
    setIsAllYears(false)
  }

  function handleDeselectAll() {
    setSelected(new Set())
    setIsAllYears(false)
  }

  function handleSave() {
    let yearsToSave: string[] = []
    
    if (isAllYears) {
      yearsToSave = []
    } else if (selected.size === 0) {
      yearsToSave = ["NONE"]
    } else {
      yearsToSave = Array.from(selected)
    }

    updateYears.mutate(
      { id: user.id, allowed_years: yearsToSave },
      { onSuccess: onClose }
    )
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 sm:p-4 transition-all duration-300">
      <div className="bg-white rounded-t-2xl sm:rounded-xl p-5 max-w-sm w-full max-h-[90vh] flex flex-col opacity-0 animate-[fadeInUp_0.2s_ease-out_both] shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 text-[15px]">Report Year Access</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1.5 rounded-md hover:bg-gray-100 transition-colors">
            <FiX size={16} />
          </button>
        </div>
        
        <div className="mb-4 bg-gray-50 rounded-md p-3 border border-gray-100 flex items-center gap-3">
           <div className="w-9 h-9 rounded bg-white border border-gray-200 flex items-center justify-center text-gray-600 font-bold text-[13px] shrink-0">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-gray-900 text-[13px]">{user.name}</p>
            <p className="text-[11px] text-gray-500 capitalize font-medium">{user.role}</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto mb-4">
          <label className="flex items-center gap-3 p-3 rounded-md border border-[#027D3F]/20 bg-[#F4FAF6] cursor-pointer mb-3">
            <input
              type="checkbox"
              checked={isAllYears}
              onChange={handleToggleAllYears}
              className="w-4 h-4 rounded text-[#027D3F] border-[#027D3F]/30 focus:ring-[#027D3F]"
            />
            <div>
              <span className="text-[13px] font-semibold text-[#027D3F]">All Years</span>
              <p className="text-[11px] text-[#027D3F]/70 mt-0.5">Allow viewing reports from every year.</p>
            </div>
          </label>

          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Selected Years</span>
            {!isAllYears && (
              <div className="flex gap-2 text-[11px] animate-[fadeIn_0.2s_ease-out]">
                <button onClick={handleSelectAll} className="text-[#027D3F] font-semibold hover:underline">Select all</button>
                <span className="text-gray-300">|</span>
                <button onClick={handleDeselectAll} className="text-gray-500 hover:underline">Clear</button>
              </div>
            )}
          </div>

          <div className={`grid grid-cols-2 gap-2 transition-opacity ${isAllYears ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
            {ALL_YEARS.map((fy) => (
              <label
                key={fy}
                className="flex items-center gap-2 p-2 rounded-md border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selected.has(fy)}
                  onChange={() => handleToggleYear(fy)}
                  className="w-3.5 h-3.5 rounded text-[#027D3F] border-gray-300 focus:ring-[#027D3F]"
                />
                <span className="text-[12px] font-medium text-gray-700">{fy}</span>
              </label>
            ))}
          </div>
          
          {!isAllYears && selected.size === 0 && (
            <div className="mt-3 p-2 bg-[#FDECEC] border border-[#F5B9B9] rounded-md text-[11px] text-[#A32D2D] font-medium text-center">
              User will have No Access.
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-3 border-t border-gray-100 mt-auto">
          <button
            onClick={onClose}
            className="flex-1 h-9 rounded-md border border-gray-200 text-gray-700 font-medium text-[13px] hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={updateYears.isPending}
            className="flex-1 h-9 rounded-md bg-[#027D3F] hover:bg-[#02612f] text-white font-semibold text-[13px] flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
          >
            {updateYears.isPending ? <FiLoader size={14} className="animate-spin" /> : "Save"}
          </button>
        </div>
      </div>
      <style jsx global>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: scale(0.98); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  )
}

export function CreateUserModal({ onClose }: { onClose: () => void }) {
  const createUser = useCreateUser()

  const [form, setForm] = useState({
    name: "",
    emp_id: "",
    designation: "",
    email: "",
    mobile_number: "",
    password: "",
    role: "engineer" as Role,
    allowed_years: [] as string[],
  })
  const [isAllYears, setIsAllYears] = useState(true)

  const [status, setStatus] = useState<"idle" | "success" | "error">("idle")
  const [errorMsg, setErrorMsg] = useState("")

  function update<K extends keyof typeof form>(key: K, value: typeof form[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function handleToggleYear(fy: string) {
    const current = new Set(form.allowed_years)
    if (current.has(fy)) current.delete(fy)
    else current.add(fy)
    
    const nextArr = Array.from(current)
    update("allowed_years", nextArr)
    if (nextArr.length > 0) setIsAllYears(false)
  }

  function handleToggleAllYears() {
    const nextAllYears = !isAllYears
    setIsAllYears(nextAllYears)
    if (nextAllYears) {
      update("allowed_years", [])
    }
  }

  function handleSubmit() {
    setStatus("idle")
    if (!form.name.trim() || !form.emp_id.trim() || !form.password) {
      setStatus("error")
      setErrorMsg("Name, Employee ID, and Password are required.")
      return
    }
    if (form.password.length < 8) {
      setStatus("error")
      setErrorMsg("Password must be at least 8 characters.")
      return
    }

    const payload = { ...form }
    if (isAllYears) {
      payload.allowed_years = []
    } else if (payload.allowed_years.length === 0) {
      payload.allowed_years = ["NONE"]
    }

    createUser.mutate(payload, {
      onSuccess: () => setStatus("success"),
      onError: (err) => {
        setStatus("error")
        setErrorMsg(err instanceof Error ? err.message : "Failed to create user.")
      },
    })
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 sm:p-4 transition-all duration-300">
      <div className="bg-white rounded-t-2xl sm:rounded-xl p-5 sm:p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto opacity-0 animate-[fadeInUp_0.2s_ease-out_both] shadow-xl">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <FiUserPlus size={16} className="text-[#027D3F]" />
            <h3 className="font-semibold text-gray-900 text-[15px]">Add New User</h3>
          </div>
          <button onClick={onClose} aria-label="Close" className="text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 p-1.5 rounded-md transition-colors">
            <FiX size={16} />
          </button>
        </div>

        {status === "success" ? (
          <div className="flex flex-col items-center text-center gap-3 py-10">
            <div className="w-12 h-12 rounded-full bg-[#E8F5EE] flex items-center justify-center mb-1">
              <FiCheck size={24} className="text-[#027D3F]" />
            </div>
            <h4 className="text-[15px] font-semibold text-gray-900">User Created</h4>
            <p className="text-[13px] text-gray-600 max-w-xs">{form.name} can now log in with the User ID and password.</p>
            <button onClick={onClose} className="mt-4 h-9 px-6 rounded-md bg-[#027D3F] text-white font-medium text-[13px] hover:bg-[#02612f] transition-colors">
              Done
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-5 mt-4">
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Full name *" value={form.name} onChange={(v) => update("name", v)} placeholder="Ramesh Kumar" />
                <Field label="Employee ID *" value={form.emp_id} onChange={(v) => update("emp_id", v)} placeholder="SI 0030" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Email" value={form.email} onChange={(v) => update("email", v)} placeholder="name@email.com" type="email" />
                <Field label="Mobile" value={form.mobile_number} onChange={(v) => update("mobile_number", v)} placeholder="10-digit number" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Designation" value={form.designation} onChange={(v) => update("designation", v)} placeholder="Site Engineer" />
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Role *</label>
                  <div className="relative">
                    <select
                      value={form.role}
                      onChange={(e) => update("role", e.target.value as Role)}
                      className="w-full h-9 pl-3 pr-8 text-[13px] border border-gray-200 rounded-md bg-gray-50 outline-none transition focus:border-[#027D3F] focus:bg-white focus:ring-1 focus:ring-[#027D3F] appearance-none font-medium text-gray-700 cursor-pointer"
                    >
                      <option value="engineer">Engineer</option>
                      <option value="manager">Manager</option>
                      <option value="admin">Admin</option>
                      <option value="visitor">Visitor</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                      <svg className="fill-current h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                    </div>
                  </div>
                </div>
              </div>
              <Field label="Set password *" value={form.password} onChange={(v) => update("password", v)} placeholder="Min 8 characters" type="password" />
            </div>

            <div className="flex flex-col gap-3 pt-4 border-t border-gray-100">
               <div className="flex items-center justify-between">
                 <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Report Year Access</h4>
                 {form.allowed_years.length > 0 && !isAllYears && (
                   <span className="text-[11px] font-semibold text-[#027D3F]">{form.allowed_years.length} Selected</span>
                 )}
               </div>
               
               <label className="flex items-center gap-3 p-2.5 rounded-md border border-[#027D3F]/20 bg-[#F4FAF6] cursor-pointer">
                <input
                  type="checkbox"
                  checked={isAllYears}
                  onChange={handleToggleAllYears}
                  className="w-4 h-4 rounded text-[#027D3F] border-[#027D3F]/30 focus:ring-[#027D3F]"
                />
                <div>
                  <span className="text-[13px] font-semibold text-[#027D3F]">All Years</span>
                </div>
              </label>

              <div className={`grid grid-cols-3 gap-2 transition-opacity ${isAllYears ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
                {ALL_YEARS.map((fy) => (
                  <label
                    key={fy}
                    className="flex items-center gap-2 p-2 rounded-md border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={form.allowed_years.includes(fy)}
                      onChange={() => handleToggleYear(fy)}
                      className="w-3.5 h-3.5 rounded text-[#027D3F] border-gray-300 focus:ring-[#027D3F]"
                    />
                    <span className="text-[12px] font-medium text-gray-700">{fy}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="mt-2 flex flex-col gap-3">
               {status === "error" && <div className="p-2.5 bg-[#FDECEC] border border-[#F5B9B9] rounded-md text-[12px] text-[#A32D2D] font-medium">{errorMsg}</div>}
              
              <div className="flex gap-2">
                <button
                  onClick={onClose}
                  className="flex-1 h-9 rounded-md border border-gray-200 text-gray-700 font-medium text-[13px] hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={createUser.isPending}
                  className="flex-[2] h-9 rounded-md bg-[#027D3F] hover:bg-[#02612f] text-white font-semibold text-[13px] flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
                >
                  {createUser.isPending ? <FiLoader size={14} className="animate-spin" /> : <FiUserPlus size={14} />}
                  Create User
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      <style jsx global>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}

function Field({
  label, value, onChange, placeholder, type = "text",
}: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-9 px-3 text-[13px] border border-gray-200 rounded-md bg-gray-50 outline-none transition-all duration-200 focus:border-[#027D3F] focus:bg-white focus:ring-4 focus:ring-[#027D3F]/10 hover:border-gray-300"
      />
    </div>
  )
}

export function UserTable({
  users,
  onSetPassword,
  onEditYears,
}: {
  users: Engineer[]
  onSetPassword: (u: Engineer) => void
  onEditYears: (u: Engineer) => void
}) {
  if (users.length === 0) {
    return (
      <div className="py-12 text-center text-[13px] text-gray-400 bg-white border border-gray-200 rounded-lg">
        No users match your filters.
      </div>
    )
  }

  return (
    <>
      {/* Desktop Table */}
      <div className="hidden md:block bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                <th className="px-4 py-3 font-bold">User</th>
                <th className="px-4 py-3 font-bold">Designation & Contact</th>
                <th className="px-4 py-3 font-bold">Role</th>
                <th className="px-4 py-3 font-bold">Year Access</th>
                <th className="px-4 py-3 text-right font-bold w-[60px]"></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <UserRow
                  key={u.id}
                  user={u}
                  onSetPassword={() => onSetPassword(u)}
                  onEditYears={() => onEditYears(u)}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile List */}
      <div className="md:hidden flex flex-col gap-3">
        {users.map((u) => (
          <MobileUserCard
            key={u.id}
            user={u}
            onSetPassword={() => onSetPassword(u)}
            onEditYears={() => onEditYears(u)}
          />
        ))}
      </div>
    </>
  )
}

function UserRow({
  user,
  onSetPassword,
  onEditYears,
}: {
  user: Engineer
  onSetPassword: () => void
  onEditYears: () => void
}) {
  const updateRole = useUpdateRole()
  const deleteUser = useDeleteUser()
  const [showMenu, setShowMenu] = useState(false)
  
  const initials = user.name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()

  return (
    <tr className="border-b border-gray-100 last:border-0 hover:bg-[#F9FAFB] transition-colors group">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 border border-gray-200 text-gray-700 font-bold flex items-center justify-center shrink-0 text-xs shadow-inner">
            {initials}
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-[13px]">{user.name}</p>
            <p className="text-[11px] text-gray-500 mt-0.5 tracking-tight">
              {user.email || "No email"} <span className="mx-1 text-gray-300">•</span> <span className="font-mono">{user.emp_id}</span>
            </p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
         <p className="text-[12px] text-gray-700 font-medium">{user.designation || "—"}</p>
         <p className="text-[11px] text-gray-500 mt-0.5 font-mono tracking-tight">{user.mobile_number || "—"}</p>
      </td>
      <td className="px-4 py-3">
        <div className="relative inline-block w-[100px]">
          <select
            value={user.role}
            onChange={(e) => updateRole.mutate({ id: user.id, role: e.target.value as Role })}
            disabled={updateRole.isPending}
            className={`appearance-none text-[10px] uppercase tracking-widest font-bold rounded pl-2.5 pr-6 py-1.5 w-full outline-none cursor-pointer transition disabled:opacity-50 ${ROLE_STYLES[user.role].bg} ${ROLE_STYLES[user.role].text}`}
          >
            <option value="admin">Admin</option>
            <option value="manager">Manager</option>
            <option value="engineer">Engineer</option>
            <option value="visitor">Visitor</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center">
            <svg className={`fill-current h-2.5 w-2.5 ${ROLE_STYLES[user.role].text}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <YearAccessDisplay years={user.allowed_years} onManage={onEditYears} />
      </td>
      <td className="px-4 py-3 text-right relative">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="p-1.5 text-gray-400 hover:text-gray-900 rounded hover:bg-gray-200 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
          aria-label="Actions"
        >
          <FiMoreVertical size={16} />
        </button>
        
        {showMenu && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
            <div className="absolute right-6 top-8 w-44 bg-white border border-gray-200 rounded-md z-20 py-1 text-left opacity-0 animate-[fadeInUp_0.1s_ease-out_both]">
              <button
                onClick={() => { setShowMenu(false); onSetPassword() }}
                className="w-full text-left px-4 py-2 text-[12px] font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <FiKey size={13} className="text-gray-400" /> Reset Password
              </button>
              <div className="h-px bg-gray-100 my-1" />
              <button
                onClick={() => { 
                  if (confirm("Delete User? This action cannot be undone.")) {
                    deleteUser.mutate(user.id);
                  }
                  setShowMenu(false);
                }}
                className="w-full text-left px-4 py-2 text-[12px] font-medium text-[#D81F26] hover:bg-red-50 flex items-center gap-2"
              >
                <FiTrash2 size={13} /> Delete User
              </button>
            </div>
          </>
        )}
      </td>
    </tr>
  )
}

function MobileUserCard({
  user,
  onSetPassword,
  onEditYears,
}: {
  user: Engineer
  onSetPassword: () => void
  onEditYears: () => void
}) {
  const updateRole = useUpdateRole()
  const deleteUser = useDeleteUser()
  const [showMenu, setShowMenu] = useState(false)
  
  const initials = user.name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 relative">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded bg-white border border-gray-200 text-gray-600 font-bold flex items-center justify-center shrink-0 text-[13px]">
            {initials}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-[14px] leading-tight">{user.name}</h3>
            <p className="text-[12px] text-gray-500 mt-0.5">{user.email || "No email"}</p>
            <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-gray-500">
              <span className="font-mono">{user.emp_id}</span>
              <span className="text-gray-300">•</span>
              <span>{user.designation || "No Designation"}</span>
            </div>
          </div>
        </div>
        
        <div className="relative">
          <button 
            onClick={() => setShowMenu(!showMenu)} 
            className="p-1.5 -m-1.5 text-gray-400 hover:text-gray-900 rounded-md hover:bg-gray-100"
          >
            <FiMoreVertical size={16} />
          </button>
          
          {showMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 mt-1 w-44 bg-white border border-gray-200 rounded-md z-20 py-1 overflow-hidden opacity-0 animate-[fadeInUp_0.1s_ease-out_both]">
                <button
                  onClick={() => { setShowMenu(false); onSetPassword() }}
                  className="w-full text-left px-4 py-2 text-[13px] font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <FiKey size={14} className="text-gray-400" /> Set Password
                </button>
                <div className="h-px bg-gray-100 my-1" />
                <button
                  onClick={() => { 
                    if (confirm("Delete User? This action cannot be undone.")) {
                      deleteUser.mutate(user.id);
                    }
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 text-[13px] font-medium text-[#D81F26] hover:bg-red-50 flex items-center gap-2"
                >
                  <FiTrash2 size={14} /> Delete User
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
        <div className="relative">
          <select
            value={user.role}
            onChange={(e) => updateRole.mutate({ id: user.id, role: e.target.value as Role })}
            disabled={updateRole.isPending}
            className={`appearance-none text-[10px] uppercase tracking-widest font-bold rounded pl-2.5 pr-6 py-1.5 outline-none cursor-pointer disabled:opacity-50 ${ROLE_STYLES[user.role].bg} ${ROLE_STYLES[user.role].text}`}
          >
            <option value="admin">Admin</option>
            <option value="manager">Manager</option>
            <option value="engineer">Engineer</option>
            <option value="visitor">Visitor</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center">
             <svg className={`fill-current h-2.5 w-2.5 ${ROLE_STYLES[user.role].text}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
          </div>
        </div>

        <YearAccessDisplay years={user.allowed_years} onManage={onEditYears} />
      </div>
    </div>
  )
}
