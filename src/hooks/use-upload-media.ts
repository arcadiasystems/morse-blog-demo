"use client";

import { useState } from "react";
import {
  addEntry,
  createCollection,
  StorageMode,
  toPublicationId,
  toPublisherCapId,
  type AddEntryResult,
  type BlobObjectId,
} from "@arcadiasystems/morse-sdk";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useMorse } from "@/hooks/use-morse";
import { entriesKey } from "@/hooks/use-entries";
import { publicationKey } from "@/hooks/use-publication";
import {
  MEDIA_COLLECTION_NAME,
  WALRUS_STORAGE_EPOCHS,
} from "@/lib/morse-config";

export type UploadMediaPhase =
  | "idle"
  | "creating-collection"
  | "uploading-walrus"
  | "confirming-sui"
  | "done";

export type UploadMediaInput = {
  publicationId: string;
  publisherCapId: string;
  /**
   * Owner cap is required when the `media` collection does not yet exist on
   * this publication - `createCollection` only accepts a publisher cap in
   * its standard surface, but the contract enforces ownership-level check.
   */
  hasMediaCollection: boolean;
  file: File;
};

export type UploadMediaResult = AddEntryResult & {
  blobObjectId: BlobObjectId;
};

export function useUploadMedia() {
  const morse = useMorse();
  const queryClient = useQueryClient();
  const [phase, setPhase] = useState<UploadMediaPhase>("idle");

  const mutation = useMutation<UploadMediaResult, Error, UploadMediaInput>({
    mutationFn: async (input) => {
      if (!morse) throw new Error("Connect a wallet first.");

      if (!input.hasMediaCollection) {
        setPhase("creating-collection");
        await createCollection(morse.adapter, morse.config, {
          publicationId: toPublicationId(input.publicationId),
          publisherCapId: toPublisherCapId(input.publisherCapId),
          name: MEDIA_COLLECTION_NAME,
          storageMode: StorageMode.Blob,
        });
      }

      setPhase("uploading-walrus");
      const bytes = new Uint8Array(await input.file.arrayBuffer());
      const blob = await morse.walrusWrite.uploadBlob(bytes, {
        epochs: WALRUS_STORAGE_EPOCHS,
        deletable: true,
      });

      setPhase("confirming-sui");
      const result = await addEntry(morse.adapter, morse.config, {
        publicationId: toPublicationId(input.publicationId),
        publisherCapId: toPublisherCapId(input.publisherCapId),
        collectionName: MEDIA_COLLECTION_NAME,
        name: input.file.name,
        blobObjectId: blob.blobObjectId,
        contentType: input.file.type || "application/octet-stream",
      });

      setPhase("done");
      return { ...result, blobObjectId: blob.blobObjectId };
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: entriesKey(variables.publicationId, MEDIA_COLLECTION_NAME),
      });
      if (!variables.hasMediaCollection) {
        queryClient.invalidateQueries({
          queryKey: publicationKey(variables.publicationId),
        });
      }
    },
    onSettled: () => {
      setTimeout(() => setPhase("idle"), 500);
    },
  });

  return { ...mutation, phase };
}
