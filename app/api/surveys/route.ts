import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

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

  const body = await req.json()

  // Attach surveyor identity from session — cannot be faked by client
  const surveyPayload = {
    ...body,
    surveyor_emp_id: user.user_metadata?.emp_id,
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