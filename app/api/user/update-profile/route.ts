import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(req: Request) {
  try {
    const { name, designation, mobile_number, gmail } = await req.json()

    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: engineer, error: engError } = await supabase
      .from("engineers")
      .select("email, gmail")
      .eq("email", user.email)
      .single()

    if (engError || !engineer) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    const admin = createAdminClient()
    const targetEmail = gmail ? gmail.trim() : engineer.email

    // If target email is different from current auth email, update it
    if (user.email !== targetEmail) {
      const { error: authError } = await admin.auth.admin.updateUserById(user.id, {
        email: targetEmail,
        email_confirm: true,
      })
      if (authError) {
        return NextResponse.json({ error: authError.message }, { status: 500 })
      }
    }

    // Update engineers table
    const { error: updateError } = await admin
      .from("engineers")
      .update({ name, designation, mobile_number, gmail: gmail || null })
      // Use engineer.email (the official email) because we don't change that in the DB
      .eq("email", engineer.email)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, newEmail: targetEmail })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
