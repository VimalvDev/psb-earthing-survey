import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user || !user.email) {
      return NextResponse.json({ ok: false }, { status: 401 })
    }

    const admin = createAdminClient()
    
    // Update last_seen_at for this user's profile
    await admin
      .from("engineers")
      .update({ last_seen_at: new Date().toISOString() })
      .or(`email.eq.${user.email},gmail.eq.${user.email}`)

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Heartbeat error:", error)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ ok: true })
}
