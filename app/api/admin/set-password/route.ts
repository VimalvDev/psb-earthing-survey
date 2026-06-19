import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(req: Request) {
  const { userId, newPassword } = await req.json()

  if (!userId || !newPassword || newPassword.length < 8) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }

  // Verify the caller is logged in and is an admin
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

  // Look up the target engineer's email
  const { data: target } = await supabase
    .from("engineers")
    .select("email")
    .eq("id", userId)
    .single()

  if (!target?.email) {
    return NextResponse.json({ error: "User has no email on file" }, { status: 400 })
  }

  // Find the matching auth account and set the new password
  const admin = createAdminClient()
  let authUserId: string | null = null
  let page = 1

  while (!authUserId) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const match = data.users.find(
      (u) => u.email?.toLowerCase() === target.email!.toLowerCase()
    )
    if (match) authUserId = match.id
    if (data.users.length < 200) break
    page += 1
  }

  if (!authUserId) {
    return NextResponse.json({ error: "No matching auth account found for this email" }, { status: 404 })
  }

  const { error: updateError } = await admin.auth.admin.updateUserById(authUserId, {
    password: newPassword,
  })

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}