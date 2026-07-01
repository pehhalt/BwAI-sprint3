const { createClient } = require("@supabase/supabase-js");

const url = "https://wkygqwebmsxlcigkyhxw.supabase.co";
const key = "sb_publishable_FZNZTzSXL4NZokN6EVrPkA_Awhxiw7V";

const supabase = createClient(url, key);

async function checkNotes() {
  try {
    const { data, error } = await supabase.from("notes").select();
    
    if (error) {
      console.error("Error:", error);
      process.exit(1);
    }
    
    console.log(`Total rows: ${data.length}\n`);
    data.forEach((note, i) => {
      console.log(`${i + 1}. "${note.title}" → "${note.body}"`);
    });
    
  } catch (err) {
    console.error("Exception:", err);
    process.exit(1);
  }
}

checkNotes();
