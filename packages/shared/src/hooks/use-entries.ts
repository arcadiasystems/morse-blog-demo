"use client";

import { useQuery } from "@tanstack/react-query";
import { toPublicationId, type Entry } from "@arcadiasystems/morse-sdk";
import { useMorseReader } from "../hooks/use-morse-reader";

export const entriesKey = (publicationId: string, collectionName: string) => [
  "entries",
  publicationId,
  collectionName,
];

/**
 * Lists all entries in a collection by exhausting the entries pager. For a
 * demo with a small number of entries this is fine; production code should
 * paginate UI-side. Read-only - uses the signer-free reader so it resolves
 * immediately on connect (no waiting on the async signer probe).
 */
export function useEntries(
  publicationId: string | undefined,
  collectionName: string,
) {
  const { reader } = useMorseReader();

  return useQuery<Entry[]>({
    queryKey: entriesKey(publicationId ?? "", collectionName),
    queryFn: async ({ signal }) => {
      if (!publicationId) return [];
      const out: Entry[] = [];
      for await (const entry of reader.scanEntries(
        toPublicationId(publicationId),
        collectionName,
        { signal },
      )) {
        out.push(entry);
      }
      out.sort((a, b) => b.id - a.id);
      return out;
    },
    enabled: Boolean(publicationId),
    staleTime: 15_000,
  });
}
