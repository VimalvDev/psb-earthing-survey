import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

// GET /api/surveys  — list all surveys (admin sees all, engineer sees own)
export async function GET(req: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const ADMIN_EMAILS = ["psbsisify@gmail.com", "vimalverma8287@gmail.com"]
  const isAdmin = ADMIN_EMAILS.includes(user.email ?? "")

  let query = supabase
    .from("surveys")
    .select("*")
    .order("created_at", { ascending: false })

  // Engineers only see their own submissions
  if (!isAdmin) {
    query = query.eq("surveyor_emp_id", user.user_metadata?.emp_id)
  }

  const { data, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ surveys: data })
}

/**
 * Derive financial year (April–March) from a YYYY-MM-DD date string.
 *
 * Parses calendar components directly to avoid timezone-related
 * Date-object shifts that could move a date across month boundaries.
 *
 * Examples:
 *   2025-03-31 => "2024-25"
 *   2025-04-01 => "2025-26"
 *   2026-10-29 => "2026-27"
 */
function deriveFinancialYear(visitDate: string): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(visitDate?.trim?.() ?? "")
  if (!match) return null

  const year = parseInt(match[1], 10)
  const month = parseInt(match[2], 10)

  if (month < 1 || month > 12) return null
  const day = parseInt(match[3], 10)
  if (day < 1 || day > 31) return null

  // April (4) onward → FY starts this calendar year
  // Jan–Mar (1-3)   → FY starts previous calendar year
  const fyStart = month >= 4 ? year : year - 1
  const fyEnd = (fyStart + 1) % 100 // last two digits

  return `${fyStart}-${fyEnd.toString().padStart(2, "0")}`
}

// POST /api/surveys  — submit a new survey
export async function POST(req: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const adminClient = createAdminClient()
  const { data: engineer } = await adminClient
    .from("engineers")
    .select("role")
    .or(`email.eq.${user.email},gmail.eq.${user.email}`)
    .single()

  if (engineer?.role === "visitor") {
    return NextResponse.json({ error: "Visitors cannot submit surveys" }, { status: 403 })
  }

  const body = await req.json()

  const {
    surveyor_name,
    surveyor_designation,
    surveyor_mobile,
    surveyor_emp_id: formEmpId,
    financial_year: _clientFY, // explicitly discard any client-supplied value
    ...restBody
  } = body;

  // Derive financial_year server-side from the submitted visit_date
  const financialYear = deriveFinancialYear(restBody.visit_date)
  if (!financialYear) {
    return NextResponse.json(
      { error: "Invalid or missing visit_date. Expected format: YYYY-MM-DD" },
      { status: 400 }
    )
  }

  const ADMIN_EMAILS = ["psbsisify@gmail.com", "vimalverma8287@gmail.com"]
  const isAdmin = ADMIN_EMAILS.includes(user.email ?? "")

  const surveyPayload = {
    ...restBody,
    surveyor_name: surveyor_name || null,
    surveyor_designation: surveyor_designation || null,
    surveyor_mobile: surveyor_mobile || null,
    surveyor_emp_id: formEmpId || user.user_metadata?.emp_id || null,
    surveyor_email: isAdmin ? (restBody.surveyor_email || user.email) : user.email,
    created_at: new Date().toISOString(),
    status: "submitted",
    financial_year: financialYear,
  }

  const client = isAdmin ? adminClient : supabase;

  const { data, error } = await client
    .from("surveys")
    .insert(surveyPayload)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ survey: data }, { status: 201 })
}