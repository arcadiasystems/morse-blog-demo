"use client";

import { useQuery } from "@tanstack/react-query";
import { toSuiAddress } from "@arcadiasystems/morse-sdk";
import {
  listOwnedPublicationsWithDetails,
  listCoauthoredPublicationsWithDetails,
  type OwnedPublicationWithDetails,
} from "../services/publications";
import { useMorseReader } from "../hooks/use-morse-reader";

export const myPublicationsKey = (address: string | null | undefined) => [
  "my-publications",
  address ?? null,
];

export const coauthoredPublicationsKey = (
  address: string | null | undefined,
) => ["coauthored-publications", address ?? null];

export function useMyPublications() {
  const { reader, address } = useMorseReader();

  return useQuery<OwnedPublicationWithDetails[]>({
    queryKey: myPublicationsKey(address),
    queryFn: async ({ signal }) => {
      if (!address) return [];
      return listOwnedPublicationsWithDetails(
        reader,
        toSuiAddress(address),
        signal,
      );
    },
    enabled: Boolean(address),
    staleTime: 15_000,
  });
}

/**
 * Publications the connected wallet can write to but does NOT own - i.e.
 * it holds a PublisherCap but not the OwnerCap. Powers the "Shared with me"
 * section so co-authors can find blogs they've been granted access to.
 */
export function useCoauthoredPublications() {
  const { reader, address } = useMorseReader();

  return useQuery<OwnedPublicationWithDetails[]>({
    queryKey: coauthoredPublicationsKey(address),
    queryFn: async ({ signal }) => {
      if (!address) return [];
      return listCoauthoredPublicationsWithDetails(
        reader,
        toSuiAddress(address),
        signal,
      );
    },
    enabled: Boolean(address),
    staleTime: 15_000,
  });
}
