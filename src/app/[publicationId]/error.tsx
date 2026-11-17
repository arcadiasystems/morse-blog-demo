"use client";

import Link from "next/link";
import { WarnIcon } from "@/components/brand/icons";
import { StateCard } from "@/components/feedback/StateCard";
import headerStyles from "@/components/blog/PublicationHeader.module.css";

/**
 * Shown when a public blog or post could not be read from Sui for a reason
 * other than "it does not exist" (that case is the 404 page). The failure
 * itself is logged on the server by `public-blog.server.ts`.
 */
export default function PublicBlogError({
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <section>
      <div className={`wrap ${headerStyles.inner}`}>
        <Link className={headerStyles.back} href="/">
          <span aria-hidden="true">←</span> Home
        </Link>
        <StateCard
          tone="warn"
          role="alert"
          icon={<WarnIcon size={20} />}
          title="Could not load this blog"
          actions={
            <button
              type="button"
              className="btn btn-ink sm"
              onClick={() => unstable_retry()}
            >
              Try again
            </button>
          }
        >
          The read from Sui did not complete, so this page cannot be shown
          right now. The blog and its on-chain record are unaffected.
        </StateCard>
      </div>
    </section>
  );
}
