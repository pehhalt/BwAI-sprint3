const { createClient } = require("@supabase/supabase-js");

const url = "https://wkygqwebmsxlcigkyhxw.supabase.co";
const key = "sb_publishable_FZNZTzSXL4NZokN6EVrPkA_Awhxiw7V";

const supabase = createClient(url, key);

async function seedNotes() {
  try {
    console.log("Inserting seed data...");
    
    const { data, error } = await supabase.from("notes").insert([
      { title: "Shopping list", body: "Milk, eggs, bread" },
      { title: "Meeting notes", body: "Discussed Q2 priorities" },
      { title: "Ideas", body: "Redesign the onboarding flow" }
    ]);
    
    if (error) {
      console.error("Error:", error);
      process.exit(1);
    }
    
    console.log("✓ Seed data inserted successfully!");
    
    // Verify the data
    const { data: allNotes, error: selectError } = await supabase.from("notes").select();
    
    if (selectError) {
      console.error("Error verifying:", selectError);
      process.exit(1);
    }
    
    console.log(`\nNotes table now contains ${allNotes.length} records:`);
    allNotes.forEach((note, i) => {
      console.log(`  ${i + 1}. "${note.title}" → "${note.body}"`);
    });
    
  } catch (err) {
    console.error("Exception:", err);
    process.exit(1);
  }
}

seedNotes();
