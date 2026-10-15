"use client";

import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { toPublicationId } from "@arcadiasystems/morse-sdk";
import { useMorseReader } from "@/hooks/use-morse-reader";
import {
  blobRefLabel,
  suiscanTxUrl,
  walrusRevisionUrl,
} from "@/lib/explorer";
import { resolveWalrusBlobId } from "@/services/walrus-blob-id";
import { truncateAddress } from "@/utils/address";
import styles from "./states.module.css";

export type PublishReceipt = {
  publicationId: string;
  collectionName: string;
  entryId: number;
  revisionId: number;
  digest: string;
};

/** Shows the "Entry #n anchored on Sui" toast after an entry lands. */
export function showPublishToast(receipt: PublishReceipt) {
  toast.custom(() => <PublishToast {...receipt} />, { duration: 12_000 });
}

function PublishToast({
  publicationId,
  collectionName,
  entryId,
  revisionId,
  digest,
}: PublishReceipt) {
  const { reader, client } = useMorseReader();

  // The add-entry result carries the tx digest but not the blob, so read the
  // new revision back from chain to link the Walrus blob it references.
  const blob = useQuery({
    queryKey: ["anchored-blob", publicationId, collectionName, entryId, revisionId],
    queryFn: async ({ signal }) => {
      const entry = await reader.getEntry(
        toPublicationId(publicationId),
        collectionName,
        entryId,
        signal,
      );
      const blobRef = entry.revisions[revisionId]?.blobRef;
      if (!blobRef) {
        throw new Error(`Entry #${entryId} has no revision ${revisionId}`);
      }
      if (blobRef.kind === "quilt") {
        return {
          href: walrusRevisionUrl(blobRef, null),
          label: blobRefLabel(blobRef),
        };
      }
      const blobId = await resolveWalrusBlobId(
        client,
        blobRef.blobObjectId,
        signal,
      );
      return { href: walrusRevisionUrl(blobRef, blobId), label: blobId };
    },
    staleTime: Infinity,
  });

  return (
    <div className={styles.toast} role="status">
      <i aria-hidden="true" />
      <span>Entry #{entryId} anchored on Sui</span>
      <a href={suiscanTxUrl(digest)} target="_blank" rel="noreferrer">
        tx {truncateAddress(digest)}
      </a>
      {blob.data ? (
        <a href={blob.data.href} target="_blank" rel="noreferrer">
          blob {truncateAddress(blob.data.label)}
        </a>
      ) : null}
    </div>
  );
}
