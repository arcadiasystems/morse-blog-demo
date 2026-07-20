"use client";

import {
  deleteEntry,
  toPublicationId,
  toPublisherCapId,
  type DeleteEntryResult,
} from "@arcadiasystems/morse-sdk";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useMorse } from "../hooks/use-morse";
import { entriesKey } from "../hooks/use-entries";
import { entryContentKey } from "../hooks/use-entry-content";
import { DEFAULT_COLLECTION_NAME } from "../hooks/use-create-publication";

export type DeletePostInput = {
  publicationId: string;
  publisherCapId: string;
  entryId: number;
  collectionName?: string;
};

export function useDeletePost() {
  const morse = useMorse();
  const queryClient = useQueryClient();

  return useMutation<DeleteEntryResult, Error, DeletePostInput>({
    mutationFn: async (input) => {
      if (!morse) throw new Error("Connect a wallet first.");
      const collectionName = input.collectionName ?? DEFAULT_COLLECTION_NAME;
      return deleteEntry(morse.adapter, morse.config, {
        publicationId: toPublicationId(input.publicationId),
        publisherCapId: toPublisherCapId(input.publisherCapId),
        collectionName,
        entryId: input.entryId,
      });
    },
    onSuccess: (_data, variables) => {
      const cName = variables.collectionName ?? DEFAULT_COLLECTION_NAME;
      queryClient.invalidateQueries({
        queryKey: entriesKey(variables.publicationId, cName),
      });
      queryClient.invalidateQueries({
        queryKey: entryContentKey(variables.publicationId, cName, variables.entryId),
      });
    },
  });
}
