"use client";

import { useQuery } from "@tanstack/react-query";
import {
  toSuiAddress,
  type OwnerCapId,
} from "@arcadiasystems/morse-sdk";
import { useMorseReader } from "@/hooks/use-morse-reader";

export const ownerCapKey = (
  address: string | null | undefined,
  publicationId: string,
) => ["owner-cap", address ?? null, publicationId];

/**
 * Returns the connected wallet's OwnerCap id for a given publication, or
 * null if the wallet does not own this publication. Reads via
 * listPublicationsOwnedBy and filters - no separate index.
 */
export function useOwnerCap(publicationId: string | undefined) {
  const { reader, address } = useMorseReader();

  return useQuery<OwnerCapId | null>({
    queryKey: ownerCapKey(address, publicationId ?? ""),
    queryFn: async ({ signal }) => {
      if (!address || !publicationId) return null;
      const page = await reader.listPublicationsOwnedBy(
        toSuiAddress(address),
        { signal },
      );
      const match = page.results.find(
        (h) => h.publicationId === publicationId,
      );
      return match?.ownerCapId ?? null;
    },
    enabled: Boolean(address && publicationId),
    staleTime: 60_000,
  });
}
