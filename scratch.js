require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function run() {
  const { data, error } = await supabase.from('branches').select('*').limit(1);
  if (error) {
    console.error("No branches table or error:", error);
  } else {
    console.log("Branches table exists, rows:", data.length);
  }
}
run();
