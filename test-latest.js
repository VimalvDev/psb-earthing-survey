const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
(async () => {
  const { data } = await supabase.from('surveys').select('id, bic, site_photo, surveyor_name, manager_name').order('created_at', { ascending: false }).limit(3);
  console.log(JSON.stringify(data, null, 2));
})();
