"use client"

import { useState } from "react"
import { FiUserPlus, FiX, FiCheck, FiLoader } from "react-icons/fi"
import { useCreateUser, type Role } from "@/components/admin/hooks"

export default function CreateUserModal({ onClose }: { onClose: () => void }) {
  const createUser = useCreateUser()

  const [form, setForm] = useState({
    name: "",
    emp_id: "",
    designation: "",
    email: "",
    mobile_number: "",
    password: "",
    role: "engineer" as Role,
  })
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle")
  const [errorMsg, setErrorMsg] = useState("")

  function update<K extends keyof typeof form>(key: K, value: typeof form[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function handleSubmit() {
    setStatus("idle")
    if (!form.name.trim() || !form.emp_id.trim() || !form.email.trim() || !form.password) {
      setStatus("error")
      setErrorMsg("Name, Employee ID, Email and Password are required.")
      return
    }
    if (form.password.length < 8) {
      setStatus("error")
      setErrorMsg("Password must be at least 8 characters.")
      return
    }

    createUser.mutate(form, {
      onSuccess: () => setStatus("success"),
      onError: (err) => {
        setStatus("error")
        setErrorMsg(err instanceof Error ? err.message : "Failed to create user.")
      },
    })
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between mb-1">
          <div className="flex items-center gap-2">
            <FiUserPlus size={15} className="text-[#027D3F]" />
            <h3 className="font-semibold text-gray-900">Add new user</h3>
          </div>
          <button onClick={onClose} aria-label="Close" className="text-gray-400 hover:text-gray-600">
            <FiX size={18} />
          </button>
        </div>
        <p className="text-xs text-gray-400 mb-4">Creates a login account and an engineer record.</p>

        {status === "success" ? (
          <div className="flex flex-col items-center text-center gap-3 py-6">
            <div className="w-12 h-12 rounded-full bg-[#E8F5EE] flex items-center justify-center">
              <FiCheck size={22} className="text-[#027D3F]" />
            </div>
            <p className="text-sm text-gray-600">{form.name} can now log in with the email and password you set.</p>
            <button onClick={onClose} className="mt-1 text-sm font-semibold text-[#027D3F] hover:underline">
              Done
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <Field label="Full name" value={form.name} onChange={(v) => update("name", v)} placeholder="e.g. Ramesh Kumar" />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Employee ID" value={form.emp_id} onChange={(v) => update("emp_id", v)} placeholder="e.g. SI 0030" />
              <Field label="Designation" value={form.designation} onChange={(v) => update("designation", v)} placeholder="e.g. Site Engineer" />
            </div>
            <Field label="Email" value={form.email} onChange={(v) => update("email", v)} placeholder="name@email.com" type="email" />
            <Field label="Mobile (optional)" value={form.mobile_number} onChange={(v) => update("mobile_number", v)} placeholder="10-digit number" />

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Role</label>
              <select
                value={form.role}
                onChange={(e) => update("role", e.target.value as Role)}
                className="w-full h-11 px-4 text-sm border border-gray-200 rounded-xl bg-gray-50 outline-none transition focus:border-[#027D3F] focus:bg-white focus:ring-2 focus:ring-[#027D3F]/15"
              >
                <option value="engineer">Engineer</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <Field label="Set password" value={form.password} onChange={(v) => update("password", v)} placeholder="Min 8 characters" type="password" />

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
                disabled={createUser.isPending}
                className="flex-1 h-11 rounded-xl bg-[#027D3F] hover:bg-[#02612f] text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
              >
                {createUser.isPending ? <FiLoader size={15} className="animate-spin" /> : <FiCheck size={15} />}
                Create User
              </button>
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
        className="w-full h-11 px-4 text-sm border border-gray-200 rounded-xl bg-gray-50 outline-none transition focus:border-[#027D3F] focus:bg-white focus:ring-2 focus:ring-[#027D3F]/15"
      />
    </div>
  )
}