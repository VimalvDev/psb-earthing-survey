require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function run() {
  const { data: surveys } = await supabase.from('surveys').select('bic');
  const { data: branches } = await supabase.from('branches').select('bic');
  
  let uniqueSurveyBics = new Set(surveys.map(s => s.bic));
  let uniqueUpperSurveyBics = new Set(surveys.map(s => s.bic ? s.bic.toUpperCase() : ''));
  console.log("Total surveys:", surveys.length);
  console.log("Unique bics in surveys (case sensitive):", uniqueSurveyBics.size);
  console.log("Unique bics in surveys (upper case):", uniqueUpperSurveyBics.size);
  
  let branchBics = new Set(branches.map(b => b.bic ? b.bic.toUpperCase() : ''));
  let matched = [...uniqueUpperSurveyBics].filter(b => branchBics.has(b));
  console.log("Survey bics that match branches table:", matched.length);
}
run();
