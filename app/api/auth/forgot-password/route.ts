import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: Request) {
  try {
    const { identifier } = await req.json()

    if (!identifier || !identifier.trim()) {
      return NextResponse.json(
        { error: "Please enter your Employee ID or email." },
        { status: 400 }
      )
    }

    const admin = createAdminClient()
    const input = identifier.trim()
    const isEmail = input.includes("@")

    let email: string | null = null

    if (isEmail) {
      // Verify this email exists in the engineers table
      const { data, error } = await admin
        .from("engineers")
        .select("email, name")
        .ilike("email", input)
        .single()

      if (error || !data) {
        return NextResponse.json(
          { error: "No account found with this email. Please contact your administrator." },
          { status: 404 }
        )
      }
      email = data.email
    } else {
      // Look up by employee ID
      const { data, error } = await admin
        .from("engineers")
        .select("email, name")
        .ilike("emp_id", input)
        .single()

      if (error || !data) {
        return NextResponse.json(
          { error: "No account found with this Employee ID. Please contact your administrator." },
          { status: 404 }
        )
      }
      email = data.email
    }

    if (!email) {
      return NextResponse.json(
        { error: "No email address associated with this account. Please contact your administrator." },
        { status: 404 }
      )
    }

    // Generate a password reset link via Supabase Admin API
    const { data: linkData, error: linkError } =
      await admin.auth.admin.generateLink({
        type: "recovery",
        email,
        options: {
          redirectTo: `${req.headers.get("origin") || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/reset-password`,
        },
      })

    if (linkError || !linkData) {
      console.error("Generate link error:", linkError)
      return NextResponse.json(
        { error: "Failed to generate reset link. Please try again or contact your administrator." },
        { status: 500 }
      )
    }

    // Link directly to our reset-password page with the hashed token.
    // The page will use verifyOtp() to exchange the token for a session.
    const origin = req.headers.get("origin") || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
    const tokenHash = linkData.properties.hashed_token
    const resetLink = `${origin}/reset-password?token_hash=${encodeURIComponent(tokenHash)}&type=recovery`

    // Send the email via Resend
    const { error: emailError } = await resend.emails.send({
      from: "PSB Earthing Survey <onboarding@resend.dev>",
      to: email,
      subject: "Reset your password — PSB Earthing Survey",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
          <div style="text-align: center; margin-bottom: 32px;">
            <div style="display: inline-block; width: 48px; height: 48px; border-radius: 12px; background: #027D3F; line-height: 48px; text-align: center;">
              <span style="color: white; font-size: 20px; font-weight: bold;">⚡</span>
            </div>
          </div>
          <h2 style="color: #1a1a1a; font-size: 22px; font-weight: 700; margin: 0 0 8px 0; text-align: center;">
            Reset your password
          </h2>
          <p style="color: #666; font-size: 14px; line-height: 1.6; text-align: center; margin: 0 0 28px 0;">
            We received a request to reset the password for your PSB Earthing Survey account. Click the button below to set a new password.
          </p>
          <div style="text-align: center; margin-bottom: 28px;">
            <a href="${resetLink}"
               style="display: inline-block; padding: 14px 36px; background: #027D3F; color: white; text-decoration: none; border-radius: 10px; font-size: 14px; font-weight: 600;">
              Reset Password
            </a>
          </div>
          <p style="color: #999; font-size: 12px; line-height: 1.5; text-align: center; margin: 0 0 8px 0;">
            This link will expire in 60 minutes. If you didn't request a password reset, you can safely ignore this email.
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
          <p style="color: #bbb; font-size: 11px; text-align: center; margin: 0;">
            PSB Earthing Survey · Structure India
          </p>
        </div>
      `,
    })

    if (emailError) {
      console.error("Resend email error:", emailError)
      return NextResponse.json(
        { error: "Failed to send reset email. Please try again or contact your administrator." },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Forgot password error:", err)
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    )
  }
}
