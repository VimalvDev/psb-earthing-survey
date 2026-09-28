import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import JSZip from "jszip";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const CONCURRENCY = 25;

// ─── Module-level ZIP cache (survives across requests in the same process) ───
interface CachedZip {
  buffer: Buffer;
  timestamp: number;
}
const zipCache = new Map<string, CachedZip>();

// Clean entries older than 10 minutes
function cleanCache() {
  const now = Date.now();
  for (const [key, entry] of zipCache) {
    if (now - entry.timestamp > 600_000) zipCache.delete(key);
  }
}

// ─── GET with ?action=download&year=... → serve cached ZIP ───
// ─── GET with ?year=... (SSE) → build ZIP with progress ───
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const year = url.searchParams.get("year");
  const action = url.searchParams.get("action");

  if (!year) return new Response("No year provided", { status: 400 });

  // Auth
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { data: profile } = await supabase
    .from("engineers")
    .select("allowed_years")
    .or(`email.eq.${user.email},gmail.eq.${user.email}`)
    .single();

  if (profile?.allowed_years && profile.allowed_years.length > 0) {
    if (!profile.allowed_years.includes(year)) {
      return new Response("Not authorized for year", { status: 403 });
    }
  }

  // ─── DOWNLOAD: serve cached ZIP ───
  if (action === "download") {
    cleanCache();
    const cached = zipCache.get(year);
    if (!cached) {
      return new Response("ZIP not ready. Please generate it first.", { status: 404 });
    }
    const uint8 = new Uint8Array(cached.buffer);
    return new Response(uint8, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="psb-earthing-reports-${year}.zip"`,
        "Content-Length": String(uint8.length),
      },
    });
  }

  // ─── SSE: build ZIP with progress ───
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: any) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch {}
      };

      try {
        const admin = createAdminClient();
        send({ phase: "preparing", processed: 0, total: 0 });

        // Fetch surveys
        let surveysData: any[] = [];
        let fromS = 0;
        while (true) {
          const { data: sData, error } = await admin
            .from("surveys")
            .select("id, bic, site_photo")
            .eq("financial_year", year)
            .order("bic", { ascending: true })
            .range(fromS, fromS + 999);
          if (error) {
            send({ phase: "error", error: "Failed to fetch surveys: " + error.message });
            controller.close();
            return;
          }
          surveysData = surveysData.concat(sData || []);
          if (!sData || sData.length < 1000) break;
          fromS += 1000;
        }

        // Build flat image task list
        interface ImageTask { bic: string; url: string; label: string; }
        const tasks: ImageTask[] = [];
        for (const s of surveysData) {
          if (!s.site_photo) continue;
          const bic = String(s.bic || "unknown").trim().toUpperCase();
          if (typeof s.site_photo === "string") {
            tasks.push({ bic, url: s.site_photo, label: "" });
          } else {
            if (s.site_photo.form) tasks.push({ bic, url: s.site_photo.form, label: "form" });
            if (s.site_photo.site) tasks.push({ bic, url: s.site_photo.site, label: "site" });
            if (s.site_photo.other) tasks.push({ bic, url: s.site_photo.other, label: "other" });
          }
        }

        const totalImages = tasks.length;
        if (totalImages === 0) {
          send({ phase: "error", error: "No report images found for this year" });
          controller.close();
          return;
        }

        send({ phase: "processing", processed: 0, total: totalImages });

        // Build ZIP with parallel fetching
        const zip = new JSZip();
        const folderName = `psb-report-${year}`;
        const folder = zip.folder(folderName)!;
        let completed = 0;

        const usedNames = new Set<string>();
        function getUniqueFilename(bic: string, label: string, imgUrl: string): string {
          const urlPath = imgUrl.split("?")[0];
          const urlFilename = urlPath.split("/").pop() || "";
          const extMatch = urlFilename.match(/\.(jpg|jpeg|png|webp|gif|bmp|tiff)$/i);
          const ext = extMatch ? extMatch[0].toLowerCase() : ".jpg";
          let base = label ? `${bic}-${label}` : bic;
          let name = `${base}${ext}`;
          let counter = 1;
          while (usedNames.has(name)) {
            name = `${base}-${counter}${ext}`;
            counter++;
          }
          usedNames.add(name);
          return name;
        }

        // Parallel fetch in batches
        for (let i = 0; i < tasks.length; i += CONCURRENCY) {
          const batch = tasks.slice(i, i + CONCURRENCY);
          const results = await Promise.allSettled(
            batch.map(async (task) => {
              const res = await fetch(task.url);
              if (!res.ok) return null;
              const buffer = await res.arrayBuffer();
              return { task, buffer };
            })
          );

          for (const result of results) {
            if (result.status === "fulfilled" && result.value) {
              const { task, buffer } = result.value;
              const filename = getUniqueFilename(task.bic, task.label, task.url);
              folder.file(filename, buffer);
            }
            completed++;
          }
          send({ phase: "processing", processed: completed, total: totalImages });
        }

        // Generate ZIP
        send({ phase: "finalizing", processed: completed, total: totalImages });
        const zipBuffer = await zip.generateAsync({ type: "nodebuffer", compression: "STORE" });

        // Cache it in memory for the download endpoint
        cleanCache();
        zipCache.set(year, { buffer: zipBuffer, timestamp: Date.now() });

        send({ phase: "ready", processed: completed, total: totalImages });
        controller.close();
      } catch (err: any) {
        send({ phase: "error", error: err.message || "Unknown error" });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
