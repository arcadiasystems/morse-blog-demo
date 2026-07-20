"use client";

import { useState } from "react";
import {
  appendDraftRevision,
  publishFromDraft,
  toBlobObjectId,
  toPublicationId,
  toPublisherCapId,
  type RevisionAppendResult,
} from "@arcadiasystems/morse-sdk";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useMorse } from "../hooks/use-morse";
import { entriesKey } from "../hooks/use-entries";
import { entryContentKey } from "../hooks/use-entry-content";
import { DEFAULT_COLLECTION_NAME } from "../hooks/use-create-publication";
import { WALRUS_STORAGE_EPOCHS } from "../lib/morse-config";

export type SaveDraftPhase =
  | "idle"
  | "uploading-walrus"
  | "confirming-sui"
  | "done";

export type SaveDraftInput = {
  publicationId: string;
  publisherCapId: string;
  entryId: number;
  markdown: string;
  collectionName?: string;
};

/**
 * Uploads new content to Walrus and appends a draft revision on-chain.
 * Two-phase: walrus upload (0 popups via publisher), then addDraftRevision
 * (1 popup). The entry's publicHead is untouched until the user explicitly
 * publishes via usePublishDraft.
 */
export function useSaveDraft() {
  const morse = useMorse();
  const queryClient = useQueryClient();
  const [phase, setPhase] = useState<SaveDraftPhase>("idle");

  const mutation = useMutation<RevisionAppendResult, Error, SaveDraftInput>({
    mutationFn: async (input) => {
      if (!morse) throw new Error("Connect a wallet first.");
      const collectionName = input.collectionName ?? DEFAULT_COLLECTION_NAME;
      const bytes = new TextEncoder().encode(input.markdown);

      setPhase("uploading-walrus");
      const blob = await morse.walrusWrite.uploadBlob(bytes, {
        epochs: WALRUS_STORAGE_EPOCHS,
        deletable: true,
      });

      setPhase("confirming-sui");
      const result = await appendDraftRevision(morse.adapter, morse.config, {
        publicationId: toPublicationId(input.publicationId),
        publisherCapId: toPublisherCapId(input.publisherCapId),
        collectionName,
        entryId: input.entryId,
        blobObjectId: blob.blobObjectId,
        contentType: "text/markdown",
      });

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

export type PublishDraftInput = {
  publicationId: string;
  publisherCapId: string;
  entryId: number;
  /** The draft revision id to publish (entry.draftHead). */
  draftRevisionId: number;
  /** The blob the draft is pointing at (entry.revisions[draftHead].blobRef.blobObjectId). */
  blobObjectId: string;
  contentType?: string;
  collectionName?: string;
};

/**
 * Promotes a draft revision to public. Appends a NEW public revision pointing
 * at the same blob the draft already uses (no re-upload). 1 popup.
 */
export function usePublishDraft() {
  const morse = useMorse();
  const queryClient = useQueryClient();

  return useMutation<RevisionAppendResult, Error, PublishDraftInput>({
    mutationFn: async (input) => {
      if (!morse) throw new Error("Connect a wallet first.");
      const collectionName = input.collectionName ?? DEFAULT_COLLECTION_NAME;
      return publishFromDraft(morse.adapter, morse.config, {
        publicationId: toPublicationId(input.publicationId),
        publisherCapId: toPublisherCapId(input.publisherCapId),
        collectionName,
        entryId: input.entryId,
        draftRevisionId: input.draftRevisionId,
        blobObjectId: toBlobObjectId(input.blobObjectId),
        contentType: input.contentType ?? "text/markdown",
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
