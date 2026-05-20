"use client";

import { useQuery } from "@tanstack/react-query";
import {
  toPublicationId,
  type Entry,
} from "@arcadiasystems/morse-sdk";
import { useMorse } from "@/hooks/use-morse";
import { DEFAULT_COLLECTION_NAME } from "@/hooks/use-create-publication";

export const entryContentKey = (
  publicationId: string,
  collectionName: string,
  entryId: number,
) => ["entry-content", publicationId, collectionName, entryId];

export type EntryWithContent = {
  entry: Entry;
  /** UTF-8 text body when content is text-like; null for binary entries. */
  content: string | null;
  /** Raw on-chain content type of the source revision, e.g. "image/png". */
  contentType: string;
  /** Which head we sourced the content from. */
  source: "draftHead" | "publicHead" | "empty";
};

const DECODER = new TextDecoder();

function isTextContentType(contentType: string): boolean {
  if (!contentType) return true;
  if (contentType.startsWith("text/")) return true;
  if (contentType === "application/json") return true;
  if (contentType === "application/xml") return true;
  return false;
}

/**
 * Fetches the entry and resolves the editor pre-fill content from Walrus.
 *
 * Source-of-truth priority: draftHead first (in-progress edits), then
 * publicHead. Encrypted revisions return empty content; the edit page should
 * route premium-post editing to the Seal flow (Slice 6) before calling this.
 */
export function useEntryContent(
  publicationId: string | undefined,
  entryId: number | undefined,
  collectionName: string = DEFAULT_COLLECTION_NAME,
) {
  const morse = useMorse();

  return useQuery<EntryWithContent>({
    queryKey: entryContentKey(
      publicationId ?? "",
      collectionName,
      entryId ?? -1,
    ),
    queryFn: async ({ signal }) => {
      if (!morse) throw new Error("Wallet not connected");
      if (!publicationId || entryId === undefined) {
        throw new Error("Missing publication / entry id");
      }

      const entry = await morse.reader.getEntry(
        toPublicationId(publicationId),
        collectionName,
        entryId,
        signal,
      );

      const head =
        entry.draftHead !== null
          ? { source: "draftHead" as const, idx: entry.draftHead }
          : entry.publicHead !== null
            ? { source: "publicHead" as const, idx: entry.publicHead }
            : null;

      if (!head) {
        return { entry, content: "", contentType: "text/markdown", source: "empty" };
      }

      const revision = entry.revisions[head.idx];
      if (!revision || revision.encrypted) {
        return {
          entry,
          content: "",
          contentType: revision?.contentType ?? "text/markdown",
          source: head.source,
        };
      }

      // For non-text content (images, binaries) we don't try to decode -
      // the consumer renders a binary-specific editor (preview + replace)
      // and uses WalrusImage or SDK fetches to surface the bytes.
      if (!isTextContentType(revision.contentType)) {
        return {
          entry,
          content: null,
          contentType: revision.contentType,
          source: head.source,
        };
      }

      // Text path: fetch bytes and UTF-8 decode. Errors surface to the
      // query so the UI shows them instead of silently pre-filling with "".
      const bytes = await morse.walrusRead.readBlobRef(revision.blobRef);
      return {
        entry,
        content: DECODER.decode(bytes),
        contentType: revision.contentType,
        source: head.source,
      };
    },
    enabled: Boolean(morse && publicationId && entryId !== undefined),
    staleTime: 5_000,
  });
}
