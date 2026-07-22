"use server";

import {
  getTags,
  getNoteTags,
  addTagToNoteByName,
  removeTagFromNote,
  type Tag,
} from "@/app/lib/db";

export async function getTagsAction(): Promise<Tag[]> {
  return getTags();
}

export async function getNoteTagsAction(): Promise<{ note_id: string; tag: Tag }[]> {
  return getNoteTags();
}

export async function addTagToNoteByNameAction(noteId: string, name: string): Promise<Tag> {
  return addTagToNoteByName(noteId, name);
}

export async function removeTagFromNoteAction(noteId: string, tagId: string): Promise<void> {
  return removeTagFromNote(noteId, tagId);
}
