"use client";

import Link from "next/link";
import { PenIcon } from "@/components/brand/icons";
import { StateCard } from "@/components/feedback/StateCard";
import { usePublisherCap } from "@/hooks/use-publisher-cap";

/**
 * Empty publication state. Wallets holding a publisher cap get the write
 * prompt from states.html; everyone else is told nothing is published yet.
 */
export function EmptyPublication({
  publicationId,
  className,
}: {
  publicationId: string;
  className?: string;
}) {
  const cap = usePublisherCap(publicationId);

  if (cap.data) {
    return (
      <StateCard
        className={className}
        icon={<PenIcon size={20} />}
        title="No posts yet"
        actions={
          <Link
            className="btn btn-ultra sm"
            href={`/my-blogs/${publicationId}/write`}
          >
            Write the first post
          </Link>
        }
      >
        Your publication exists on Sui. Write the first post and its body goes
        to Walrus, its record to the chain.
      </StateCard>
    );
  }

  return (
    <StateCard
      className={className}
      icon={<PenIcon size={20} />}
      title="No posts yet"
    >
      This publication exists on Sui but has not published anything yet. Posts
      appear here as soon as they are anchored on chain.
    </StateCard>
  );
}
