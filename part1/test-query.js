const { createClient } = require("@supabase/supabase-js");

const url = "https://wkygqwebmsxlcigkyhxw.supabase.co";
const key = "sb_publishable_FZNZTzSXL4NZokN6EVrPkA_Awhxiw7V";

const supabase = createClient(url, key);

async function testQuery() {
  try {
    console.log("Attempting to query the 'notes' table...");
    const { data, error } = await supabase.from("notes").select();
    
    if (error) {
      console.error("Error:", error);
      process.exit(1);
    }
    
    if (data) {
      console.log("✓ Successfully queried the notes table!");
      console.log(`Found ${data.length} records:`);
      console.log(JSON.stringify(data, null, 2));
    }
  } catch (err) {
    console.error("Exception:", err);
    process.exit(1);
  }
}

testQuery();
