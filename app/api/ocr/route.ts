import { NextRequest, NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"

// POST /api/ocr
// Body: { image: string (base64), mimeType: string }
// Returns: { fields: Record<string, string> }

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY, // set in .env.local
})

const OCR_PROMPT = `You are reading a handwritten or printed earthing survey form for a bank branch inspection.
Extract the following fields from the image. If a field is not visible or unclear, return an empty string for it.

Return ONLY a valid JSON object with exactly these keys:
{
  "bic": "",
  "branch_name": "",
  "zone": "",
  "district": "",
  "state": "",
  "manager_name": "",
  "phone_no": "",
  "visit_date": "",
  "survey_type": "",
  "ep1_reading": "",
  "ep2_reading": "",
  "ep3_reading": "",
  "ep4_reading": "",
  "remarks": "",
  "overall_status": ""
}

For visit_date, use YYYY-MM-DD format.
For overall_status, use only: "Pass", "Partial", "Fail", or "".
For ep readings, return numeric values only (e.g. "0.8"), or "" if not found.
Do not add any explanation, markdown, or text outside the JSON object.`

export async function POST(req: NextRequest) {
  try {
    const { image, mimeType } = await req.json()

    if (!image || !mimeType) {
      return NextResponse.json({ error: "Missing image or mimeType" }, { status: 400 })
    }

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mimeType as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
                data: image,
              },
            },
            {
              type: "text",
              text: OCR_PROMPT,
            },
          ],
        },
      ],
    })

    const text = response.content[0].type === "text" ? response.content[0].text : ""

    // Safely parse JSON — Claude may occasionally add whitespace
    let fields: Record<string, string> = {}
    try {
      fields = JSON.parse(text.trim())
    } catch {
      return NextResponse.json({ error: "OCR parse failed", raw: text }, { status: 422 })
    }

    return NextResponse.json({ fields })
  } catch (err) {
    console.error("[OCR] Error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}