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
  gmail: string | null
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
        .select("name, emp_id, designation, email, mobile_number, role, gmail")
        .or(`email.eq.${user.email},gmail.eq.${user.email}`)
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
      <ProfileForm profile={profile} onChange={setProfile} />

      <ChangePasswordCard />
    </div>
  )
}

function Field({ label, value, capitalize, disabled, onChange }: { label: string; value?: string | null; capitalize?: boolean; disabled?: boolean; onChange?: (v: string) => void }) {
  if (disabled || !onChange) {
    return (
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
        <p className={`text-sm text-gray-800 mt-1.5 ${capitalize ? "capitalize" : ""}`}>{value || "—"}</p>
      </div>
    )
  }

  return (
    <div>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">{label}</p>
      <input
        type="text"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-10 px-3 text-sm border border-gray-200 rounded-lg bg-gray-50 outline-none transition focus:border-[#027D3F] focus:bg-white focus:ring-1 focus:ring-[#027D3F]"
      />
    </div>
  )
}

function ProfileForm({ profile, onChange }: { profile: Profile | null; onChange: (p: Profile) => void }) {
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const initials = profile?.name
    ? profile.name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()
    : "--"

  async function handleSave() {
    if (!profile) return
    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/user/update-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: profile.name,
          designation: profile.designation,
          mobile_number: profile.mobile_number,
          gmail: profile.gmail,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to update profile")

      setIsEditing(false)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FiUser size={15} className="text-[#027D3F]" />
          <h3 className="font-semibold text-gray-900">Your profile</h3>
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="text-sm font-semibold text-[#027D3F] hover:underline"
          >
            Edit details
          </button>
        )}
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 rounded-full bg-[#E8F5EE] text-[#027D3F] font-bold flex items-center justify-center shrink-0">
          {initials}
        </div>
        <div className="flex flex-col gap-0.5">
          {isEditing ? (
            <input
              type="text"
              value={profile?.name || ""}
              onChange={(e) => onChange({ ...profile!, name: e.target.value })}
              className="h-8 px-2 text-sm font-medium border border-gray-200 rounded bg-gray-50 outline-none focus:border-[#027D3F]"
            />
          ) : (
            <p className="font-medium text-gray-900">{profile?.name ?? "—"}</p>
          )}
          <p className="text-xs text-gray-400">{profile?.email ?? "—"}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-y-5 gap-x-4 pt-5 border-t border-gray-100">
        <Field label="Employee ID" value={profile?.emp_id} disabled />
        <Field label="Role" value={profile?.role} capitalize disabled />
        <Field
          label="Designation"
          value={profile?.designation}
          disabled={!isEditing}
          onChange={(v) => onChange({ ...profile!, designation: v })}
        />
        <Field
          label="Mobile"
          value={profile?.mobile_number}
          disabled={!isEditing}
          onChange={(v) => onChange({ ...profile!, mobile_number: v })}
        />
        <div className="col-span-2 sm:col-span-1">
          <Field
            label="Personal Gmail"
            value={profile?.gmail}
            disabled={!isEditing}
            onChange={(v) => onChange({ ...profile!, gmail: v })}
          />
          {isEditing && (
            <p className="text-[10px] text-gray-400 mt-1">
              Adding a Gmail enables you to receive password reset links here.
            </p>
          )}
        </div>
      </div>

      {isEditing && (
        <div className="mt-6 pt-5 border-t border-gray-100 flex items-center justify-between">
          {error ? <p className="text-xs text-[#D81F26]">{error}</p> : <div />}
          <div className="flex gap-2">
            <button
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="px-4 py-2 rounded-xl bg-[#027D3F] hover:bg-[#02612f] text-white font-semibold text-sm flex items-center gap-2 disabled:opacity-60"
            >
              {loading ? <FiLoader size={14} className="animate-spin" /> : "Save Changes"}
            </button>
          </div>
        </div>
      )}
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