require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function run() {
  const { data, error } = await supabase.from('surveys').insert({
    survey_id: 'TEST-123',
    surveyor_name: 'Test',
    surveyor_mobile: '1234'
  }).select();
  console.log(error || data);
}
run();
