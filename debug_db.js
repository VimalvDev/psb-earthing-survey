const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
  const { data: users, error: authError } = await supabase.auth.admin.listUsers();
  const emails = users.users.map(u => u.email);
  console.log("Auth Emails:", emails);
  
  const { data: engineers, error: engError } = await supabase.from('engineers').select('*');
  console.log("Engineers:", engineers.map(e => ({ email: e.email, gmail: e.gmail, name: e.name })));
}
run();
