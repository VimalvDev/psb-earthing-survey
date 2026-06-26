import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(req: Request) {
  try {
    const { userId } = await req.json()
    if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 })

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { data: caller } = await supabase
      .from("engineers")
      .select("role")
      .eq("email", user.email)
      .single()

    if (caller?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const admin = createAdminClient()

    // Get engineer's email before deleting the row
    const { data: target } = await supabase
      .from("engineers")
      .select("email")
      .eq("id", userId)
      .single()

    // Delete engineers row first
    const { error: deleteRowError } = await admin
      .from("engineers")
      .delete()
      .eq("id", userId)

    if (deleteRowError) return NextResponse.json({ error: deleteRowError.message }, { status: 500 })

    // Find and delete auth account
    if (target?.email) {
      let page = 1
      while (true) {
        const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 })
        if (error) break

        const match = data.users.find(
          (u) => u.email?.toLowerCase() === target.email!.toLowerCase()
        )
        if (match) {
          await admin.auth.admin.deleteUser(match.id)
          break
        }
        if (data.users.length < 200) break
        page++
      }
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[delete-user] error:", err)
    return NextResponse.json({ error: err instanceof Error ? err.message : "Internal server error" }, { status: 500 })
  }
}