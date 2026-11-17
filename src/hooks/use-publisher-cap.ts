"use client";

import { useQuery } from "@tanstack/react-query";
import {
  toSuiAddress,
  type PublisherCap,
} from "@arcadiasystems/morse-sdk";
import { useMorseReader } from "@/hooks/use-morse-reader";
import { resolveLivePublisherCaps } from "@/services/publications";

/** Prefix of every publisher-cap query for `address`, whatever the blog. */
export const publisherCapsKey = (address: string | null | undefined) => [
  "publisher-cap",
  address ?? null,
];

export const publisherCapKey = (
  address: string | null | undefined,
  publicationId: string,
) => [...publisherCapsKey(address), publicationId];

/**
 * Resolves the user's PublisherCap for a given publication, if any. Returns
 * the first matching cap the owner has not revoked (a wallet may hold
 * multiple caps per publication, and a revoked cap stays in the wallet), or
 * null when every matching cap is revoked or the publication was deleted.
 * A check that could not be completed is the query's error, never null.
 */
export function usePublisherCap(publicationId: string | undefined) {
  const { reader, client, config, address } = useMorseReader();

  return useQuery<PublisherCap | null>({
    queryKey: publisherCapKey(address, publicationId ?? ""),
    queryFn: async ({ signal }) => {
      if (!address || !publicationId) return null;
      const page = await reader.listPublisherCapsOwnedBy(
        toSuiAddress(address),
        { signal },
      );
      const live = await resolveLivePublisherCaps(
        { client, config },
        page.results.filter((cap) => cap.publicationId === publicationId),
        signal,
      );
      return live.at(0)?.caps.at(0) ?? null;
    },
    enabled: Boolean(address && publicationId),
    staleTime: 30_000,
  });
}
