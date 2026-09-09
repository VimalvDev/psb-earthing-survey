const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
  const { data, error } = await supabase.from('engineers').select('email, gmail').limit(1);
  if (error) {
    console.error("DB Error:", error.message);
  } else {
    console.log("Success! Gmail column exists. Sample data:", data);
  }
}
run();
