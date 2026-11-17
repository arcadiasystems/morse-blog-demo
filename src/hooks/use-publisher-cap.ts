"use client";

import { useQuery } from "@tanstack/react-query";
import {
  toSuiAddress,
  type PublisherCap,
} from "@arcadiasystems/morse-sdk";
import { useMorseReader } from "@/hooks/use-morse-reader";
import { withoutRevokedPublisherCaps } from "@/services/publications";

export const publisherCapKey = (
  address: string | null | undefined,
  publicationId: string,
) => ["publisher-cap", address ?? null, publicationId];

/**
 * Resolves the user's PublisherCap for a given publication, if any. Returns
 * the first matching cap the owner has not revoked (a wallet may hold
 * multiple caps per publication, and a revoked cap stays in the wallet), or
 * null when every matching cap is revoked.
 */
export function usePublisherCap(publicationId: string | undefined) {
  const { reader, address } = useMorseReader();

  return useQuery<PublisherCap | null>({
    queryKey: publisherCapKey(address, publicationId ?? ""),
    queryFn: async ({ signal }) => {
      if (!address || !publicationId) return null;
      const page = await reader.listPublisherCapsOwnedBy(
        toSuiAddress(address),
        { signal },
      );
      const liveCaps = await withoutRevokedPublisherCaps(
        reader,
        page.results.filter((cap) => cap.publicationId === publicationId),
        signal,
      );
      return liveCaps.at(0) ?? null;
    },
    enabled: Boolean(address && publicationId),
    staleTime: 30_000,
  });
}
