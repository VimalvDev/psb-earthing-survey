"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FiEye, FiEyeOff, FiUser, FiLock, FiArrowRight, FiLoader } from "react-icons/fi";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [empId, setEmpId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin() {
    setError("");

    const identifier = empId.trim();
    if (!identifier || !password) {
      setError("Please enter your Employee ID and password.");
      return;
    }

    setLoading(true);

    // Step 1: check if input is an email (admins) or emp_id (engineers)
    const isEmail = identifier.includes("@");

    let emailToUse = identifier;

    if (!isEmail) {
      // Look up email from engineers table using emp_id
      // emp_id format can be case-insensitive e.g. "si 0025" or "SI 0025"
      const { data, error: lookupError } = await supabase
        .from("engineers")
        .select("email")
        .ilike("emp_id", identifier)
        .single();

      if (lookupError || !data) {
        setError("Employee ID not found. Check your ID or contact admin.");
        setLoading(false);
        return;
      }

      emailToUse = data.email;
    }

    // Step 2: sign in with email + password via Supabase Auth
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: emailToUse,
      password,
    });

    setLoading(false);

    if (authError) {
      // Don't expose raw Supabase error to field engineers
      setError("Incorrect password. Try again or contact admin.");
      return;
    }

    // Step 3: redirect to dashboard
    router.push("/dashboard/survey");
    router.refresh(); // refresh server state so layout picks up session
  }

  // Allow login on Enter key
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleLogin();
  }

  return (
    <main className="min-h-screen flex">
      {/* Header */}
      <header className="flex w-full py-7 md:px-[3.2em] px-[1.5em] z-100 absolute items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
            Structure India
          </p>
        </div>
        <div className="relative flex items-center gap-2 bg-gray-900 text-white text-xs font-semibold px-4 py-2 rounded-full">
          Help
        </div>
      </header>

      {/* Left Side - large screens only */}
      <div className="hidden lg:flex lg:w-1/2 mt-10 flex-col justify-between p-12">
        <div className="flex flex-col gap-4">
          <h1 className="font-semibold text-gray-900 leading-tight text-3xl sm:text-4xl xl:text-5xl">
            Record and track earthing test results across all PSB branches.
          </h1>
          <p className="text-gray-500 leading-relaxed text-sm sm:text-base">
            Log in to submit earthing resistance readings, inspection
            checklists, and compliance status for PSB branches across India.
          </p>
          <div className="mt-4">
            <Image
              src="/psb.png"
              alt="PSB Bank Building"
              width={500}
              height={300}
              className="w-full object-contain"
            />
          </div>
        </div>
        <div>
          <p className="text-xs text-gray-400">
            PSB Branch Earthing Survey · Pan India
          </p>
        </div>
      </div>

      {/* Right Side */}
      <div className="w-full lg:w-1/2 flex flex-col min-h-screen bg-white lg:border-l lg:border-gray-200 relative">

        {/* Mobile only — headline */}
        <div className="flex lg:hidden flex-col gap-2 px-6 pt-20 pb-4">
          <h1 className="text-2xl font-semibold text-gray-900 leading-tight">
            Track earthing survey results across PSB branches.
          </h1>
          <p className="text-sm text-gray-500 mb-10">
            Log in to submit your survey records.
          </p>
        </div>

        {/* Form — centered */}
        <div className="flex-1 flex flex-col justify-center px-8 sm:px-16">
          <div className="max-w-sm w-full mx-auto">
            <p className="text-2xl font-bold hidden md:flex text-gray-600 capitalize mb-8">
              Log In To Continue.
            </p>

            <div className="flex flex-col gap-4">
              {/* Employee ID / Email */}
              <div className="relative">
                <FiUser
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={16}
                />
                <Input
                  placeholder="Username / Employee ID"
                  value={empId}
                  onChange={(e) => setEmpId(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="pl-9 bg-white border-gray-200 h-12 rounded-lg"
                  disabled={loading}
                />
              </div>

              {/* Password */}
              <div className="relative">
                <FiLock
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={16}
                />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="pl-9 pr-10 bg-white border-gray-200 h-12 rounded-lg"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute px-4 py-4 right-0 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                </button>
              </div>

              {/* Error message */}
              {error && (
                <p className="text-sm text-red-500 -mt-1">{error}</p>
              )}

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-gray-500 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 accent-gray-900" />
                  Remember me
                </label>
                <button
                  type="button"
                  className="text-sm text-gray-500 hover:text-gray-900"
                >
                  Forgot Password?
                </button>
              </div>

              {/* Login button */}
              <Button
                onClick={handleLogin}
                disabled={loading}
                className="w-full bg-gray-900 hover:bg-gray-700 text-white h-12 rounded-lg mt-2 flex items-center justify-between px-5 disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <span className="font-semibold text-base">Signing in...</span>
                    <FiLoader size={18} className="animate-spin" />
                  </>
                ) : (
                  <>
                    <span className="font-semibold text-base">Log In</span>
                    <FiArrowRight size={18} />
                  </>
                )}
              </Button>
            </div>

            <p className="text-xs text-gray-400 mt-6 text-center">
              For access issues contact your system administrator.
            </p>
          </div>
        </div>

        {/* Mobile only — bottom PSB image */}
        <div className="flex lg:hidden justify-end px-4 pb-4">
          <Image
            src="/psb.png"
            alt="PSB Bank Building"
            width={800}
            height={220}
          />
        </div>
      </div>
    </main>
  );
}