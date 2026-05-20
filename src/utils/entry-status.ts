import type { Entry } from "@arcadiasystems/morse-sdk";

export type EntryStatus = "public" | "draft" | "premium" | "empty";

/**
 * Pure classifier for an Entry's display status. Server-safe (no React,
 * no hooks). Used by the public reader as well as admin UI.
 */
export function classifyEntry(entry: Entry): EntryStatus {
  if (entry.revisions.length === 0) return "empty";
  if (entry.publicHead !== null) return "public";
  if (entry.draftHead !== null) {
    const rev = entry.revisions[entry.draftHead];
    return rev?.encrypted ? "premium" : "draft";
  }
  return "empty";
}
