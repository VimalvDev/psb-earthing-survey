import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const year = body.year;
    
    if (!year) {
      return NextResponse.json({ error: "No financial year provided" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("engineers")
      .select("allowed_years, role")
      .or(`email.eq.${user.email},gmail.eq.${user.email}`)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "User profile not found" }, { status: 403 });
    }

    if (profile.allowed_years && profile.allowed_years.length > 0) {
      if (!profile.allowed_years.includes(year)) {
        return NextResponse.json({ error: `Not authorized for FY ${year}` }, { status: 403 });
      }
    }

    // Fetch surveys
    const { data: surveys, error: surveysErr } = await supabase
      .from("surveys")
      .select(`
        id, survey_id, branch_id, bic, branch_name, state, district, zone, address, visit_date, overall_status, surveyor_emp_id, site_photo,
        branches ( branch_category )
      `)
      .eq("financial_year", year);

    if (surveysErr) throw surveysErr;

    if (!surveys || surveys.length === 0) {
      return NextResponse.json({ error: `No matching surveys for FY ${year}` }, { status: 404 });
    }

    // Filter to those with photos
    const surveysWithPhotos = surveys.filter((r: any) => 
      r.site_photo && (typeof r.site_photo === "string" || r.site_photo.form || r.site_photo.site || r.site_photo.other)
    );

    if (surveysWithPhotos.length === 0) {
      return NextResponse.json({ error: `No report images found for FY ${year}.` }, { status: 404 });
    }

    // Sort: Existing / AMC first, then New Installation, then BIC ascending
    surveysWithPhotos.sort((a: any, b: any) => {
      const catA = a.branches?.branch_category || "";
      const catB = b.branches?.branch_category || "";
      if (catA === "existing_amc" && catB !== "existing_amc") return -1;
      if (catA !== "existing_amc" && catB === "existing_amc") return 1;
      return (a.bic || "").localeCompare(b.bic || "");
    });

    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Fetch images with bounded concurrency logic
    const fetchImageBytes = async (url: string) => {
      try {
        const res = await fetch(url);
        if (!res.ok) return null;
        return await res.arrayBuffer();
      } catch {
        return null;
      }
    };

    let totalFailed = 0;

    for (const record of surveysWithPhotos) {
      const photos: string[] = [];
      if (typeof record.site_photo === "string") {
        photos.push(record.site_photo);
      } else {
        if (record.site_photo.form) photos.push(record.site_photo.form);
        if (record.site_photo.site) photos.push(record.site_photo.site);
        if (record.site_photo.other) photos.push(record.site_photo.other);
      }

      if (photos.length === 0) continue;

      for (const url of photos) {
        const imgBytes = await fetchImageBytes(url);
        if (!imgBytes) {
          totalFailed++;
          continue;
        }

        let pdfImage;
        try {
          // Very basic check for PNG signature vs JPEG
          if (url.toLowerCase().endsWith('.png') || new Uint8Array(imgBytes)[0] === 0x89) {
            pdfImage = await pdfDoc.embedPng(imgBytes);
          } else {
            pdfImage = await pdfDoc.embedJpg(imgBytes);
          }
        } catch (err) {
          totalFailed++;
          continue;
        }

        const page = pdfDoc.addPage([595.28, 841.89]); // A4 Size
        
        // Scale to fit full page
        const imgDims = pdfImage.scaleToFit(595.28, 841.89);
        
        page.drawImage(pdfImage, {
          x: (595.28 - imgDims.width) / 2,
          y: (841.89 - imgDims.height) / 2,
          width: imgDims.width,
          height: imgDims.height,
        });
      }
    }

    const pdfBytes = await pdfDoc.save();
    
    return new NextResponse(pdfBytes as any, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="psb-earthing-reports-${year}.pdf"`,
      },
    });
  } catch (err: any) {
    console.error("PDF Export error:", err);
    return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 });
  }
}
