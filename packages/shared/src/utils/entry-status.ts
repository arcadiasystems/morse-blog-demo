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

/**
 * True when the entry has an unpublished draft that is *newer* than the
 * current public revision - i.e. edits that haven't been published yet.
 *
 * Crucially this is `draftHead > publicHead`, NOT `draftHead !== publicHead`.
 * After `publishFromDraft` the SDK appends a new public revision but leaves
 * `draftHead` pointing at the now-older draft; comparing for inequality
 * would wrongly flag a freshly-published post as "draft pending" forever
 * (append-only revisions never reset the draft pointer).
 *
 * Premium entries (publicHead === null) are not "pending" here - they're a
 * separate status; use `classifyEntry`.
 */
export function hasPendingDraft(entry: Entry): boolean {
  if (entry.draftHead === null) return false;
  if (entry.publicHead === null) return false; // premium / never-published
  return entry.draftHead > entry.publicHead;
}

function isTextContentType(contentType: string): boolean {
  if (!contentType) return true;
  if (contentType.startsWith("text/")) return true;
  if (contentType === "application/json") return true;
  if (contentType === "application/xml") return true;
  return false;
}

/**
 * True when the entry's current revision is binary (image / file) rather
 * than editable text. Used to label actions "View" instead of "Edit" - the
 * SDK has no in-place edit for a blob; you replace by delete + re-upload.
 */
export function isBinaryEntry(entry: Entry): boolean {
  const head =
    entry.draftHead !== null
      ? entry.revisions[entry.draftHead]
      : entry.publicHead !== null
        ? entry.revisions[entry.publicHead]
        : null;
  if (!head || head.encrypted) return false;
  return !isTextContentType(head.contentType);
}
