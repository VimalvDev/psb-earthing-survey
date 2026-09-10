require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data, error } = await supabase
    .from('surveys')
    .select('id, bic, branch_name, visit_date, surveyor_name, created_at')
    .gte('visit_date', '2026-04-01')
    .lte('visit_date', '2027-03-31')
    .order('created_at', { ascending: false });

  if (error) {
    console.error(error);
    return;
  }

  const grouped = {};
  for (const s of data) {
    if (!s.bic) continue;
    const nbic = s.bic.trim().toUpperCase();
    if (!grouped[nbic]) grouped[nbic] = [];
    grouped[nbic].push(s);
  }

  const duplicates = Object.entries(grouped).filter(([k, v]) => v.length > 1);
  
  if (duplicates.length === 0) {
    console.log("No duplicates found!");
    return;
  }

  console.log(`Found ${duplicates.length} branches with duplicate entries:\n`);
  
  for (const [bic, records] of duplicates) {
    console.log(`===========================================`);
    console.log(`Branch Code: ${bic} (${records[0].branch_name})`);
    console.log(`Duplicate Entries: ${records.length}`);
    records.forEach((r, i) => {
      console.log(`  [${i === 0 ? "NEWEST" : "OLDER "}] Date: ${r.visit_date} | Surveyor: ${r.surveyor_name || "N/A"} | Created: ${r.created_at}`);
    });
  }
}

run();
