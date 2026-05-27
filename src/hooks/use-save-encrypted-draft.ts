"use client";

import { useState } from "react";
import {
  appendEncryptedDraftRevision,
  toPublicationId,
  toPublisherCapId,
  type RevisionAppendResult,
  type SealId,
} from "@arcadiasystems/morse-sdk";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useMorse } from "@/hooks/use-morse";
import { entriesKey } from "@/hooks/use-entries";
import { entryContentKey } from "@/hooks/use-entry-content";
import { DEFAULT_COLLECTION_NAME } from "@/hooks/use-create-publication";
import { WALRUS_STORAGE_EPOCHS } from "@/lib/morse-config";

export type SaveEncryptedDraftPhase =
  | "idle"
  | "encrypting"
  | "uploading-walrus"
  | "confirming-sui"
  | "done";

export type SaveEncryptedDraftInput = {
  publicationId: string;
  publisherCapId: string;
  entryId: number;
  /** Reuses the existing entry's sealId so prior decrypt access keeps working. */
  sealId: SealId;
  markdown: string;
  collectionName?: string;
};

/**
 * Saves a new encrypted draft revision. Reuses the entry's existing sealId,
 * encrypts new content, uploads ciphertext to Walrus, then appends the
 * encrypted draft on-chain. Encrypted entries have no publish step; the
 * draftHead IS the visible version for readers with access.
 */
export function useSaveEncryptedDraft() {
  const morse = useMorse();
  const queryClient = useQueryClient();
  const [phase, setPhase] = useState<SaveEncryptedDraftPhase>("idle");

  const mutation = useMutation<
    RevisionAppendResult,
    Error,
    SaveEncryptedDraftInput
  >({
    mutationFn: async (input) => {
      if (!morse) throw new Error("Connect a wallet first.");
      const collectionName = input.collectionName ?? DEFAULT_COLLECTION_NAME;
      const plaintext = new TextEncoder().encode(input.markdown);

      setPhase("encrypting");
      const { ciphertext } = await morse.seal.encrypt(plaintext, {
        sealId: input.sealId,
      });

      setPhase("uploading-walrus");
      const blob = await morse.walrusWrite.uploadBlob(ciphertext, {
        epochs: WALRUS_STORAGE_EPOCHS,
        deletable: true,
      });

      setPhase("confirming-sui");
      const result = await appendEncryptedDraftRevision(
        morse.adapter,
        morse.config,
        {
          publicationId: toPublicationId(input.publicationId),
          publisherCapId: toPublisherCapId(input.publisherCapId),
          collectionName,
          entryId: input.entryId,
          blobObjectId: blob.blobObjectId,
          contentType: "text/markdown",
          sealId: input.sealId,
        },
      );

      setPhase("done");
      return result;
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
    onSettled: () => {
      setTimeout(() => setPhase("idle"), 500);
    },
  });

  return { ...mutation, phase };
}
