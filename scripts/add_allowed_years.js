require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
  const { data, error } = await supabase.rpc('exec_sql', { sql: "ALTER TABLE engineers ADD COLUMN allowed_years text[] DEFAULT '{}'::text[];" });
  console.log("Error:", error);
  console.log("Data:", data);
}
run();
