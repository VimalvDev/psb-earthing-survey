const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });
const client = new Client({ connectionString: process.env.DATABASE_URL });
async function run() {
  await client.connect();
  await client.query('ALTER TABLE engineers ADD COLUMN IF NOT EXISTS gmail text;');
  console.log("Added gmail column successfully");
  await client.end();
}
run();
