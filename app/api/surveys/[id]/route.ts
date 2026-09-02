import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

const ADMIN_EMAILS = ["psbsisify@gmail.com", "vimalverma8287@gmail.com"]

// GET /api/surveys/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data, error } = await supabase
    .from("surveys")
    .select("*")
    .eq("id", id)
    .single()

  if (error || !data) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const isAdmin = ADMIN_EMAILS.includes(user.email ?? "")
  if (!isAdmin && data.surveyor_emp_id !== user.user_metadata?.emp_id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  return NextResponse.json({ survey: data })
}

// PATCH /api/surveys/[id]  — admin only
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const isAdmin = ADMIN_EMAILS.includes(user.email ?? "")
  if (!isAdmin) return NextResponse.json({ error: "Forbidden — admin only" }, { status: 403 })

  const body = await req.json()
  const { data, error } = await supabase
    .from("surveys")
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ survey: data })
}

// DELETE /api/surveys/[id]  — admin only
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  // Use server client for auth check
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const isAdminEmail = ADMIN_EMAILS.includes(user.email ?? "")

  // Also check role in engineers table
  const admin = createAdminClient()
  const { data: engineer } = await admin
    .from("engineers")
    .select("role")
    .eq("email", user.email)
    .single()

  const canDelete = isAdminEmail || engineer?.role === "admin"
  if (!canDelete) return NextResponse.json({ error: "Forbidden — admin only" }, { status: 403 })

  // Use admin client to bypass RLS for delete
  // Fetch survey_id first to delete associated photos
  const { data: surveyToDel } = await admin
    .from("surveys")
    .select("survey_id")
    .eq("id", id)
    .single()

  if (surveyToDel?.survey_id) {
    const { data: files } = await admin.storage.from("survey-photos").list(surveyToDel.survey_id)
    if (files && files.length > 0) {
      const paths = files.map((f) => `${surveyToDel.survey_id}/${f.name}`)
      await admin.storage.from("survey-photos").remove(paths)
    }
  }

  const { error } = await admin
    .from("surveys")
    .delete()
    .eq("id", id)

  if (error) {
    console.error("Delete survey error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}