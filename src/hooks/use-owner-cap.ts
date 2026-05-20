"use client";

import { useQuery } from "@tanstack/react-query";
import {
  toSuiAddress,
  type OwnerCapId,
} from "@arcadiasystems/morse-sdk";
import { useMorse } from "@/hooks/use-morse";

export const ownerCapKey = (
  address: string | undefined,
  publicationId: string,
) => ["owner-cap", address, publicationId];

/**
 * Returns the connected wallet's OwnerCap id for a given publication, or
 * null if the wallet does not own this publication. Reads via
 * listPublicationsOwnedBy and filters - no separate index.
 */
export function useOwnerCap(publicationId: string | undefined) {
  const morse = useMorse();
  const address = morse?.account?.address;

  return useQuery<OwnerCapId | null>({
    queryKey: ownerCapKey(address, publicationId ?? ""),
    queryFn: async ({ signal }) => {
      if (!morse || !publicationId) return null;
      const page = await morse.reader.listPublicationsOwnedBy(
        toSuiAddress(morse.account!.address),
        { signal },
      );
      const match = page.results.find(
        (h) => h.publicationId === publicationId,
      );
      return match?.ownerCapId ?? null;
    },
    enabled: Boolean(morse && publicationId),
    staleTime: 60_000,
  });
}
