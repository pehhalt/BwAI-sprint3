"use server";

import {
  getNotes,
  searchNotes,
  createNote,
  updateNote,
  deleteNote,
  type Note,
} from "@/app/lib/db";

export async function getNotesAction(): Promise<Note[]> {
  return getNotes();
}

export async function searchNotesAction(query: string): Promise<Note[]> {
  return searchNotes(query);
}

export async function createNoteAction(
  title: string,
  body: string,
  collectionId?: string | null
): Promise<Note> {
  return createNote(title, body, collectionId);
}

export async function updateNoteAction(
  id: string,
  fields: Partial<Pick<Note, "title" | "body" | "collection_id">>
): Promise<Note> {
  return updateNote(id, fields);
}

export async function deleteNoteAction(id: string): Promise<void> {
  return deleteNote(id);
}
