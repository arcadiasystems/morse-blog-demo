"use client";

import { useQuery } from "@tanstack/react-query";
import { toSuiAddress } from "@arcadiasystems/morse-sdk";
import {
  listOwnedPublicationsWithDetails,
  type OwnedPublicationWithDetails,
} from "@/services/publications";
import { useMorse } from "@/hooks/use-morse";

export const myPublicationsKey = (address: string | undefined) => [
  "my-publications",
  address,
];

export function useMyPublications() {
  const morse = useMorse();
  const address = morse?.account?.address;

  return useQuery<OwnedPublicationWithDetails[]>({
    queryKey: myPublicationsKey(address),
    queryFn: async ({ signal }) => {
      if (!morse) return [];
      return listOwnedPublicationsWithDetails(
        morse.reader,
        toSuiAddress(morse.account!.address),
        signal,
      );
    },
    enabled: Boolean(morse),
    staleTime: 15_000,
  });
}
