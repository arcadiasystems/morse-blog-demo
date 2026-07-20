"use client";

import { useQuery } from "@tanstack/react-query";
import {
  toSuiAddress,
  type PublisherCap,
} from "@arcadiasystems/morse-sdk";
import { useMorseReader } from "../hooks/use-morse-reader";

export const publisherCapKey = (
  address: string | null | undefined,
  publicationId: string,
) => ["publisher-cap", address ?? null, publicationId];

/**
 * Resolves the user's PublisherCap for a given publication, if any. Returns
 * the first matching cap (a wallet may hold multiple caps per publication,
 * but for a single-author demo there's only one).
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
      const match = page.results.find(
        (cap) => cap.publicationId === publicationId,
      );
      return match ?? null;
    },
    enabled: Boolean(address && publicationId),
    staleTime: 30_000,
  });
}
