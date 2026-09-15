import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Update the last_seen_at column for the user
  const { error } = await supabase
    .from("engineers")
    .update({ last_seen_at: new Date().toISOString() })
    .or(`email.eq.${user.email},gmail.eq.${user.email}`)

  if (error) {
    console.error("Heartbeat error:", error)
    return NextResponse.json({ error: "Failed to update heartbeat" }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
