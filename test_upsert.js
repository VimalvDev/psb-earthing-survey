require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
  const { data, error } = await supabase.from('branches').upsert({
    bic: 'TEST-BIC-UPSERT',
    address: 'Test Address',
    district: 'TEST',
    state: 'TEST',
    zone: 'TEST',
    branch_name: 'TEST NAME'
  }, { onConflict: 'bic' }).select();
  console.log("Error:", error);
  console.log("Data:", data);
  if (!error) {
     await supabase.from('branches').delete().eq('bic', 'TEST-BIC-UPSERT');
  }
}
run();
