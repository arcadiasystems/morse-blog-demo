"use client";

import { useState } from "react";
import {
  addEncryptedEntry,
  buildPublisherSealId,
  toPublicationId,
  toPublisherCapId,
  type AddEntryResult,
} from "@arcadiasystems/morse-sdk";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useMorse } from "../hooks/use-morse";
import { entriesKey } from "../hooks/use-entries";
import { DEFAULT_COLLECTION_NAME } from "../hooks/use-create-publication";
import { WALRUS_STORAGE_EPOCHS } from "../lib/morse-config";

export type WriteEncryptedPhase =
  | "idle"
  | "encrypting"
  | "uploading-walrus"
  | "confirming-sui"
  | "done";

export type WriteEncryptedPostInput = {
  publicationId: string;
  publisherCapId: string;
  title: string;
  markdown: string;
  collectionName?: string;
};

function randomNonce(bytes = 16): Uint8Array {
  const out = new Uint8Array(bytes);
  crypto.getRandomValues(out);
  return out;
}

export function useWriteEncryptedPost() {
  const morse = useMorse();
  const queryClient = useQueryClient();
  const [phase, setPhase] = useState<WriteEncryptedPhase>("idle");

  const mutation = useMutation<AddEntryResult, Error, WriteEncryptedPostInput>({
    mutationFn: async (input) => {
      if (!morse) throw new Error("Connect a wallet first.");
      const collectionName = input.collectionName ?? DEFAULT_COLLECTION_NAME;
      const plaintext = new TextEncoder().encode(input.markdown);

      setPhase("encrypting");
      const sealId = buildPublisherSealId(
        toPublicationId(input.publicationId),
        randomNonce(),
      );
      const { ciphertext } = await morse.seal.encrypt(plaintext, { sealId });

      setPhase("uploading-walrus");
      const blob = await morse.walrusWrite.uploadBlob(ciphertext, {
        epochs: WALRUS_STORAGE_EPOCHS,
        deletable: true,
      });

      setPhase("confirming-sui");
      const result = await addEncryptedEntry(morse.adapter, morse.config, {
        publicationId: toPublicationId(input.publicationId),
        publisherCapId: toPublisherCapId(input.publisherCapId),
        collectionName,
        name: input.title,
        blobObjectId: blob.blobObjectId,
        contentType: "text/markdown",
        sealId,
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
