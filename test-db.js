const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
(async () => {
  const { data, error } = await supabase.from('surveys').select('*').order('created_at', { ascending: false }).limit(1);
  if (error) console.error(error);
  else console.log(Object.keys(data[0]));
})();
