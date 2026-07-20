"use client";

import { useState } from "react";
import {
  deleteCollection,
  deleteEntry,
  deletePublication,
  toOwnerCapId,
  toPublicationId,
  toPublisherCapId,
} from "@arcadiasystems/morse-sdk";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useMorse } from "../hooks/use-morse";
import { myPublicationsKey } from "../hooks/use-publications";

export type DeletePublicationPhase =
  | "idle"
  | "deleting-entries"
  | "deleting-collections"
  | "deleting-publication"
  | "done";

export type DeletePublicationInput = {
  publicationId: string;
  ownerCapId: string;
  publisherCapId: string;
};

/**
 * Cascade-deletes a publication. The Move layer requires empty collections
 * to delete a collection (`table::destroy_empty`) and an empty publication
 * to delete it. So we walk the tree bottom-up:
 *   1. delete every entry in every collection
 *   2. delete every collection
 *   3. delete the publication
 *
 * Each step is its own transaction (its own wallet popup). For a blog with
 * E entries across C collections that's E + C + 1 confirmations. The caller
 * should warn the user with the count before invoking.
 */
export function useDeletePublication() {
  const morse = useMorse();
  const queryClient = useQueryClient();
  const [phase, setPhase] = useState<DeletePublicationPhase>("idle");
  const [progress, setProgress] = useState<{ done: number; total: number }>({
    done: 0,
    total: 0,
  });

  const mutation = useMutation<void, Error, DeletePublicationInput>({
    mutationFn: async (input) => {
      if (!morse) throw new Error("Connect a wallet first.");
      const pubId = toPublicationId(input.publicationId);
      const publisherCapId = toPublisherCapId(input.publisherCapId);
      const ownerCapId = toOwnerCapId(input.ownerCapId);

      // Snapshot current collections + their entries.
      const publication = await morse.reader.getPublication(pubId);
      const collections = publication.collections;

      const entriesByCollection = await Promise.all(
        collections.map(async (c) => {
          const ids: number[] = [];
          for await (const entry of morse.reader.scanEntries(pubId, c.name)) {
            ids.push(entry.id);
          }
          return { name: c.name, entryIds: ids };
        }),
      );

      const totalEntries = entriesByCollection.reduce(
        (n, c) => n + c.entryIds.length,
        0,
      );
      const total = totalEntries + collections.length + 1;
      let done = 0;
      const tick = () => {
        done += 1;
        setProgress({ done, total });
      };
      setProgress({ done: 0, total });

      // 1. Delete every entry.
      setPhase("deleting-entries");
      for (const c of entriesByCollection) {
        for (const entryId of c.entryIds) {
          await deleteEntry(morse.adapter, morse.config, {
            publicationId: pubId,
            publisherCapId,
            collectionName: c.name,
            entryId,
          });
          tick();
        }
      }

      // 2. Delete every (now-empty) collection.
      setPhase("deleting-collections");
      for (const c of collections) {
        await deleteCollection(morse.adapter, morse.config, {
          publicationId: pubId,
          publisherCapId,
          name: c.name,
        });
        tick();
      }

      // 3. Delete the (now-empty) publication.
      setPhase("deleting-publication");
      await deletePublication(morse.reader, morse.adapter, morse.config, {
        publicationId: pubId,
        ownerCapId,
      });
      tick();

      setPhase("done");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: myPublicationsKey(morse?.account?.address),
      });
    },
    onSettled: () => {
      setTimeout(() => {
        setPhase("idle");
        setProgress({ done: 0, total: 0 });
      }, 500);
    },
  });

  return { ...mutation, phase, progress };
}
