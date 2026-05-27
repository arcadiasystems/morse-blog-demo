"use client";

import { useQuery } from "@tanstack/react-query";
import {
  toPublicationId,
  type Publication,
} from "@arcadiasystems/morse-sdk";
import { useMorseReader } from "@/hooks/use-morse-reader";

export const publicationKey = (id: string) => ["publication", id];

export function usePublication(id: string | undefined) {
  const { reader } = useMorseReader();

  return useQuery<Publication>({
    queryKey: publicationKey(id ?? ""),
    queryFn: async ({ signal }) => {
      if (!id) throw new Error("Missing publication id");
      return reader.getPublication(toPublicationId(id), signal);
    },
    enabled: Boolean(id),
    staleTime: 15_000,
  });
}
