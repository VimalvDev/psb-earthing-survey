require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  console.log("Starting cleanup...");
  
  // 1. Get all survey_ids from the database
  const { data: surveys, error: dbError } = await supabase.from('surveys').select('survey_id');
  if (dbError) {
    console.error("DB Error:", dbError);
    return;
  }
  
  const activeSurveyIds = new Set(surveys.map(s => s.survey_id));
  console.log(`Found ${activeSurveyIds.size} active surveys in DB.`);

  // 2. List all folders in the root of 'survey-photos'
  const { data: folders, error: listError } = await supabase.storage.from('survey-photos').list();
  if (listError) {
    console.error("Storage list error:", listError);
    return;
  }

  let deletedCount = 0;

  // 3. Check each folder
  for (const folder of folders) {
    // Folders might just be items without a '.' in the name, but list() returns metadata
    if (!folder.name || folder.name === '.emptyFolderPlaceholder') continue;
    
    if (!activeSurveyIds.has(folder.name)) {
      console.log(`Orphaned folder found: ${folder.name}. Deleting contents...`);
      
      // List contents of this folder
      const { data: files } = await supabase.storage.from('survey-photos').list(folder.name);
      
      if (files && files.length > 0) {
        // Prepare paths to delete
        const pathsToDelete = files.map(f => `${folder.name}/${f.name}`);
        const { error: removeError } = await supabase.storage.from('survey-photos').remove(pathsToDelete);
        
        if (removeError) {
          console.error(`Failed to delete files in ${folder.name}:`, removeError);
        } else {
          console.log(`Deleted ${pathsToDelete.length} files from ${folder.name}`);
          deletedCount += pathsToDelete.length;
        }
      } else {
        console.log(`Folder ${folder.name} is already empty.`);
      }
    }
  }

  console.log(`Cleanup complete! Deleted ${deletedCount} orphaned files.`);
}

run();
