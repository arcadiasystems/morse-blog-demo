"use client";

import Link from "next/link";
import { PlusIcon, WarnIcon } from "@/components/brand/icons";
import { useOwnerCap } from "@/hooks/use-owner-cap";
import { usePublisherCap } from "@/hooks/use-publisher-cap";
import styles from "./PublicationHeader.module.css";

/**
 * Writer actions on the public publication card. "New post" needs a
 * publisher cap; "Manage caps" needs the owner cap. Readers see neither.
 * When a cap lookup fails the card offers the check again: a writer whose
 * lookup failed must not be shown the reader's view as if they had no cap.
 */
export function PublicationActions({
  publicationId,
}: {
  publicationId: string;
}) {
  const publisherCap = usePublisherCap(publicationId);
  const ownerCap = useOwnerCap(publicationId);
  const checkFailed = publisherCap.isError || ownerCap.isError;

  if (!publisherCap.data && !ownerCap.data && !checkFailed) return null;

  const rechecking = publisherCap.isFetching || ownerCap.isFetching;
  const recheck = () => {
    if (publisherCap.isError) publisherCap.refetch();
    if (ownerCap.isError) ownerCap.refetch();
  };

  return (
    <div className={styles.act}>
      {publisherCap.data ? (
        <Link
          className="btn btn-ultra"
          href={`/my-blogs/${publicationId}/write`}
        >
          <PlusIcon size={16} strokeWidth={2.2} />
          New post
        </Link>
      ) : null}
      {ownerCap.data ? (
        <Link className="btn btn-soft" href={`/my-blogs/${publicationId}`}>
          Manage caps
        </Link>
      ) : null}
      {checkFailed ? (
        <button
          type="button"
          className="btn btn-soft"
          title="The read from Sui that checks your caps on this blog did not complete."
          disabled={rechecking}
          onClick={recheck}
        >
          <WarnIcon size={16} />
          {rechecking ? "Checking access again" : "Access check failed. Try again"}
        </button>
      ) : null}
    </div>
  );
}
