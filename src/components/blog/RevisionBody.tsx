import type { BlobRef } from "@arcadiasystems/morse-sdk";
import { MarkdownRenderer } from "@/components/blog/MarkdownRenderer";
import { RevisionLoadError } from "@/components/feedback/RevisionLoadError";
import { readPublicRevisionText } from "@/services/public-blog.server";

/**
 * Fetches a public revision's Markdown from Walrus and renders it. Render
 * inside `<Suspense fallback={<BodySkeleton />}>` so the page streams while
 * the aggregator responds; a failed or timed-out fetch renders the warn
 * state with recovery actions.
 */
export async function RevisionBody({
  blobRef,
  revisionNumber,
  blobHref,
  earlierRevision,
  className,
}: {
  blobRef: BlobRef;
  revisionNumber: number;
  blobHref: string;
  earlierRevision: { number: number; href: string } | null;
  className?: string;
}) {
  const text = await readPublicRevisionText(blobRef);

  if (text === null) {
    return (
      <RevisionLoadError
        className={className}
        revisionNumber={revisionNumber}
        blobHref={blobHref}
        earlierRevision={earlierRevision}
      />
    );
  }

  return <MarkdownRenderer source={text} className={className} />;
}
