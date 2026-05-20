"use client";

import { useQuery } from "@tanstack/react-query";
import { toPublicationId, type Entry } from "@arcadiasystems/morse-sdk";
import { useMorse } from "@/hooks/use-morse";

export const entriesKey = (publicationId: string, collectionName: string) => [
  "entries",
  publicationId,
  collectionName,
];

/**
 * Lists all entries in a collection by exhausting the entries pager. For a
 * demo with a small number of entries this is fine; production code should
 * paginate UI-side.
 */
export function useEntries(
  publicationId: string | undefined,
  collectionName: string,
) {
  const morse = useMorse();

  return useQuery<Entry[]>({
    queryKey: entriesKey(publicationId ?? "", collectionName),
    queryFn: async ({ signal }) => {
      if (!morse || !publicationId) return [];
      const out: Entry[] = [];
      for await (const entry of morse.reader.scanEntries(
        toPublicationId(publicationId),
        collectionName,
        { signal },
      )) {
        out.push(entry);
      }
      out.sort((a, b) => b.id - a.id);
      return out;
    },
    enabled: Boolean(morse && publicationId),
    staleTime: 15_000,
  });
}
