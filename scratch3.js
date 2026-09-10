require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function run() {
  // authenticate
  const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
    email: 'vimalverma8287@gmail.com', // wait I don't have the password, just use anon?
    password: 'password'
  });

  const getBranches = () => supabase.from('branches').select('bic');
  
  const page1 = await getBranches().range(0, 999);
  const page2 = await getBranches().range(1000, 1999);
  
  console.log("Page 1 length:", page1.data?.length, "Error:", page1.error);
  console.log("Page 2 length:", page2.data?.length, "Error:", page2.error);
}
run();
