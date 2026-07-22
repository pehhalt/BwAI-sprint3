"use server";

import {
  getCollections,
  createCollection,
  renameCollection,
  type Collection,
} from "@/app/lib/db";

export async function getCollectionsAction(): Promise<Collection[]> {
  return getCollections();
}

export async function createCollectionAction(name: string): Promise<Collection> {
  return createCollection(name);
}

export async function renameCollectionAction(id: string, name: string): Promise<Collection> {
  return renameCollection(id, name);
}
