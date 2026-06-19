"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import {
  FiEye, FiEyeOff, FiUser, FiLock,
  FiArrowRight, FiLoader, FiMail, FiCheckCircle,
} from "react-icons/fi"
import { createClient } from "@/lib/supabase/client"

type View = "login" | "forgot"

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [view, setView] = useState<View>("login")

  // Login state
  const [identifier, setIdentifier] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // Forgot password state
  const [resetIdentifier, setResetIdentifier] = useState("")
  const [resetLoading, setResetLoading] = useState(false)
  const [resetError, setResetError] = useState("")
  const [resetSent, setResetSent] = useState(false)

  // ── Helpers ──────────────────────────────────────────────────────────────

  async function lookupEmail(input: string): Promise<string | null> {
    const isEmail = input.includes("@")
    if (isEmail) return input

    const { data, error } = await supabase
      .from("engineers")
      .select("email")
      .ilike("emp_id", input.trim())
      .single()

    if (error || !data) return null
    return data.email
  }

  // ── Login ─────────────────────────────────────────────────────────────────

  async function handleLogin() {
    setError("")
    if (!identifier.trim() || !password) {
      setError("Please enter your Employee ID and password.")
      return
    }

    setLoading(true)

    const email = await lookupEmail(identifier.trim())
    if (!email) {
      setError("Employee ID not found. Check your ID or contact admin.")
      setLoading(false)
      return
    }

    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)

    if (authError) {
      setError("Incorrect password. Try again or contact admin.")
      return
    }

    router.push("/dashboard/survey")
    router.refresh()
  }

  // ── Forgot password ────────────────────────────────────────────────────────

  async function handleForgotPassword() {
    setResetError("")
    if (!resetIdentifier.trim()) {
      setResetError("Please enter your Employee ID or email.")
      return
    }

    setResetLoading(true)

    const email = await lookupEmail(resetIdentifier.trim())
    if (!email) {
      setResetError("Employee ID not found. Contact your admin.")
      setResetLoading(false)
      return
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    setResetLoading(false)

    if (error) {
      setResetError("Failed to send reset email. Please try again.")
      return
    }

    setResetSent(true)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      if (view === "login") handleLogin()
      else handleForgotPassword()
    }
  }

  return (
    <main className="min-h-screen flex bg-[#FAF6EE]">

      {/* ── Left panel — desktop only ─────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between px-8 py-5 relative overflow-hidden">
        <div className="absolute inset-0 bg-[#027D3F]" />

        {/* Blueprint grid */}
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
            backgroundSize: "36px 36px",
          }}
        />
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(circle at 15% 85%, #BDD70C 0%, transparent 45%), radial-gradient(circle at 85% 10%, #BDD70C 0%, transparent 40%)",
          }}
        />

        {/* Structure India logo */}
        <div className="relative z-10 animate-[fadeInUp_0.6s_ease-out_both]">
          <Image src="/structureindia.png" alt="Structure India" width={50} height={50} className="object-contain brightness-0 invert" />
        </div>

        {/* Center content */}
        <div className="relative z-10 flex flex-col gap-7">

          {/* Resistance gauge — signature element */}
          <div className="relative w-32 h-20 animate-[fadeInUp_0.7s_ease-out_0.1s_both]">
            <svg viewBox="0 0 120 70" className="w-full h-full overflow-visible">
              <path d="M10 65 A50 50 0 0 1 43 17" stroke="#027D3F" strokeWidth="10" strokeLinecap="round" fill="none" className="opacity-90" stroke-color="#E41E23" />
              <path d="M10 65 A50 50 0 0 1 43 17" stroke="#E41E23" strokeWidth="10" strokeLinecap="round" fill="none" />
              <path d="M43 17 A50 51 0 0 1 80 16" stroke="#EF9447" strokeWidth="10" strokeLinecap="round" fill="none" />
              <path d="M82 17 A50 50 0 0 1 110 65" stroke="#BDD70C" strokeWidth="10" strokeLinecap="round" fill="none" />
              <circle cx="60" cy="65" r="5" fill="#FAF6EE" />
              <line
                x1="60" y1="75" x2="60" y2="25"
                stroke="#FAF6EE" strokeWidth="3" strokeLinecap="round"
                style={{
                  transformOrigin: "60px 65px",
                  animation: "needleSweep 1.3s cubic-bezier(0.22, 1, 0.36, 1) 0.5s both",
                }}
              />
            </svg>
            <p className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] font-semibold text-white/60 uppercase tracking-widest">
              Resistance
            </p>
          </div>

          <h1 className="text-4xl font-bold text-white leading-tight animate-[fadeInUp_0.6s_ease-out_0.2s_both]">
            PSB Earthing<br />Survey System
          </h1>
          <p className="text-white/70 text-base leading-relaxed max-w-sm animate-[fadeInUp_0.6s_ease-out_0.3s_both]">
            Record and track earthing test results across all Punjab & Sind Bank branches pan-India.
          </p>
          <div className="flex gap-6 mt-2 animate-[fadeInUp_0.6s_ease-out_0.4s_both]">
            {[
              { label: "Branches", value: "1,610" },
              { label: "States", value: "22+" },
              { label: "Engineers", value: "5+" },
            ].map((s) => (
              <div key={s.label}>
                <p className="text-2xl font-bold text-white">{s.value}</p>
                <p className="text-xs text-white/50 uppercase tracking-wider mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-2 text-white/40 text-xs animate-[fadeInUp_0.6s_ease-out_0.5s_both]">
          <FiCheckCircle size={13} />
          <span>Threshold bands: Good 0–2Ω · Partial 2.1–5Ω · Fail 5Ω+</span>
        </div>
      </div>

      {/* ── Right panel ───────────────────────────────────────────────────── */}
      <div className="w-full lg:w-1/2 flex flex-col min-h-screen bg-white relative">

        {/* Top logos bar */}
        <div className="flex items-center justify-between px-6 sm:px-10 py-5 border-b border-gray-100">
          <Image src="/structureindia.png" alt="Structure India" width={30} height={30} className="object-contain lg:opacity-0" />
          <Image src="/sify.png" alt="Sify" width={50} height={50} className="object-contain" />
        </div>

        {/* Mobile headline */}
        <div className="flex lg:hidden flex-col gap-2 px-6 pt-8 pb-2 animate-[fadeInUp_0.5s_ease-out_both]">
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">PSB Earthing Survey</h1>
          <p className="text-sm text-gray-500">Log in to submit your survey records.</p>
        </div>

        {/* Form area */}
        <div className="flex-1 flex flex-col justify-center px-6 sm:px-10 lg:px-16">
          <div className="max-w-sm w-full mx-auto">

            {/* ── LOGIN VIEW ─────────────────────────────────────────────── */}
            {view === "login" && (
              <>
                <div className="mb-8 animate-[fadeInUp_0.5s_ease-out_0.05s_both]">
                  <h2 className="text-2xl font-bold text-gray-900">Welcome back</h2>
                  <p className="text-sm text-gray-500 mt-1">Sign in to continue to your dashboard</p>
                </div>

                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5 animate-[fadeInUp_0.5s_ease-out_0.1s_both]">
                    <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Employee ID or Email
                    </label>
                    <div className="relative group">
                      <FiUser size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 transition-colors group-focus-within:text-[#027D3F]" />
                      <input
                        placeholder="e.g. SI 0025 or name@email.com"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={loading}
                        className="w-full h-12 pl-10 pr-4 text-sm border border-gray-200 rounded-xl bg-gray-50 outline-none transition-all duration-200 focus:border-[#027D3F] focus:bg-white focus:ring-2 focus:ring-[#027D3F]/15 focus:shadow-sm disabled:opacity-60"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5 animate-[fadeInUp_0.5s_ease-out_0.15s_both]">
                    <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Password
                    </label>
                    <div className="relative group">
                      <FiLock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 transition-colors group-focus-within:text-[#027D3F]" />
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={loading}
                        className="w-full h-12 pl-10 pr-12 text-sm border border-gray-200 rounded-xl bg-gray-50 outline-none transition-all duration-200 focus:border-[#027D3F] focus:bg-white focus:ring-2 focus:ring-[#027D3F]/15 focus:shadow-sm disabled:opacity-60"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showPassword ? <FiEyeOff size={15} /> : <FiEye size={15} />}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <div className="px-3.5 py-2.5 rounded-xl bg-[#FDECEC] border border-[#F5B9B9] animate-[fadeInUp_0.3s_ease-out_both]">
                      <p className="text-sm text-[#D81F26]">{error}</p>
                    </div>
                  )}

                  <div className="flex justify-end animate-[fadeInUp_0.5s_ease-out_0.2s_both]">
                    <button
                      type="button"
                      onClick={() => { setView("forgot"); setError(""); setResetSent(false) }}
                      className="text-sm text-[#027D3F] hover:underline font-medium"
                    >
                      Forgot password?
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleLogin}
                    disabled={loading}
                    className="w-full h-12 rounded-xl bg-[#027D3F] hover:bg-[#02612f] active:scale-[0.98] text-white font-semibold text-sm flex items-center justify-between px-5 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-60 disabled:active:scale-100 mt-1 animate-[fadeInUp_0.5s_ease-out_0.25s_both]"
                  >
                    {loading
                      ? <><span>Signing in…</span><FiLoader size={16} className="animate-spin" /></>
                      : <><span>Sign In</span><FiArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" /></>
                    }
                  </button>
                </div>

                <p className="text-xs text-gray-400 mt-8 text-center animate-[fadeInUp_0.5s_ease-out_0.3s_both]">
                  For access issues contact your system administrator.
                </p>
              </>
            )}

            {/* ── FORGOT PASSWORD VIEW ────────────────────────────────────── */}
            {view === "forgot" && (
              <>
                <button
                  type="button"
                  onClick={() => { setView("login"); setResetSent(false); setResetError("") }}
                  className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#027D3F] transition-colors mb-8"
                >
                  ← Back to login
                </button>

                {!resetSent ? (
                  <>
                    <div className="mb-8 animate-[fadeInUp_0.4s_ease-out_both]">
                      <div className="w-12 h-12 rounded-2xl bg-[#E8F5EE] flex items-center justify-center mb-4">
                        <FiMail size={22} className="text-[#027D3F]" />
                      </div>
                      <h2 className="text-2xl font-bold text-gray-900">Reset password</h2>
                      <p className="text-sm text-gray-500 mt-1">
                        Enter your Employee ID or email. We'll send a reset link to your registered email address.
                      </p>
                    </div>

                    <div className="flex flex-col gap-4">
                      <div className="flex flex-col gap-1.5 animate-[fadeInUp_0.4s_ease-out_0.05s_both]">
                        <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Employee ID or Email
                        </label>
                        <div className="relative group">
                          <FiUser size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 transition-colors group-focus-within:text-[#027D3F]" />
                          <input
                            placeholder="e.g. SI 0025 or name@email.com"
                            value={resetIdentifier}
                            onChange={(e) => setResetIdentifier(e.target.value)}
                            onKeyDown={handleKeyDown}
                            disabled={resetLoading}
                            className="w-full h-12 pl-10 pr-4 text-sm border border-gray-200 rounded-xl bg-gray-50 outline-none transition-all duration-200 focus:border-[#027D3F] focus:bg-white focus:ring-2 focus:ring-[#027D3F]/15 focus:shadow-sm disabled:opacity-60"
                          />
                        </div>
                      </div>

                      {resetError && (
                        <div className="px-3.5 py-2.5 rounded-xl bg-[#FDECEC] border border-[#F5B9B9] animate-[fadeInUp_0.3s_ease-out_both]">
                          <p className="text-sm text-[#D81F26]">{resetError}</p>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={handleForgotPassword}
                        disabled={resetLoading}
                        className="w-full h-12 rounded-xl bg-[#027D3F] hover:bg-[#02612f] active:scale-[0.98] text-white font-semibold text-sm flex items-center justify-between px-5 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-60 animate-[fadeInUp_0.4s_ease-out_0.1s_both]"
                      >
                        {resetLoading
                          ? <><span>Sending…</span><FiLoader size={16} className="animate-spin" /></>
                          : <><span>Send Reset Link</span><FiArrowRight size={16} /></>
                        }
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center text-center gap-4 py-8 animate-[fadeInUp_0.4s_ease-out_both]">
                    <div className="w-16 h-16 rounded-full bg-[#E8F5EE] flex items-center justify-center animate-[popIn_0.4s_cubic-bezier(0.22,1,0.36,1)_0.1s_both]">
                      <FiMail size={28} className="text-[#027D3F]" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">Check your email</h2>
                    <p className="text-sm text-gray-500 max-w-xs">
                      A password reset link has been sent to your registered email. It expires in 10 minutes.
                    </p>
                    <p className="text-xs text-gray-400">
                      Didn't receive it? Check your spam folder or contact admin.
                    </p>
                    <button
                      type="button"
                      onClick={() => { setView("login"); setResetSent(false); setResetIdentifier("") }}
                      className="mt-2 text-sm font-semibold text-[#027D3F] hover:underline"
                    >
                      Back to login
                    </button>
                  </div>
                )}
              </>
            )}

          </div>
        </div>

        {/* Bottom bar */}
        <div className="px-6 sm:px-10 py-4 border-t border-gray-100 flex items-center justify-between">
          <p className="text-xs text-gray-400">PSB Earthing Survey · Pan India</p>
          <p className="text-xs text-gray-400">© 2026 Structure India</p>
        </div>
      </div>

      <style jsx global>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes needleSweep {
          from { transform: rotate(-90deg); }
          to { transform: rotate(8deg); }
        }
        @keyframes popIn {
          from { opacity: 0; transform: scale(0.7); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </main>
  )
}