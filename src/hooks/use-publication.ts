"use client";

import { useQuery } from "@tanstack/react-query";
import {
  toPublicationId,
  type Publication,
} from "@arcadiasystems/morse-sdk";
import { useMorse } from "@/hooks/use-morse";

export const publicationKey = (id: string) => ["publication", id];

export function usePublication(id: string | undefined) {
  const morse = useMorse();

  return useQuery<Publication>({
    queryKey: publicationKey(id ?? ""),
    queryFn: async ({ signal }) => {
      if (!morse) throw new Error("Wallet not connected");
      if (!id) throw new Error("Missing publication id");
      return morse.reader.getPublication(toPublicationId(id), signal);
    },
    enabled: Boolean(morse && id),
    staleTime: 15_000,
  });
}
