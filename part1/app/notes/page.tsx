"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

export default function NotesPage() {
  const [notes, setNotes] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotes = async () => {
      const supabase = createClient();
      const { data } = await supabase.from("notes").select();
      setNotes(data);
      setLoading(false);
    };
    fetchNotes();
  }, []);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg">Loading...</p>
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-12 text-slate-900">
          Notes
        </h1>

        {notes && notes.length > 0 ? (
          <div className="space-y-4">
            {notes.map((note) => (
              <div
                key={note.id}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <h2 className="text-xl font-semibold text-slate-800 mb-2">
                  {note.title}
                </h2>
                <p className="text-slate-600">{note.body}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-slate-500 text-lg">No notes found</p>
          </div>
        )}
      </div>
    </div>
  );
}
