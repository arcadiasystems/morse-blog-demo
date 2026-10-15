"use client";

import Link from "next/link";
import { PlusIcon } from "@/components/brand/icons";
import { useOwnerCap } from "@/hooks/use-owner-cap";
import { usePublisherCap } from "@/hooks/use-publisher-cap";
import styles from "./PublicationHeader.module.css";

/**
 * Writer actions on the public publication card. "New post" needs a
 * publisher cap; "Manage caps" needs the owner cap. Readers see neither.
 */
export function PublicationActions({
  publicationId,
}: {
  publicationId: string;
}) {
  const publisherCap = usePublisherCap(publicationId);
  const ownerCap = useOwnerCap(publicationId);

  if (!publisherCap.data && !ownerCap.data) return null;

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
    </div>
  );
}
