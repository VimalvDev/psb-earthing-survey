"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { FiLock, FiEye, FiEyeOff, FiArrowRight, FiLoader, FiCheckCircle, FiXCircle } from "react-icons/fi"
import { createClient } from "@/lib/supabase/client"

export default function ResetPasswordPage() {
  const router = useRouter()
  const supabase = createClient()

  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [done, setDone] = useState(false)
  const [tokenError, setTokenError] = useState("")
  const [sessionReady, setSessionReady] = useState(false)

  // ── Exchange token from URL hash for session ──────────────────────────
  useEffect(() => {
    async function exchangeToken() {
      // Supabase puts token_hash in the URL as a fragment (#) or query param
      // We need to check both
      const hash = window.location.hash
      const params = new URLSearchParams(window.location.search)

      // Check for error in URL
      const urlError = params.get("error")
      const errorCode = params.get("error_code")
      if (urlError || errorCode) {
        if (errorCode === "otp_expired") {
          setTokenError("This reset link has expired. Please request a new one.")
        } else {
          setTokenError("Invalid reset link. Please request a new one.")
        }
        return
      }

      // Try to get session from URL (Supabase SSR handles this)
      const { data, error } = await supabase.auth.getSession()

      if (data?.session) {
        setSessionReady(true)
        return
      }

      // If no session yet, listen for PASSWORD_RECOVERY event
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === "PASSWORD_RECOVERY" && session) {
          setSessionReady(true)
          subscription.unsubscribe()
        }
      })

      // Also try exchangeCodeForSession if there's a code in URL
      const code = params.get("code")
      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
        if (!exchangeError) {
          setSessionReady(true)
        } else {
          setTokenError("Reset link is invalid or expired. Please request a new one.")
        }
      }

      return () => subscription.unsubscribe()
    }

    exchangeToken()
  }, [])

  async function handleReset() {
    setError("")

    if (!password || !confirm) {
      setError("Please fill in both fields.")
      return
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.")
      return
    }
    if (password !== confirm) {
      setError("Passwords do not match.")
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (error) {
      setError("Failed to update password. Please request a new reset link.")
      return
    }

    setDone(true)
    setTimeout(async () => {
      await supabase.auth.signOut()
      router.push("/login")
    }, 3000)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleReset()
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#FAF6EE] px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

          {/* Header */}
          <div className="bg-[#027D3F] px-8 py-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#BDD70C] flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="#027D3F" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-bold text-white">PSB Earthing Survey</p>
                <p className="text-xs text-white/60">Password Reset</p>
              </div>
            </div>
            <Image src="/sify.png" alt="Sify" width={60} height={22} className="object-contain brightness-0 invert opacity-70" />
          </div>

          {/* Body */}
          <div className="px-8 py-8">

            {/* Token error state */}
            {tokenError ? (
              <div className="flex flex-col items-center text-center gap-4 py-6">
                <div className="w-16 h-16 rounded-full bg-[#FDECEC] flex items-center justify-center">
                  <FiXCircle size={30} className="text-[#E41E23]" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Link expired</h2>
                <p className="text-sm text-gray-500 max-w-xs">{tokenError}</p>
                <button
                  type="button"
                  onClick={() => router.push("/login")}
                  className="mt-2 w-full h-12 rounded-xl bg-[#027D3F] hover:bg-[#02612f] text-white font-semibold text-sm flex items-center justify-between px-5 transition-colors"
                >
                  <span>Back to Login</span>
                  <FiArrowRight size={16} />
                </button>
              </div>
            ) : !done ? (
              <>
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Set new password</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Choose a strong password of at least 8 characters.
                  </p>
                </div>

                <div className="flex flex-col gap-4">

                  {/* New password */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      New Password
                    </label>
                    <div className="relative">
                      <FiLock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Min. 8 characters"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={loading || !sessionReady}
                        className="w-full h-12 pl-10 pr-12 text-sm border border-gray-200 rounded-xl bg-gray-50 outline-none transition focus:border-[#027D3F] focus:bg-white focus:ring-2 focus:ring-[#027D3F]/15 disabled:opacity-60"
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showPassword ? <FiEyeOff size={15} /> : <FiEye size={15} />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm password */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <FiLock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type={showConfirm ? "text" : "password"}
                        placeholder="Re-enter new password"
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={loading || !sessionReady}
                        className="w-full h-12 pl-10 pr-12 text-sm border border-gray-200 rounded-xl bg-gray-50 outline-none transition focus:border-[#027D3F] focus:bg-white focus:ring-2 focus:ring-[#027D3F]/15 disabled:opacity-60"
                      />
                      <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showConfirm ? <FiEyeOff size={15} /> : <FiEye size={15} />}
                      </button>
                    </div>
                  </div>

                  {!sessionReady && !tokenError && (
                    <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-[#F6F8D7] border border-[#E7E9A9]">
                      <FiLoader size={14} className="text-[#768A06] animate-spin shrink-0" />
                      <p className="text-sm text-[#768A06]">Validating reset link…</p>
                    </div>
                  )}

                  {error && (
                    <div className="px-3.5 py-2.5 rounded-xl bg-[#FDECEC] border border-[#F5B9B9]">
                      <p className="text-sm text-[#D81F26]">{error}</p>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleReset}
                    disabled={loading || !sessionReady}
                    className="w-full h-12 rounded-xl bg-[#027D3F] hover:bg-[#02612f] text-white font-semibold text-sm flex items-center justify-between px-5 transition-colors disabled:opacity-60 mt-1"
                  >
                    {loading
                      ? <><span>Updating…</span><FiLoader size={16} className="animate-spin" /></>
                      : <><span>Update Password</span><FiArrowRight size={16} /></>
                    }
                  </button>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center text-center gap-4 py-6">
                <div className="w-16 h-16 rounded-full bg-[#E8F5EE] flex items-center justify-center">
                  <FiCheckCircle size={30} className="text-[#027D3F]" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Password updated!</h2>
                <p className="text-sm text-gray-500">Redirecting you to login…</p>
                <FiLoader size={20} className="text-[#027D3F] animate-spin" />
              </div>
            )}
          </div>
        </div>

        <p className="text-xs text-gray-400 text-center mt-4">PSB Earthing Survey · Structure India</p>
      </div>
    </main>
  )
}