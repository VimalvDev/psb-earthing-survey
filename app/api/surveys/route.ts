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

// POST /api/surveys  — submit a new survey
export async function POST(req: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const adminClient = createAdminClient()
  const { data: engineer } = await adminClient
    .from("engineers")
    .select("role")
    .eq("email", user.email)
    .single()

  if (engineer?.role === "visitor") {
    return NextResponse.json({ error: "Visitors cannot submit surveys" }, { status: 403 })
  }

  const body = await req.json()

  if (body.bic) {
    const { data: existingSurvey } = await supabase
      .from("surveys")
      .select("id")
      .ilike("bic", body.bic)
      .single()

    if (existingSurvey) {
      return NextResponse.json(
        { error: `A survey for branch code ${body.bic} has already been submitted.` },
        { status: 400 }
      )
    }
  }

  const {
    surveyor_name,
    surveyor_designation,
    surveyor_mobile,
    surveyor_emp_id: formEmpId,
    ...restBody
  } = body;

  const surveyPayload = {
    ...restBody,
    surveyor_name: surveyor_name || null,
    surveyor_designation: surveyor_designation || null,
    surveyor_mobile: surveyor_mobile || null,
    surveyor_emp_id: formEmpId || user.user_metadata?.emp_id || null,
    surveyor_email: user.email,
    created_at: new Date().toISOString(),
    status: "submitted",
  }

  const { data, error } = await supabase
    .from("surveys")
    .insert(surveyPayload)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ survey: data }, { status: 201 })
}