"use client"
import ActiveSessionsCard from "@/components/admin/ActiveSessionsCard"

import { useMemo, useState } from "react"
import {
  FiUsers, FiShield, FiKey, FiSearch,
  FiCheck, FiLoader, FiAlertTriangle, FiX, FiArrowRight,
} from "react-icons/fi"
import {
  useCurrentRole, useAllUsers, useUpdateRole,
  useSetUserPassword, type Role, type Engineer,
} from "@/components/admin/hooks"
import Link from "next/link"

const ROLE_STYLES: Record<Role, string> = {
  admin: "bg-[#EAF3DE] text-[#3B6D11]",
  manager: "bg-[#FAEEDA] text-[#854F0B]",
  engineer: "bg-[#E6F1FB] text-[#185FA5]",
}

export default function AdminPage() {
  const { data: currentRole, isLoading: roleLoading } = useCurrentRole()
  const isAdmin = currentRole?.role === "admin"

  if (roleLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh] text-gray-400">
        <FiLoader size={20} className="animate-spin mr-2" /> Checking access…
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-3 text-center px-6">
        <div className="w-12 h-12 rounded-2xl bg-[#FCEBEB] flex items-center justify-center">
          <FiAlertTriangle size={22} className="text-[#A32D2D]" />
        </div>
        <h2 className="text-lg font-bold text-gray-900">Access restricted</h2>
        <p className="text-sm text-gray-500 max-w-sm">
          This page is only available to admins. Contact your system administrator if you need access.
        </p>
      </div>
    )
  }

  return <AdminDashboard />
}

function AdminDashboard() {
  const { data: users, isLoading } = useAllUsers()
  const [search, setSearch] = useState("")
  const [passwordTarget, setPasswordTarget] = useState<Engineer | null>(null)

  const filtered = useMemo(() => {
    if (!users) return []
    const q = search.trim().toLowerCase()
    if (!q) return users
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.emp_id.toLowerCase().includes(q) ||
        u.designation.toLowerCase().includes(q) ||
        (u.email ?? "").toLowerCase().includes(q)
    )
  }, [users, search])

  const counts = useMemo(() => {
    const base = { total: users?.length ?? 0, admin: 0, manager: 0, engineer: 0 }
    users?.forEach((u) => { base[u.role] += 1 })
    return base
  }, [users])

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 flex flex-col gap-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage access roles and account recovery for all engineers.</p>
        </div>
        <Link
          href="/dashboard/settings"
          className="text-sm font-medium text-[#027D3F] hover:underline flex items-center gap-1"
        >
          Manage your own password in Settings <FiArrowRight size={13} />
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatTile label="Total Users" value={counts.total} icon={<FiUsers size={16} />} />
        <StatTile label="Admins" value={counts.admin} icon={<FiShield size={16} />} />
        <StatTile label="Managers" value={counts.manager} icon={<FiShield size={16} />} />
        <StatTile label="Engineers" value={counts.engineer} icon={<FiShield size={16} />} />
      </div>

      <div className="relative max-w-sm">
        <FiSearch size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          placeholder="Search name, emp ID, email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-10 pl-10 pr-4 text-sm border border-gray-200 rounded-xl bg-white outline-none transition focus:border-[#027D3F] focus:ring-2 focus:ring-[#027D3F]/15"
        />
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-gray-400">
            <FiLoader size={18} className="animate-spin mr-2" /> Loading users…
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-sm text-gray-400">No users match your search.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs font-semibold text-gray-400 uppercase tracking-widest">
                  <th className="px-5 py-3">User</th>
                  <th className="px-5 py-3">Emp ID</th>
                  <th className="px-5 py-3">Designation</th>
                  <th className="px-5 py-3">Contact</th>
                  <th className="px-5 py-3">Role</th>
                  <th className="px-5 py-3">Password</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <UserRow key={u.id} user={u} onSetPassword={() => setPasswordTarget(u)} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {passwordTarget && (
        <SetPasswordModal user={passwordTarget} onClose={() => setPasswordTarget(null)} />
      )}

      <ActiveSessionsCard/>
    </div>
  )
}

function StatTile({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="bg-[#FEF3EA] border border-[#F8DDC0] rounded-2xl p-4 flex items-center justify-between">
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
      </div>
      <div className="w-9 h-9 rounded-xl bg-[#EF9447]/15 flex items-center justify-center text-[#EF9447]">
        {icon}
      </div>
    </div>
  )
}

function UserRow({ user, onSetPassword }: { user: Engineer; onSetPassword: () => void }) {
  const updateRole = useUpdateRole()
  const initials = user.name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()

  function handleRoleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    updateRole.mutate({ id: user.id, role: e.target.value as Role })
  }

  return (
    <tr className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60 transition-colors">
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#E8F5EE] text-[#027D3F] text-xs font-bold flex items-center justify-center shrink-0">
            {initials}
          </div>
          <div>
            <p className="font-medium text-gray-900">{user.name}</p>
            <p className="text-xs text-gray-400">{user.email ?? "No email on file"}</p>
          </div>
        </div>
      </td>
      <td className="px-5 py-3.5 text-gray-600">{user.emp_id}</td>
      <td className="px-5 py-3.5 text-gray-600">{user.designation}</td>
      <td className="px-5 py-3.5 text-gray-600">{user.mobile_number ?? "—"}</td>
      <td className="px-5 py-3.5">
        <select
          value={user.role}
          onChange={handleRoleChange}
          disabled={updateRole.isPending}
          className={`appearance-none text-xs font-semibold rounded-full pl-3 pr-7 py-1.5 outline-none cursor-pointer transition disabled:opacity-50 ${ROLE_STYLES[user.role]}`}
        >
          <option value="admin">Admin</option>
          <option value="manager">Manager</option>
          <option value="engineer">Engineer</option>
        </select>
      </td>
      <td className="px-5 py-3.5">
        <button
          onClick={onSetPassword}
          className="text-xs font-medium text-[#027D3F] hover:underline flex items-center gap-1.5"
        >
          <FiKey size={13} /> Set password
        </button>
      </td>
    </tr>
  )
}

function SetPasswordModal({ user, onClose }: { user: Engineer; onClose: () => void }) {
  const setPassword = useSetUserPassword()
  const [newPassword, setNewPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [status, setStatus] = useState<"idle" | "success" | "error" | "mismatch">("idle")
  const [errorMsg, setErrorMsg] = useState("")

  function handleSubmit() {
    setStatus("idle")
    if (newPassword.length < 8) {
      setStatus("error")
      setErrorMsg("Password must be at least 8 characters.")
      return
    }
    if (newPassword !== confirm) {
      setStatus("mismatch")
      return
    }
    setPassword.mutate(
      { userId: user.id, newPassword },
      {
        onSuccess: () => setStatus("success"),
        onError: (err) => {
          setStatus("error")
          setErrorMsg(err instanceof Error ? err.message : "Failed to update password.")
        },
      }
    )
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full animate-[fadeInUp_0.2s_ease-out_both]">
        <div className="flex items-start justify-between mb-1">
          <div className="flex items-center gap-2">
            <FiKey size={15} className="text-[#027D3F]" />
            <h3 className="font-semibold text-gray-900">Set password</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <FiX size={18} />
          </button>
        </div>
        <p className="text-xs text-gray-400 mb-4">
          For <span className="font-medium text-gray-600">{user.name}</span> ({user.email})
        </p>

        {status === "success" ? (
          <div className="flex flex-col items-center text-center gap-3 py-4">
            <div className="w-12 h-12 rounded-full bg-[#E8F5EE] flex items-center justify-center">
              <FiCheck size={22} className="text-[#027D3F]" />
            </div>
            <p className="text-sm text-gray-600">Password updated for {user.name}.</p>
            <button
              onClick={onClose}
              className="mt-1 text-sm font-semibold text-[#027D3F] hover:underline"
            >
              Done
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <input
              type="password"
              placeholder="New password (min 8 characters)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoFocus
              className="w-full h-11 px-4 text-sm border border-gray-200 rounded-xl bg-gray-50 outline-none transition focus:border-[#027D3F] focus:bg-white focus:ring-2 focus:ring-[#027D3F]/15"
            />
            <input
              type="password"
              placeholder="Confirm new password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full h-11 px-4 text-sm border border-gray-200 rounded-xl bg-gray-50 outline-none transition focus:border-[#027D3F] focus:bg-white focus:ring-2 focus:ring-[#027D3F]/15"
            />

            {status === "mismatch" && <p className="text-xs text-[#A32D2D]">Passwords don't match.</p>}
            {status === "error" && <p className="text-xs text-[#A32D2D]">{errorMsg}</p>}

            <div className="flex gap-2 mt-1">
              <button
                onClick={onClose}
                className="flex-1 h-11 rounded-xl border border-gray-200 text-gray-600 font-medium text-sm hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={setPassword.isPending}
                className="flex-1 h-11 rounded-xl bg-[#027D3F] hover:bg-[#02612f] text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
              >
                {setPassword.isPending ? <FiLoader size={15} className="animate-spin" /> : <FiCheck size={15} />}
                Set Password
              </button>
            </div>
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}