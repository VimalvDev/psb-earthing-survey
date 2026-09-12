const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
(async () => {
  const { data, error } = await supabase.rpc('get_column_info', { table_name: 'surveys' }); // Wait, RPC might not exist.
  // Instead, just fetch one row and type check
  const { data: row } = await supabase.from('surveys').select('site_photo').not('site_photo', 'is', null).limit(1);
  if (row && row.length > 0) {
    console.log(typeof row[0].site_photo, Array.isArray(row[0].site_photo) ? 'array' : 'not array', row[0].site_photo);
  } else {
    console.log("No site_photo found");
  }
})();
