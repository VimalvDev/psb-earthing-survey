import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const ADMIN_EMAILS = ["psbsisify@gmail.com", "vimalverma8287@gmail.com"]

// GET /api/surveys/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data, error } = await supabase
    .from("surveys")
    .select("*")
    .eq("id", params.id)
    .single()

  if (error || !data) return NextResponse.json({ error: "Not found" }, { status: 404 })

  // Engineers can only view their own surveys
  const isAdmin = ADMIN_EMAILS.includes(user.email ?? "")
  if (!isAdmin && data.surveyor_emp_id !== user.user_metadata?.emp_id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  return NextResponse.json({ survey: data })
}

// PATCH /api/surveys/[id]  — admin only
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const isAdmin = ADMIN_EMAILS.includes(user.email ?? "")
  if (!isAdmin) return NextResponse.json({ error: "Forbidden — admin only" }, { status: 403 })

  const body = await req.json()
  const { data, error } = await supabase
    .from("surveys")
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq("id", params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ survey: data })
}