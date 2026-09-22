const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
  const { error } = await supabase.rpc('execute_sql', { sql: 'ALTER TABLE engineers ADD COLUMN IF NOT EXISTS gmail text;' });
  if (error) {
    console.log("RPC failed, trying direct query if possible or we'll need to do it via supabase CLI");
    console.error(error);
  } else {
    console.log("Added gmail column successfully");
  }
}
run();
