"use client";

import { useQuery } from "@tanstack/react-query";
import {
  NotFoundError,
  toPublicationId,
  type Entry,
} from "@arcadiasystems/morse-sdk";
import { useMorseReader } from "../hooks/use-morse-reader";
import { DEFAULT_COLLECTION_NAME } from "../lib/morse-config";

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
  /**
   * True when the on-chain entry exists but its Walrus blob is gone (storage
   * lease expired or testnet wiped). The entry metadata is still valid; the
   * body bytes are unrecoverable and the post must be re-saved to heal it.
   */
  blobMissing: boolean;
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
 * publicHead. Encrypted revisions return empty content; the edit page routes
 * premium-post editing through the Seal decrypt flow before calling this.
 */
export function useEntryContent(
  publicationId: string | undefined,
  entryId: number | undefined,
  collectionName: string = DEFAULT_COLLECTION_NAME,
) {
  const { reader, walrusRead } = useMorseReader();

  return useQuery<EntryWithContent>({
    queryKey: entryContentKey(
      publicationId ?? "",
      collectionName,
      entryId ?? -1,
    ),
    queryFn: async ({ signal }) => {
      if (!publicationId || entryId === undefined) {
        throw new Error("Missing publication / entry id");
      }

      const entry = await reader.getEntry(
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
        return {
          entry,
          content: "",
          contentType: "text/markdown",
          source: "empty",
          blobMissing: false,
        };
      }

      const revision = entry.revisions[head.idx];
      if (!revision || revision.encrypted) {
        return {
          entry,
          content: "",
          contentType: revision?.contentType ?? "text/markdown",
          source: head.source,
          blobMissing: false,
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
          blobMissing: false,
        };
      }

      // Text path: fetch bytes and UTF-8 decode. A missing blob (expired
      // storage lease / testnet wipe) is NOT a hard error - we still return
      // the entry so the editor can offer a re-save instead of a dead end.
      try {
        const bytes = await walrusRead.readBlobRef(revision.blobRef);
        return {
          entry,
          content: DECODER.decode(bytes),
          contentType: revision.contentType,
          source: head.source,
          blobMissing: false,
        };
      } catch (err) {
        if (err instanceof NotFoundError && err.resource === "blob") {
          return {
            entry,
            content: null,
            contentType: revision.contentType,
            source: head.source,
            blobMissing: true,
          };
        }
        throw err;
      }
    },
    enabled: Boolean(publicationId && entryId !== undefined),
    staleTime: 5_000,
  });
}
