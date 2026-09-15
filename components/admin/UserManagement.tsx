"use client"

import { useState, useMemo } from "react"
import { FiSearch, FiMoreVertical, FiEdit2, FiKey, FiTrash2, FiX, FiCheck, FiLoader, FiUserPlus, FiFilter } from "react-icons/fi"
import { Engineer, Role, useUpdateRole, useDeleteUser, useUpdateAllowedYears, useCreateUser, useSetUserPassword } from "./hooks"

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
  onAddUser 
}: { 
  users: Engineer[], 
  onAddUser: () => void 
}) {
  const counts = useMemo(() => {
    const base = { total: users.length, admin: 0, manager: 0, engineer: 0, visitor: 0 }
    users.forEach((u) => { base[u.role] += 1 })
    return base
  }, [users])

  return (
    <div className="flex flex-col gap-4 mb-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">User Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage users, roles, and report-year access.</p>
        </div>
        <button
          onClick={onAddUser}
          className="h-9 px-4 rounded-lg bg-[#027D3F] hover:bg-[#02612f] text-white text-sm font-semibold flex items-center gap-2 transition-colors shadow-sm"
        >
          <FiUserPlus size={16} /> Add User
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <SummaryBadge label="Total" count={counts.total} />
        <SummaryBadge label="Admins" count={counts.admin} colorClass="text-[#3B6D11]" />
        <SummaryBadge label="Managers" count={counts.manager} colorClass="text-[#854F0B]" />
        <SummaryBadge label="Engineers" count={counts.engineer} colorClass="text-[#185FA5]" />
        <SummaryBadge label="Visitors" count={counts.visitor} colorClass="text-[#4B5563]" />
      </div>
    </div>
  )
}

function SummaryBadge({ label, count, colorClass = "text-gray-900" }: { label: string, count: number, colorClass?: string }) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 bg-white shadow-sm text-sm cursor-default hover:bg-gray-50 transition-colors">
      <span className="text-gray-500 font-medium">{label}</span>
      <span className={`font-bold ${colorClass}`}>{count}</span>
    </div>
  )
}

export function UserFilters({ 
  search, 
  setSearch, 
  roleFilter, 
  setRoleFilter 
}: { 
  search: string, 
  setSearch: (s: string) => void,
  roleFilter: string,
  setRoleFilter: (r: string) => void
}) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-4">
      <div className="relative flex-1 max-w-md">
        <FiSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          placeholder="Search name, ID, email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-10 pl-9 pr-4 text-sm border border-gray-200 rounded-lg bg-white outline-none transition focus:border-[#027D3F] focus:ring-1 focus:ring-[#027D3F]"
        />
      </div>
      <div className="relative">
        <FiFilter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="h-10 pl-9 pr-8 text-sm border border-gray-200 rounded-lg bg-white outline-none transition focus:border-[#027D3F] focus:ring-1 focus:ring-[#027D3F] appearance-none font-medium text-gray-700 cursor-pointer"
        >
          <option value="all">All Roles</option>
          <option value="admin">Admin</option>
          <option value="manager">Manager</option>
          <option value="engineer">Engineer</option>
          <option value="visitor">Visitor</option>
        </select>
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
  
  if (!years || years.length === 0) {
    display = "All Years"
  } else if (years.length === 1) {
    display = years[0]
  } else if (years.length === 2) {
    display = years.join(" · ")
  } else {
    display = `${years.length} Years`
  }

  const isAllYears = !years || years.length === 0
  const isNoAccess = false // Leaving it false for now as empty means all years.

  return (
    <div className="flex items-center justify-between gap-2 group">
      <span className={`text-[13px] font-medium ${isAllYears ? "text-gray-900" : "text-gray-700"}`}>
        {display}
      </span>
      <button
        onClick={onManage}
        className="text-xs font-semibold text-[#027D3F] opacity-0 group-hover:opacity-100 transition-opacity hover:underline px-2 py-1 rounded hover:bg-[#E8F5EE]"
      >
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
  
  const initialAllYears = !user.allowed_years || user.allowed_years.length === 0
  const [isAllYears, setIsAllYears] = useState(initialAllYears)
  const [selected, setSelected] = useState<Set<string>>(new Set(user.allowed_years || []))

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
    const yearsToSave = isAllYears ? [] : Array.from(selected)
    updateYears.mutate(
      { id: user.id, allowed_years: yearsToSave },
      { onSuccess: onClose }
    )
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-xl p-5 max-w-sm w-full shadow-xl w-full max-h-[90vh] flex flex-col animate-[fadeInUp_0.2s_ease-out_both]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 text-lg">Report Year Access</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <FiX size={20} />
          </button>
        </div>
        
        <div className="mb-5 bg-gray-50 rounded-lg p-3 border border-gray-100 flex items-center gap-3">
           <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-600 font-bold text-sm shrink-0">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-gray-900 text-sm">{user.name}</p>
            <p className="text-xs text-gray-500 capitalize">{user.role}</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto mb-4 px-1">
          <label className="flex items-center gap-3 p-3 rounded-lg border border-[#027D3F]/20 bg-[#F4FAF6] cursor-pointer mb-3">
            <input
              type="checkbox"
              checked={isAllYears}
              onChange={handleToggleAllYears}
              className="w-4 h-4 rounded text-[#027D3F] border-[#027D3F]/30 focus:ring-[#027D3F]"
            />
            <div>
              <span className="text-sm font-semibold text-[#027D3F]">All Years</span>
              <p className="text-xs text-[#027D3F]/70 mt-0.5">Allows viewing reports from every reporting year.</p>
            </div>
          </label>

          {!isAllYears && (
            <div className="flex items-center justify-between mb-2 px-1 animate-[fadeIn_0.2s_ease-out]">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Individual Years</span>
              <div className="flex gap-2 text-xs">
                <button onClick={handleSelectAll} className="text-[#027D3F] hover:underline font-medium">Select all</button>
                <span className="text-gray-300">|</span>
                <button onClick={handleDeselectAll} className="text-gray-500 hover:underline">Clear</button>
              </div>
            </div>
          )}

          <div className={`flex flex-col gap-1.5 transition-opacity ${isAllYears ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
            {ALL_YEARS.map((fy) => (
              <label
                key={fy}
                className="flex items-center gap-3 p-2.5 rounded-lg border border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selected.has(fy)}
                  onChange={() => handleToggleYear(fy)}
                  className="w-4 h-4 rounded text-[#027D3F] border-gray-300 focus:ring-[#027D3F]"
                />
                <span className="text-sm font-medium text-gray-700">{fy}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-3 border-t border-gray-100 mt-auto">
          <button
            onClick={onClose}
            className="flex-1 h-10 rounded-lg border border-gray-200 text-gray-700 font-medium text-sm hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={updateYears.isPending}
            className="flex-1 h-10 rounded-lg bg-[#027D3F] hover:bg-[#02612f] text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
          >
            {updateYears.isPending ? <FiLoader size={16} className="animate-spin" /> : "Save Changes"}
          </button>
        </div>
      </div>
      <style jsx global>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
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
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 max-w-[600px] w-full max-h-[90vh] overflow-y-auto animate-[fadeInUp_0.2s_ease-out_both] shadow-2xl">
        <div className="flex items-start justify-between mb-1">
          <div className="flex items-center gap-2">
            <FiUserPlus size={18} className="text-[#027D3F]" />
            <h3 className="font-semibold text-gray-900 text-lg">Add New User</h3>
          </div>
          <button onClick={onClose} aria-label="Close" className="text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 p-1.5 rounded-full transition-colors">
            <FiX size={18} />
          </button>
        </div>
        <p className="text-sm text-gray-500 mb-6">Create a login account and an engineer record.</p>

        {status === "success" ? (
          <div className="flex flex-col items-center text-center gap-3 py-10">
            <div className="w-16 h-16 rounded-full bg-[#E8F5EE] flex items-center justify-center mb-2">
              <FiCheck size={28} className="text-[#027D3F]" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900">User Created</h4>
            <p className="text-sm text-gray-600 max-w-sm">{form.name} can now log in with the User ID and password you set.</p>
            <button onClick={onClose} className="mt-4 h-10 px-6 rounded-lg bg-[#027D3F] text-white font-medium hover:bg-[#02612f] transition-colors">
              Done
            </button>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row gap-8">
            <div className="flex-1 flex flex-col gap-4">
              <h4 className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-2">User Details</h4>
              <Field label="Full name *" value={form.name} onChange={(v) => update("name", v)} placeholder="e.g. Ramesh Kumar" />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Employee ID *" value={form.emp_id} onChange={(v) => update("emp_id", v)} placeholder="e.g. SI 0030" />
                <Field label="Designation" value={form.designation} onChange={(v) => update("designation", v)} placeholder="e.g. Site Engineer" />
              </div>
              <Field label="Email (optional)" value={form.email} onChange={(v) => update("email", v)} placeholder="name@email.com" type="email" />
              <Field label="Mobile (optional)" value={form.mobile_number} onChange={(v) => update("mobile_number", v)} placeholder="10-digit number" />
              
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Role *</label>
                <div className="relative">
                  <select
                    value={form.role}
                    onChange={(e) => update("role", e.target.value as Role)}
                    className="w-full h-10 pl-3 pr-8 text-sm border border-gray-200 rounded-lg bg-gray-50 outline-none transition focus:border-[#027D3F] focus:bg-white focus:ring-1 focus:ring-[#027D3F] appearance-none font-medium text-gray-700 cursor-pointer"
                  >
                    <option value="engineer">Engineer</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                    <option value="visitor">Visitor</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                  </div>
                </div>
              </div>

              <Field label="Set password *" value={form.password} onChange={(v) => update("password", v)} placeholder="Min 8 characters" type="password" />
            </div>

            <div className="flex-1 flex flex-col gap-4">
               <h4 className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-2">Year Access</h4>
               
               <label className="flex items-center gap-3 p-3 rounded-lg border border-[#027D3F]/20 bg-[#F4FAF6] cursor-pointer">
                <input
                  type="checkbox"
                  checked={isAllYears}
                  onChange={handleToggleAllYears}
                  className="w-4 h-4 rounded text-[#027D3F] border-[#027D3F]/30 focus:ring-[#027D3F]"
                />
                <div>
                  <span className="text-sm font-semibold text-[#027D3F]">All Years</span>
                  <p className="text-xs text-[#027D3F]/70 mt-0.5">Allows viewing reports from every year.</p>
                </div>
              </label>

              <div className={`flex flex-col gap-2 transition-opacity ${isAllYears ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Or Individual Years</span>
                <div className="grid grid-cols-2 gap-2">
                  {ALL_YEARS.map((fy) => (
                    <label
                      key={fy}
                      className="flex items-center gap-2.5 p-2 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={form.allowed_years.includes(fy)}
                        onChange={() => handleToggleYear(fy)}
                        className="w-4 h-4 rounded text-[#027D3F] border-gray-300 focus:ring-[#027D3F]"
                      />
                      <span className="text-sm font-medium text-gray-700">{fy}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="mt-auto pt-6 flex flex-col gap-3">
                 {status === "error" && <div className="p-3 bg-[#FDECEC] border border-[#F5B9B9] rounded-lg text-sm text-[#A32D2D] font-medium">{errorMsg}</div>}
                
                <div className="flex gap-3">
                  <button
                    onClick={onClose}
                    className="flex-1 h-11 rounded-lg border border-gray-200 text-gray-700 font-medium text-sm hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={createUser.isPending}
                    className="flex-[2] h-11 rounded-lg bg-[#027D3F] hover:bg-[#02612f] text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-60 shadow-sm"
                  >
                    {createUser.isPending ? <FiLoader size={15} className="animate-spin" /> : <FiUserPlus size={15} />}
                    Create User
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function Field({
  label, value, onChange, placeholder, type = "text",
}: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-10 px-3 text-sm border border-gray-200 rounded-lg bg-gray-50 outline-none transition focus:border-[#027D3F] focus:bg-white focus:ring-1 focus:ring-[#027D3F]"
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
      <div className="py-16 text-center text-sm text-gray-400 bg-white border border-gray-200 rounded-xl">
        No users match your filters.
      </div>
    )
  }

  return (
    <>
      {/* Desktop Table */}
      <div className="hidden md:block bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/50 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                <th className="px-5 py-3">User</th>
                <th className="px-5 py-3">Designation</th>
                <th className="px-5 py-3">Role</th>
                <th className="px-5 py-3">Year Access</th>
                <th className="px-5 py-3">Contact</th>
                <th className="px-5 py-3 text-right">Actions</th>
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
  const [confirmDelete, setConfirmDelete] = useState(false)
  const initials = user.name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()

  function handleRoleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    updateRole.mutate({ id: user.id, role: e.target.value as Role })
  }

  return (
    <tr className="border-b border-gray-100 last:border-0 hover:bg-[#F9FAFB] transition-colors group">
      <td className="px-5 py-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-white border border-gray-200 text-gray-600 font-bold flex items-center justify-center shrink-0 shadow-sm text-xs">
            {initials}
          </div>
          <div>
            <p className="font-medium text-gray-900 leading-tight">{user.name}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <p className="text-[11px] text-gray-500">{user.email ?? "No email"}</p>
              <span className="text-gray-300">•</span>
              <p className="text-[11px] font-mono text-gray-500 bg-gray-100 px-1 py-0.5 rounded">{user.emp_id}</p>
            </div>
          </div>
        </div>
      </td>
      <td className="px-5 py-3 text-[13px] text-gray-600">{user.designation || "—"}</td>
      <td className="px-5 py-3">
        <div className="relative inline-block w-[110px]">
          <select
            value={user.role}
            onChange={handleRoleChange}
            disabled={updateRole.isPending}
            className={`appearance-none text-[11px] uppercase tracking-wider font-bold rounded-md pl-2.5 pr-6 py-1.5 w-full outline-none cursor-pointer transition disabled:opacity-50 ${ROLE_STYLES[user.role].bg} ${ROLE_STYLES[user.role].text}`}
          >
            <option value="admin">Admin</option>
            <option value="manager">Manager</option>
            <option value="engineer">Engineer</option>
            <option value="visitor">Visitor</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center">
            <svg className={`fill-current h-3 w-3 ${ROLE_STYLES[user.role].text}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
          </div>
        </div>
      </td>
      <td className="px-5 py-3">
        <YearAccessDisplay years={user.allowed_years} onManage={onEditYears} />
      </td>
      <td className="px-5 py-3 text-[13px] text-gray-600 font-mono tracking-tight">{user.mobile_number || "—"}</td>
      <td className="px-5 py-3 text-right">
        {confirmDelete ? (
          <div className="flex items-center justify-end gap-2">
            <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Sure?</span>
            <button
              onClick={() => deleteUser.mutate(user.id, { onSuccess: () => setConfirmDelete(false) })}
              disabled={deleteUser.isPending}
              className="w-7 h-7 flex items-center justify-center rounded bg-[#D81F26] text-white hover:bg-[#b0171d] disabled:opacity-50 transition-colors shadow-sm"
              title="Confirm Delete"
            >
              {deleteUser.isPending ? <FiLoader size={12} className="animate-spin" /> : <FiCheck size={14} />}
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="w-7 h-7 flex items-center justify-center rounded bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
              title="Cancel"
            >
              <FiX size={14} />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={onSetPassword}
              className="p-1.5 rounded text-gray-400 hover:text-[#027D3F] hover:bg-[#F4FAF6] transition-colors"
              title="Set Password"
            >
              <FiKey size={14} />
            </button>
            <button
              onClick={() => setConfirmDelete(true)}
              className="p-1.5 rounded text-gray-400 hover:text-[#D81F26] hover:bg-[#FDECEC] transition-colors"
              title="Delete User"
            >
              <FiTrash2 size={14} />
            </button>
          </div>
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
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [showMenu, setShowMenu] = useState(false)

  const initials = user.name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm relative">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white border border-gray-200 text-gray-600 font-bold flex items-center justify-center shrink-0 shadow-sm text-sm">
            {initials}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 leading-tight">{user.name}</h3>
            <p className="text-[12px] text-gray-500">{user.email ?? "No email"}</p>
          </div>
        </div>
        
        <div className="relative">
          <button 
            onClick={() => setShowMenu(!showMenu)} 
            className="p-1.5 -m-1.5 text-gray-400 hover:text-gray-900 rounded-lg hover:bg-gray-50"
          >
            <FiMoreVertical size={18} />
          </button>
          
          {showMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 mt-1 w-40 bg-white border border-gray-100 rounded-lg shadow-xl z-20 py-1 overflow-hidden animate-[fadeInUp_0.1s_ease-out_both]">
                <button
                  onClick={() => { setShowMenu(false); onSetPassword() }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <FiKey size={14} className="text-gray-400" /> Set Password
                </button>
                <div className="h-px bg-gray-100 my-1" />
                {confirmDelete ? (
                  <div className="px-4 py-2 flex items-center justify-between bg-red-50">
                    <span className="text-xs text-[#D81F26] font-medium">Sure?</span>
                    <div className="flex gap-1">
                      <button onClick={() => { deleteUser.mutate(user.id); setShowMenu(false) }} className="p-1 bg-[#D81F26] text-white rounded"><FiCheck size={12} /></button>
                      <button onClick={() => setConfirmDelete(false)} className="p-1 bg-white text-gray-500 border border-gray-200 rounded"><FiX size={12} /></button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDelete(true)}
                    className="w-full text-left px-4 py-2 text-sm text-[#D81F26] hover:bg-red-50 flex items-center gap-2"
                  >
                    <FiTrash2 size={14} /> Delete User
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-1.5 mb-4 pl-[52px]">
        <div className="flex items-center gap-2 text-[12px] text-gray-500">
          <span className="font-mono bg-gray-100 px-1 py-0.5 rounded">{user.emp_id}</span>
          <span>•</span>
          <span>{user.designation || "No Designation"}</span>
        </div>
        <div className="text-[12px] text-gray-500">
           {user.mobile_number || "No mobile number"}
        </div>
      </div>

      <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
        <div className="relative">
          <select
            value={user.role}
            onChange={(e) => updateRole.mutate({ id: user.id, role: e.target.value as Role })}
            disabled={updateRole.isPending}
            className={`appearance-none text-[10px] uppercase tracking-wider font-bold rounded pl-2 pr-5 py-1 outline-none cursor-pointer disabled:opacity-50 ${ROLE_STYLES[user.role].bg} ${ROLE_STYLES[user.role].text}`}
          >
            <option value="admin">Admin</option>
            <option value="manager">Manager</option>
            <option value="engineer">Engineer</option>
            <option value="visitor">Visitor</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-1.5 flex items-center">
             <svg className={`fill-current h-2.5 w-2.5 ${ROLE_STYLES[user.role].text}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
          </div>
        </div>

        <button
          onClick={onEditYears}
          className="flex items-center gap-1.5 text-xs font-semibold text-[#027D3F] bg-[#F4FAF6] hover:bg-[#E8F5EE] px-2.5 py-1 rounded transition-colors"
        >
          {(!user.allowed_years || user.allowed_years.length === 0) ? "All Years" : 
           user.allowed_years.length === 1 ? user.allowed_years[0] : 
           `${user.allowed_years.length} Years`}
          <span className="opacity-70 ml-1">Manage →</span>
        </button>
      </div>
    </div>
  )
}

