import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import crypto from "crypto";
import JSZip from "jszip";

// Determine fingerprint
async function getFingerprint(admin: any, year: string) {
  const { data: surveys, error } = await admin
    .from("surveys")
    .select("id, updated_at, created_at")
    .eq("financial_year", year);
    
  if (error) throw error;
  
  const count = surveys?.length || 0;
  const maxUpdated = (surveys || []).reduce((max: number, s: any) => {
    const t = new Date(s.updated_at || s.created_at || 0).getTime();
    return t > max ? t : max;
  }, 0);
  
  const raw = `${count}_${maxUpdated}`;
  const hash = crypto.createHash('sha256').update(raw).digest('hex').substring(0, 16);
  return { fingerprint: hash, count, surveys };
}

// GET: Check progress / check if cached
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const year = url.searchParams.get("year");
  if (!year) return new NextResponse("No year provided", { status: 400 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const { data: profile } = await supabase
    .from("engineers")
    .select("allowed_years")
    .or(`email.eq.${user.email},gmail.eq.${user.email}`)
    .single();

  if (!profile) return new NextResponse("Profile not found", { status: 403 });
  if (profile.allowed_years && profile.allowed_years.length > 0) {
    if (!profile.allowed_years.includes(year)) return new NextResponse("Not authorized for year", { status: 403 });
  }

  const admin = createAdminClient();
  const { fingerprint } = await getFingerprint(admin, year);

  // 1. Check if the PDF/ZIP exists in storage (Fast cache hit)
  const zipPath = `${year}/${fingerprint}.zip`;
  const { data: listData } = await admin.storage.from("report-pdfs").list(year, { search: `${fingerprint}.zip` });
  const exists = listData && listData.length > 0 && listData[0].name === `${fingerprint}.zip`;

  if (exists) {
    const { data: signedData } = await admin.storage.from("report-pdfs").createSignedUrl(zipPath, 60 * 60, {
      download: `psb-earthing-reports-${year}.zip`
    });
    return NextResponse.json({
      jobId: null,
      status: "ready",
      phase: "ready",
      downloadUrl: signedData?.signedUrl
    });
  }

  // 2. Check export_jobs table
  const { data: job, error } = await admin.from("export_jobs")
    .select("*")
    .eq("export_type", "reports_zip")
    .eq("financial_year", year)
    .eq("fingerprint", fingerprint)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error || !job) {
    return NextResponse.json({ status: "missing" });
  }

  // Check if stale
  const heartbeatTime = new Date(job.last_heartbeat_at || job.updated_at).getTime();
  const isStale = Date.now() - heartbeatTime > 120000; // 2 mins

  if (job.status === "processing" && isStale) {
    return NextResponse.json({ status: "stale", jobId: job.id });
  }

  return NextResponse.json({
    jobId: job.id,
    status: job.status,
    phase: job.status,
    processedReports: job.processed_reports,
    totalReports: job.total_reports,
    processedFiles: job.processed_files,
    totalFiles: job.total_files,
    error: job.error_message
  });
}

// POST: Start generation
export async function POST(req: NextRequest) {
  const body = await req.json();
  const year = body.year;
  if (!year) return new NextResponse("No year provided", { status: 400 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const { data: profile } = await supabase
    .from("engineers")
    .select("allowed_years")
    .or(`email.eq.${user.email},gmail.eq.${user.email}`)
    .single();

  if (profile?.allowed_years && profile.allowed_years.length > 0) {
    if (!profile.allowed_years.includes(year)) return new NextResponse("Not authorized", { status: 403 });
  }

  const admin = createAdminClient();
  const { fingerprint, count } = await getFingerprint(admin, year);

  // Check existing active job
  const { data: existingJob } = await admin.from("export_jobs")
    .select("*")
    .eq("export_type", "reports_zip")
    .eq("financial_year", year)
    .eq("fingerprint", fingerprint)
    .in("status", ["processing"])
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (existingJob) {
    const heartbeatTime = new Date(existingJob.last_heartbeat_at || existingJob.updated_at).getTime();
    const isStale = Date.now() - heartbeatTime > 120000;
    if (!isStale) {
       return NextResponse.json({ jobId: existingJob.id, status: "processing" });
    }
  }

  // Check storage again just in case
  const zipPath = `${year}/${fingerprint}.zip`;
  const { data: listData } = await admin.storage.from("report-pdfs").list(year, { search: `${fingerprint}.zip` });
  if (listData && listData.length > 0 && listData[0].name === `${fingerprint}.zip`) {
    return NextResponse.json({ status: "ready" });
  }

  // Start new job
  const { data: newJob, error: insertError } = await admin.from("export_jobs").insert({
    export_type: "reports_zip",
    financial_year: year,
    fingerprint,
    status: "processing",
    total_reports: count,
    started_at: new Date().toISOString(),
    last_heartbeat_at: new Date().toISOString()
  }).select().single();

  if (insertError) {
    console.error("Export job insert error:", insertError);
    return NextResponse.json({ error: "Failed to create export job" }, { status: 500 });
  }

  // KICK OFF BACKGROUND PROMISE (detached)
  runExportJob(newJob.id, year, fingerprint, admin).catch(console.error);

  return NextResponse.json({ jobId: newJob.id, status: "processing" });
}

async function runExportJob(jobId: string, year: string, fingerprint: string, admin: any) {
  const updateJob = async (updates: any) => {
    await admin.from("export_jobs").update({ ...updates, updated_at: new Date().toISOString(), last_heartbeat_at: new Date().toISOString() }).eq("id", jobId);
  };

  try {
    const { data: buckets } = await admin.storage.listBuckets();
    if (!buckets?.find((b: any) => b.name === "report-pdfs")) {
      await admin.storage.createBucket("report-pdfs", { public: false });
    }

    const { data: surveys, error: surveysErr } = await admin
      .from("surveys")
      .select("id, bic, site_photo, branch_id, branches(branch_category)")
      .eq("financial_year", year);

    if (surveysErr) throw surveysErr;

    const surveysWithPhotos = (surveys || []).filter((r: any) => 
      r.site_photo && (typeof r.site_photo === "string" || r.site_photo.form || r.site_photo.site || r.site_photo.other)
    );

    surveysWithPhotos.sort((a: any, b: any) => {
      const catA = a.branches?.branch_category || "";
      const catB = b.branches?.branch_category || "";
      if (catA === "existing_amc" && catB !== "existing_amc") return -1;
      if (catA !== "existing_amc" && catB === "existing_amc") return 1;
      return (a.bic || "").localeCompare(b.bic || "");
    });

    let processedCount = 0;
    await updateJob({ total_reports: surveysWithPhotos.length });

    const zip = new JSZip();

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
          // url format is usually https://.../storage/v1/object/public/survey-photos/surveys_uuid/...
          // Just fetch the public URL
          const res = await fetch(url);
          if (!res.ok) continue;
          const buffer = await res.arrayBuffer();
          const fileName = url.split('/').pop() || 'image.jpg';
          zip.file(`${record.bic}/${fileName}`, buffer);
        } catch (e) {
          // ignore individual failure
        }
      }

      processedCount++;
      if (processedCount % 10 === 0) {
        await updateJob({ processed_reports: processedCount });
      }
    }

    await updateJob({ processed_reports: processedCount, status: "finalizing" });

    const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });
    const zipPath = `${year}/${fingerprint}.zip`;

    const { error: uploadError } = await admin.storage.from("report-pdfs").upload(zipPath, zipBuffer, {
      contentType: "application/zip",
      upsert: true,
      cacheControl: "31536000"
    });

    if (uploadError) throw uploadError;

    await updateJob({ status: "ready", completed_at: new Date().toISOString(), storage_path: zipPath });

  } catch (err: any) {
    await updateJob({ status: "error", error_message: err.message || "Unknown error" });
  }
}
