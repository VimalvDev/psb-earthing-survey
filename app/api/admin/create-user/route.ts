import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(req: Request) {
  const { name, emp_id, designation, email, mobile_number, password, role } = await req.json()

  if (!name || !emp_id || !email || !password || !role) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 })
  }

  // Verify caller is an admin
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: caller } = await supabase
    .from("engineers")
    .select("role")
    .eq("email", user.email)
    .single()

  if (caller?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const admin = createAdminClient()

  // Create the auth account
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (createError || !created.user) {
    return NextResponse.json({ error: createError?.message ?? "Failed to create auth account" }, { status: 500 })
  }

  // Insert the engineers row
  const { error: insertError } = await admin
    .from("engineers")
    .insert({ name, emp_id, designation: designation || "Engineer", email, mobile_number: mobile_number || null, role })

  if (insertError) {
    // Roll back the auth account so we don't leave an orphaned login
    await admin.auth.admin.deleteUser(created.user.id)
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}