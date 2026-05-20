"use client";

import { useQuery } from "@tanstack/react-query";
import {
  toSuiAddress,
  type PublisherCap,
} from "@arcadiasystems/morse-sdk";
import { useMorse } from "@/hooks/use-morse";

export const publisherCapKey = (
  address: string | undefined,
  publicationId: string,
) => ["publisher-cap", address, publicationId];

/**
 * Resolves the user's PublisherCap for a given publication, if any. Returns
 * the first matching cap (a wallet may hold multiple caps per publication,
 * but for a single-author demo there's only one).
 */
export function usePublisherCap(publicationId: string | undefined) {
  const morse = useMorse();
  const address = morse?.account?.address;

  return useQuery<PublisherCap | null>({
    queryKey: publisherCapKey(address, publicationId ?? ""),
    queryFn: async ({ signal }) => {
      if (!morse || !publicationId) return null;
      const page = await morse.reader.listPublisherCapsOwnedBy(
        toSuiAddress(morse.account!.address),
        { signal },
      );
      const match = page.results.find(
        (cap) => cap.publicationId === publicationId,
      );
      return match ?? null;
    },
    enabled: Boolean(morse && publicationId),
    staleTime: 30_000,
  });
}
