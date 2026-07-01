const { createClient } = require("@supabase/supabase-js");

const url = "https://wkygqwebmsxlcigkyhxw.supabase.co";
const key = "sb_publishable_FZNZTzSXL4NZokN6EVrPkA_Awhxiw7V";

const supabase = createClient(url, key);

async function updateSchema() {
  try {
    console.log("Updating table schema...");
    
    // This SQL will:
    // 1. Add body column (optional, nullable)
    // 2. Add NOT NULL constraint to title
    const sql = `
      -- Add body column if it doesn't exist
      ALTER TABLE notes
      ADD COLUMN IF NOT EXISTS body text;
      
      -- Make title required (NOT NULL)
      ALTER TABLE notes
      ALTER COLUMN title SET NOT NULL;
    `;
    
    const { data, error } = await supabase.rpc('execute_sql', { sql });
    
    if (error) {
      console.error("Error:", error);
      process.exit(1);
    }
    
    console.log("✓ Table schema updated successfully!");
    
    // Verify the schema
    const { data: columns, error: schemaError } = await supabase.rpc('get_columns', {});
    console.log("Current schema:", columns);
    
  } catch (err) {
    console.error("Exception:", err);
    process.exit(1);
  }
}

updateSchema();
