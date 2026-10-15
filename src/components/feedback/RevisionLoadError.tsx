"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { WarnIcon } from "@/components/brand/icons";
import { StateCard } from "@/components/feedback/StateCard";

type Props = {
  /** 1-based revision number that failed to load. */
  revisionNumber: number;
  /** Aggregator URL for the revision's bytes. */
  blobHref: string;
  /** Most recent earlier revision readers can fall back to, if any. */
  earlierRevision?: { number: number; href: string } | null;
  /**
   * Retry handler. Defaults to re-rendering the route on the server, which
   * repeats the Walrus fetch for server-rendered bodies.
   */
  onRetry?: () => void;
  retrying?: boolean;
  className?: string;
};

/** Warn state shown when the Walrus aggregator fails or times out. */
export function RevisionLoadError({
  revisionNumber,
  blobHref,
  earlierRevision,
  onRetry,
  retrying,
  className,
}: Props) {
  const router = useRouter();
  const [refreshing, startRefresh] = useTransition();
  const retry = onRetry ?? (() => startRefresh(() => router.refresh()));
  const busy = retrying ?? refreshing;

  return (
    <StateCard
      tone="warn"
      role="alert"
      className={className}
      icon={<WarnIcon size={20} />}
      title="Could not load this revision"
      actions={
        <>
          <button
            type="button"
            className="btn btn-ink sm"
            onClick={retry}
            disabled={busy}
          >
            {busy ? "Trying again" : "Try again"}
          </button>
          <a
            className="btn btn-soft sm"
            href={blobHref}
            target="_blank"
            rel="noreferrer"
          >
            Open blob on Walrus
          </a>
          {earlierRevision ? (
            <Link className="btn btn-soft sm" href={earlierRevision.href}>
              Read v{earlierRevision.number} instead
            </Link>
          ) : null}
        </>
      }
    >
      The Walrus aggregator did not return bytes for revision v
      {revisionNumber}. The blob may have expired after a testnet reset, or
      the aggregator may be rate-limiting. The on-chain record is unaffected.
    </StateCard>
  );
}
