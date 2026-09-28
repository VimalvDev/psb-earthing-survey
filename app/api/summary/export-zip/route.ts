import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import JSZip from "jszip";

// POST: Build ZIP and stream it back directly
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const year = body.year;
    if (!year) return NextResponse.json({ error: "No year provided" }, { status: 400 });

    // Auth check
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: profile } = await supabase
      .from("engineers")
      .select("allowed_years")
      .or(`email.eq.${user.email},gmail.eq.${user.email}`)
      .single();

    if (profile?.allowed_years && profile.allowed_years.length > 0) {
      if (!profile.allowed_years.includes(year)) {
        return NextResponse.json({ error: "Not authorized for year" }, { status: 403 });
      }
    }

    const admin = createAdminClient();

    // Fetch surveys with photos for the selected FY
    let surveysData: any[] = [];
    let fromS = 0;
    while (true) {
      const { data: sData, error } = await admin
        .from("surveys")
        .select("id, bic, site_photo, branch_id, branches(branch_category)")
        .eq("financial_year", year)
        .order("bic", { ascending: true })
        .range(fromS, fromS + 999);
      if (error) {
        console.error("Failed to fetch surveys for ZIP:", error);
        return NextResponse.json({ error: "Failed to fetch surveys" }, { status: 500 });
      }
      surveysData = surveysData.concat(sData || []);
      if (!sData || sData.length < 1000) break;
      fromS += 1000;
    }

    // Filter to surveys that actually have photos
    const surveysWithPhotos = surveysData.filter((r: any) =>
      r.site_photo && (
        typeof r.site_photo === "string" ||
        r.site_photo.form ||
        r.site_photo.site ||
        r.site_photo.other
      )
    );

    // Sort: existing_amc first, then by BIC
    surveysWithPhotos.sort((a: any, b: any) => {
      const catA = a.branches?.branch_category || "";
      const catB = b.branches?.branch_category || "";
      if (catA === "existing_amc" && catB !== "existing_amc") return -1;
      if (catA !== "existing_amc" && catB === "existing_amc") return 1;
      return (a.bic || "").localeCompare(b.bic || "");
    });

    if (surveysWithPhotos.length === 0) {
      return NextResponse.json({ error: "No reports with images found for this year" }, { status: 404 });
    }

    // Build ZIP
    const zip = new JSZip();
    let fetchedCount = 0;
    let failedCount = 0;

    for (const record of surveysWithPhotos) {
      const photos: string[] = [];
      if (typeof record.site_photo === "string") {
        photos.push(record.site_photo);
      } else {
        if (record.site_photo.form) photos.push(record.site_photo.form);
        if (record.site_photo.site) photos.push(record.site_photo.site);
        if (record.site_photo.other) photos.push(record.site_photo.other);
      }

      for (const url of photos) {
        try {
          const res = await fetch(url);
          if (!res.ok) {
            failedCount++;
            continue;
          }
          const buffer = await res.arrayBuffer();
          // Extract a meaningful filename from the URL
          const urlParts = url.split('/');
          const fileName = urlParts[urlParts.length - 1] || `image-${fetchedCount}.jpg`;
          const bic = String(record.bic || "unknown").trim().toUpperCase();
          zip.file(`${bic}/${fileName}`, buffer);
          fetchedCount++;
        } catch {
          failedCount++;
        }
      }
    }

    if (fetchedCount === 0) {
      return NextResponse.json({ error: "Could not download any report images" }, { status: 500 });
    }

    // Generate the ZIP buffer
    const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });

    // Return directly as a binary download
    const uint8 = new Uint8Array(zipBuffer);
    return new NextResponse(uint8, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="psb-earthing-reports-${year}.zip"`,
        "Content-Length": String(uint8.length),
      },
    });
  } catch (err: any) {
    console.error("Export ZIP error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
