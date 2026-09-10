const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase.storage.createBucket('schedules', {
    public: true,
    fileSizeLimit: 5242880, // 5MB
    allowedMimeTypes: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel']
  });
  if (error) console.error("Error:", error);
  else console.log("Created bucket:", data);

  // Upload initial file
  const fs = require('fs');
  const fileBuffer = fs.readFileSync('/Users/vimalverma/Documents/Projects/psb_survey/public/other-branch-dates-added.xlsx');
  const { data: uploadData, error: uploadError } = await supabase.storage.from('schedules').upload('schedule.xlsx', fileBuffer, {
    upsert: true,
    contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
  if (uploadError) console.error("Upload Error:", uploadError);
  else console.log("Uploaded initial schedule:", uploadData);
}
run();
