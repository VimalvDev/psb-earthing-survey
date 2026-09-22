const https = require('https');
require('dotenv').config({ path: '.env.local' });

https.get(process.env.NEXT_PUBLIC_SUPABASE_URL + '/rest/v1/', {
  headers: { 'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY }
}, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    const json = JSON.parse(data);
    console.log(Object.keys(json));
  });
});
