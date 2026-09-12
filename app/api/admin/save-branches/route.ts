import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import * as XLSX from "xlsx";

export async function POST(request: Request) {
  try {
    const { branches, deletedBics, surveyUpdates, scheduleRows } = await request.json();

    if (!branches || !Array.isArray(branches)) {
      return NextResponse.json(
        { error: "Invalid data format. Expected an array of branches." },
        { status: 400 }
      );
    }

    const supabaseAdmin = createAdminClient();

    // Upsert branches
    const { error: upsertError } = await supabaseAdmin
      .from("branches")
      .upsert(branches, { onConflict: "bic" });

    if (upsertError) {
      console.error("Supabase upsert error:", upsertError);
      return NextResponse.json({ error: upsertError.message }, { status: 500 });
    }

    // Update surveys if provided
    if (surveyUpdates && Array.isArray(surveyUpdates) && surveyUpdates.length > 0) {
      for (const update of surveyUpdates) {
        if (!update.bic || !update.surveyor_emp_id) continue;
        
        const { error: surveyErr } = await supabaseAdmin
          .from("surveys")
          .update({
            surveyor_emp_id: update.surveyor_emp_id,
            surveyor_name: update.surveyor_name,
            surveyor_email: update.surveyor_email
          })
          .eq("bic", update.bic);
          
        if (surveyErr) console.warn("Failed to update survey for", update.bic, surveyErr);
      }
    }

    // Delete branches if requested
    if (deletedBics && Array.isArray(deletedBics) && deletedBics.length > 0) {
      const { error: deleteError } = await supabaseAdmin
        .from("branches")
        .delete()
        .in("bic", deletedBics);
        
      if (deleteError) {
        console.error("Supabase delete error:", deleteError);
        return NextResponse.json({ error: deleteError.message }, { status: 500 });
      }
    }

    // Generate and upload Excel schedule server-side
    if (scheduleRows && Array.isArray(scheduleRows) && scheduleRows.length > 0) {
      const headers = ["Branch Code", "Address", "State", "District", "ZO", "Date", "Spd", "Earthing"];
      const aoa: any[][] = [headers];
      
      for (const r of scheduleRows) {
        aoa.push([
          r.bic ?? "",
          r.address ?? "",
          r.state ?? "",
          r.district ?? "",
          r.zone ?? "",
          r.date ?? "",
          r.spd ?? "",
          r.earthing ?? ""
        ]);
      }

      const worksheet = XLSX.utils.aoa_to_sheet(aoa);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
      const buffer = Buffer.from(XLSX.write(workbook, { bookType: "xlsx", type: "buffer" }));

      const { error: uploadError } = await supabaseAdmin.storage
        .from("schedules")
        .upload("schedule.xlsx", buffer, { 
          upsert: true, 
          contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          cacheControl: "0" 
        });
      
      if (uploadError) {
        console.error("Supabase upload error:", uploadError);
        return NextResponse.json({ error: uploadError.message }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Save branches error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
