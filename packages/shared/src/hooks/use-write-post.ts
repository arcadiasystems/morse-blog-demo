"use client";

import { useState } from "react";
import {
  addEntry,
  toPublicationId,
  toPublisherCapId,
  type AddEntryResult,
} from "@arcadiasystems/morse-sdk";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useMorse } from "../hooks/use-morse";
import { entriesKey } from "../hooks/use-entries";
import { DEFAULT_COLLECTION_NAME } from "../hooks/use-create-publication";
import { WALRUS_STORAGE_EPOCHS } from "../lib/morse-config";

export type WritePostPhase =
  | "idle"
  | "uploading-walrus"
  | "confirming-sui"
  | "done";

export type WritePostInput = {
  publicationId: string;
  publisherCapId: string;
  title: string;
  markdown: string;
  collectionName?: string;
};

export function useWritePublicPost() {
  const morse = useMorse();
  const queryClient = useQueryClient();
  const [phase, setPhase] = useState<WritePostPhase>("idle");

  const mutation = useMutation<AddEntryResult, Error, WritePostInput>({
    mutationFn: async (input) => {
      if (!morse) {
        throw new Error("Connect a wallet first.");
      }
      const collectionName = input.collectionName ?? DEFAULT_COLLECTION_NAME;
      const bytes = new TextEncoder().encode(input.markdown);

      setPhase("uploading-walrus");
      const blob = await morse.walrusWrite.uploadBlob(bytes, {
        epochs: WALRUS_STORAGE_EPOCHS,
        deletable: true,
      });

      setPhase("confirming-sui");
      const result = await addEntry(morse.adapter, morse.config, {
        publicationId: toPublicationId(input.publicationId),
        publisherCapId: toPublisherCapId(input.publisherCapId),
        collectionName,
        name: input.title,
        blobObjectId: blob.blobObjectId,
        contentType: "text/markdown",
      });

      setPhase("done");
      return result;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: entriesKey(
          variables.publicationId,
          variables.collectionName ?? DEFAULT_COLLECTION_NAME,
        ),
      });
    },
    onSettled: () => {
      setTimeout(() => setPhase("idle"), 500);
    },
  });

  return { ...mutation, phase };
}
