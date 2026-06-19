"use client"

import { useEffect, useState } from "react"
import { FiLock, FiCheck, FiLoader, FiUser, FiEye, FiEyeOff } from "react-icons/fi"
import { createClient } from "@/lib/supabase/client"
import { useChangeOwnPassword } from "@/components/admin/hooks"

interface Profile {
  name: string
  emp_id: string
  designation: string
  email: string
  mobile_number: string | null
  role: string
}

export default function SettingsPage() {
  const supabase = createClient()
  const [profile, setProfile] = useState<Profile | null>(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user?.email) return
      const { data } = await supabase
        .from("engineers")
        .select("name, emp_id, designation, email, mobile_number, role")
        .eq("email", user.email)
        .single()
      if (data) setProfile(data)
    }
    load()
  }, [])

  const initials = profile?.name
    ? profile.name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()
    : "--"

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your profile and account security.</p>
      </div>

      {/* Profile card */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <FiUser size={15} className="text-[#027D3F]" />
          <h3 className="font-semibold text-gray-900">Your profile</h3>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[#E8F5EE] text-[#027D3F] font-bold flex items-center justify-center shrink-0">
            {initials}
          </div>
          <div className="flex flex-col gap-0.5">
            <p className="font-medium text-gray-900">{profile?.name ?? "—"}</p>
            <p className="text-xs text-gray-400">{profile?.email ?? "—"}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-5 pt-5 border-t border-gray-100">
          <Field label="Employee ID" value={profile?.emp_id} />
          <Field label="Designation" value={profile?.designation} />
          <Field label="Mobile" value={profile?.mobile_number ?? "—"} />
          <Field label="Role" value={profile?.role} capitalize />
        </div>
      </div>

      <ChangePasswordCard />
    </div>
  )
}

function Field({ label, value, capitalize }: { label: string; value?: string | null; capitalize?: boolean }) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
      <p className={`text-sm text-gray-800 mt-1 ${capitalize ? "capitalize" : ""}`}>{value ?? "—"}</p>
    </div>
  )
}

function ChangePasswordCard() {
  const changePassword = useChangeOwnPassword()
  const [newPassword, setNewPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [status, setStatus] = useState<"idle" | "success" | "error" | "mismatch">("idle")

  function handleSubmit() {
    setStatus("idle")
    if (newPassword.length < 8) {
      setStatus("error")
      return
    }
    if (newPassword !== confirm) {
      setStatus("mismatch")
      return
    }
    changePassword.mutate(newPassword, {
      onSuccess: () => {
        setStatus("success")
        setNewPassword("")
        setConfirm("")
      },
      onError: () => setStatus("error"),
    })
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-1">
        <FiLock size={15} className="text-[#027D3F]" />
        <h3 className="font-semibold text-gray-900">Change password</h3>
      </div>
      <p className="text-xs text-gray-400 mb-5">Updates the password for your own account.</p>

      <div className="grid sm:grid-cols-2 gap-3">
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="New password (min 8 characters)"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full h-11 pl-4 pr-10 text-sm border border-gray-200 rounded-xl bg-gray-50 outline-none transition focus:border-[#027D3F] focus:bg-white focus:ring-2 focus:ring-[#027D3F]/15"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showPassword ? <FiEyeOff size={15} /> : <FiEye size={15} />}
          </button>
        </div>
        <input
          type={showPassword ? "text" : "password"}
          placeholder="Confirm new password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="w-full h-11 px-4 text-sm border border-gray-200 rounded-xl bg-gray-50 outline-none transition focus:border-[#027D3F] focus:bg-white focus:ring-2 focus:ring-[#027D3F]/15"
        />
      </div>

      <div className="flex items-center justify-between mt-4">
        <div>
          {status === "mismatch" && <p className="text-xs text-[#A32D2D]">Passwords don't match.</p>}
          {status === "error" && <p className="text-xs text-[#A32D2D]">Password must be at least 8 characters, or update failed.</p>}
          {status === "success" && <p className="text-xs text-[#3B6D11] flex items-center gap-1"><FiCheck size={13} /> Password updated.</p>}
        </div>
        <button
          onClick={handleSubmit}
          disabled={changePassword.isPending}
          className="h-11 px-5 rounded-xl bg-[#027D3F] hover:bg-[#02612f] text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-60 shrink-0"
        >
          {changePassword.isPending ? <FiLoader size={15} className="animate-spin" /> : <FiCheck size={15} />}
          Update Password
        </button>
      </div>
    </div>
  )
}