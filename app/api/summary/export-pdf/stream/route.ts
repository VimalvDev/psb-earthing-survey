import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { PDFDocument } from "pdf-lib";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const year = url.searchParams.get("year");

  if (!year) {
    return new NextResponse("No year provided", { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { data: profile } = await supabase
    .from("engineers")
    .select("allowed_years")
    .or(`email.eq.${user.email},gmail.eq.${user.email}`)
    .single();

  if (!profile) return new NextResponse("Profile not found", { status: 403 });

  if (profile.allowed_years && profile.allowed_years.length > 0) {
    if (!profile.allowed_years.includes(year)) {
      return new NextResponse("Not authorized for year", { status: 403 });
    }
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (data: any) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch (e) {
          // Stream might be closed
        }
      };

      try {
        sendEvent({ phase: "checking-cache" });

        const admin = createAdminClient();
        
        // Ensure bucket exists
        const { data: buckets } = await admin.storage.listBuckets();
        if (!buckets?.find(b => b.name === "report-pdfs")) {
          await admin.storage.createBucket("report-pdfs", { public: false });
        }

        // Fetch fingerprint
        const { data: surveys, error: surveysErr } = await admin
          .from("surveys")
          .select("id, updated_at, created_at, site_photo, bic, branch_id, branches(branch_category)")
          .eq("financial_year", year);

        if (surveysErr) throw surveysErr;

        if (!surveys || surveys.length === 0) {
          sendEvent({ phase: "error", error: `No matching surveys for FY ${year}` });
          controller.close();
          return;
        }

        // Filter to surveys with photos
        const surveysWithPhotos = surveys.filter(r => 
          r.site_photo && (typeof r.site_photo === "string" || r.site_photo.form || r.site_photo.site || r.site_photo.other)
        );

        if (surveysWithPhotos.length === 0) {
          sendEvent({ phase: "error", error: `No report images found for FY ${year}.` });
          controller.close();
          return;
        }

        const count = surveys.length;
        const maxUpdated = surveys.reduce((max, s) => {
          const t = new Date(s.updated_at || s.created_at || 0).getTime();
          return t > max ? t : max;
        }, 0);
        
        const fingerprint = `${count}_${maxUpdated}`;
        const pdfPath = `${year}/${fingerprint}.pdf`;
        const progressPath = `${year}/progress_${fingerprint}.json`;

        // Check if PDF exists
        const { data: fileMetadata, error: fileErr } = await admin.storage
          .from("report-pdfs")
          .info(pdfPath); // info doesn't always exist, let's use list or just try to create signed url

        // Actually, to check if it exists reliably:
        const { data: listData } = await admin.storage.from("report-pdfs").list(year, { search: `${fingerprint}.pdf` });
        const exists = listData && listData.length > 0 && listData[0].name === `${fingerprint}.pdf`;

        if (exists) {
          // Cache hit
          const { data: signedData } = await admin.storage.from("report-pdfs").createSignedUrl(pdfPath, 60 * 60);
          sendEvent({ phase: "ready", downloadUrl: signedData?.signedUrl });
          controller.close();
          return;
        }

        // Cache miss. Check if generation is active.
        const checkActive = await admin.storage.from("report-pdfs").download(progressPath);
        if (checkActive.data) {
          const text = await checkActive.data.text();
          try {
            const prog = JSON.parse(text);
            const isStale = Date.now() - prog.timestamp > 60000; // 1 min stale
            if (!isStale && prog.status !== "failed" && prog.status !== "ready") {
              // Another worker is generating. We should poll this file and stream to client.
              let polling = true;
              while (polling) {
                await new Promise(r => setTimeout(r, 2000));
                const pData = await admin.storage.from("report-pdfs").download(progressPath);
                if (pData.data) {
                  const pText = await pData.data.text();
                  const pJson = JSON.parse(pText);
                  sendEvent({ phase: "processing", processedReports: pJson.processed, totalReports: pJson.total });
                  if (pJson.status === "ready") {
                    const { data: signedData } = await admin.storage.from("report-pdfs").createSignedUrl(pdfPath, 60 * 60);
                    sendEvent({ phase: "ready", downloadUrl: signedData?.signedUrl });
                    polling = false;
                  } else if (pJson.status === "failed") {
                    sendEvent({ phase: "error", error: "Generation failed by another worker" });
                    polling = false;
                  }
                } else {
                  // File disappeared?
                  polling = false;
                }
              }
              controller.close();
              return;
            }
          } catch (e) {}
        }

        // Become the worker
        sendEvent({ phase: "preparing", totalReports: surveysWithPhotos.length });

        // Update progress in storage periodically
        let processedCount = 0;
        const totalCount = surveysWithPhotos.length;

        const updateStorageProgress = async (statusStr: string) => {
          const payload = JSON.stringify({
            status: statusStr,
            processed: processedCount,
            total: totalCount,
            timestamp: Date.now()
          });
          await admin.storage.from("report-pdfs").upload(progressPath, payload, { upsert: true, contentType: "application/json", cacheControl: "0" });
        };

        await updateStorageProgress("processing");
        const progressInterval = setInterval(() => {
          updateStorageProgress("processing").catch(() => {});
        }, 3000);

        try {
          // Sort
          surveysWithPhotos.sort((a: any, b: any) => {
            const catA = a.branches?.branch_category || "";
            const catB = b.branches?.branch_category || "";
            if (catA === "existing_amc" && catB !== "existing_amc") return -1;
            if (catA !== "existing_amc" && catB === "existing_amc") return 1;
            return (a.bic || "").localeCompare(b.bic || "");
          });

          const pdfDoc = await PDFDocument.create();

          const fetchImageBytes = async (url: string) => {
            try {
              const res = await fetch(url);
              if (!res.ok) return null;
              return await res.arrayBuffer();
            } catch {
              return null;
            }
          };

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
              const imgBytes = await fetchImageBytes(url);
              if (!imgBytes) continue;

              let pdfImage;
              try {
                if (url.toLowerCase().endsWith('.png') || new Uint8Array(imgBytes)[0] === 0x89) {
                  pdfImage = await pdfDoc.embedPng(imgBytes);
                } else {
                  pdfImage = await pdfDoc.embedJpg(imgBytes);
                }
              } catch (err) {
                continue;
              }

              const page = pdfDoc.addPage([595.28, 841.89]);
              const imgDims = pdfImage.scaleToFit(595.28, 841.89);
              page.drawImage(pdfImage, {
                x: (595.28 - imgDims.width) / 2,
                y: (841.89 - imgDims.height) / 2,
                width: imgDims.width,
                height: imgDims.height,
              });
            }

            processedCount++;
            sendEvent({ phase: "processing", processedReports: processedCount, totalReports: totalCount });
          }

          sendEvent({ phase: "finalizing" });

          const pdfBytes = await pdfDoc.save();
          
          await admin.storage.from("report-pdfs").upload(pdfPath, pdfBytes, {
            contentType: "application/pdf",
            upsert: true,
            cacheControl: "31536000"
          });

          clearInterval(progressInterval);
          await updateStorageProgress("ready");

          const { data: signedData } = await admin.storage.from("report-pdfs").createSignedUrl(pdfPath, 60 * 60);
          sendEvent({ phase: "ready", downloadUrl: signedData?.signedUrl });

        } catch (err: any) {
          clearInterval(progressInterval);
          await updateStorageProgress("failed");
          sendEvent({ phase: "error", error: "Generation failed" });
        }

      } catch (err: any) {
        sendEvent({ phase: "error", error: err.message });
      } finally {
        controller.close();
      }
    }
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive"
    }
  });
}
