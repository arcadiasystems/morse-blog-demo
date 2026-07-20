"use client";

import { useState } from "react";
import {
  createCollection,
  createPublication,
  type CreatePublicationResult,
  StorageMode,
} from "@arcadiasystems/morse-sdk";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useMorse } from "../hooks/use-morse";
import { myPublicationsKey } from "../hooks/use-publications";
import { DEFAULT_COLLECTION_NAME } from "../lib/morse-config";

export type CreatePublicationInput = {
  name: string;
  slug: string;
};

export type CreatePublicationPhase =
  | "idle"
  | "publication"
  | "collection"
  | "done";

export type CreatePublicationOutcome = CreatePublicationResult & {
  /** Set if the default collection step failed after the publication landed. */
  defaultCollectionError?: Error;
};

// Re-export so existing imports from this module keep working - but the
// constant itself lives in `@/lib/morse-config` (server-safe).
export { DEFAULT_COLLECTION_NAME } from "../lib/morse-config";

export function useCreatePublication() {
  const morse = useMorse();
  const queryClient = useQueryClient();
  const [phase, setPhase] = useState<CreatePublicationPhase>("idle");

  const mutation = useMutation<
    CreatePublicationOutcome,
    Error,
    CreatePublicationInput
  >({
    mutationFn: async (input) => {
      if (!morse) {
        throw new Error("Connect a wallet first.");
      }
      setPhase("publication");
      const pub = await createPublication(morse.adapter, morse.config, {
        name: input.name,
        slug: input.slug,
      });
      setPhase("collection");
      let defaultCollectionError: Error | undefined;
      try {
        await createCollection(morse.adapter, morse.config, {
          publicationId: pub.publicationId,
          publisherCapId: pub.publisherCapId,
          name: DEFAULT_COLLECTION_NAME,
          storageMode: StorageMode.Blob,
        });
      } catch (err) {
        // The publication exists; the default collection didn't land. Surface
        // to the caller so the UI can show a warning toast - the user can
        // still create the collection manually from admin -> Settings.
        defaultCollectionError =
          err instanceof Error ? err : new Error(String(err));
        console.warn("default collection create failed", err);
      }
      setPhase("done");
      return { ...pub, defaultCollectionError };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: myPublicationsKey(morse?.account?.address),
      });
    },
    onSettled: () => {
      // Reset phase shortly after - the consumer page will already have
      // navigated away.
      setTimeout(() => setPhase("idle"), 500);
    },
  });

  return { ...mutation, phase };
}
