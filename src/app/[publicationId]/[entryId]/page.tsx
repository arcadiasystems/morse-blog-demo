import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Entry } from "@arcadiasystems/morse-sdk";
import { LockIcon } from "@/components/brand/icons";
import { BodySkeleton } from "@/components/feedback/BodySkeleton";
import { PostRail, type RailRevision } from "@/components/blog/PostRail";
import { PremiumUnlock } from "@/components/blog/PremiumUnlock";
import { RevisionBody } from "@/components/blog/RevisionBody";
import { blobRefLabel, walrusRevisionUrl } from "@/lib/explorer";
import {
  loadPublicEntry,
  resolvePublicBlobId,
} from "@/services/public-blog.server";
import {
  anchorEntryRevisions,
  loadPublicationHistory,
} from "@/services/publication-history.server";
import { truncateAddress } from "@/utils/address";
import { readerHead } from "@/utils/entry-status";
import { formatChainDate } from "@/utils/format";
import styles from "./post.module.css";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type PostParams = Promise<{ publicationId: string; entryId: string }>;
type PostSearchParams = Promise<{
  collection?: string;
  /** 1-based revision number to read instead of the current one. */
  rev?: string | string[];
}>;

export default async function PublicPostPage({
  params,
  searchParams,
}: {
  params: PostParams;
  searchParams: PostSearchParams;
}) {
  const { publicationId, entryId } = await params;
  const { collection, rev } = await searchParams;
  const entryIdNum = Number(entryId);
  if (!Number.isFinite(entryIdNum)) {
    notFound();
  }

  const [data, history] = await Promise.all([
    loadPublicEntry(publicationId, entryIdNum, collection),
    loadPublicationHistory(publicationId),
  ]);
  if (!data) {
    notFound();
  }
  const { publication, entry } = data;
  const head = readerHead(entry);
  if (!head) {
    notFound();
  }

  const viewedIndex =
    rev === undefined ? head.index : requestedRevisionIndex(entry, head, rev);
  if (viewedIndex === null) {
    notFound();
  }

  const revision = entry.revisions[viewedIndex];
  const anchors = history ? anchorEntryRevisions(history, entry) : [];
  const anchor = anchors[viewedIndex] ?? null;
  const blobId = await resolvePublicBlobId(revision.blobRef);
  const blobHref = walrusRevisionUrl(revision.blobRef, blobId);

  const hrefFor = (index: number) =>
    postHref(publicationId, entry.id, collection, index === head.index ? null : index);
  const readable = (index: number) =>
    !head.premium && !entry.revisions[index].encrypted;

  const earlierIndex = entry.revisions
    .slice(0, viewedIndex)
    .findLastIndex((_, index) => readable(index));
  const earlierRevision =
    earlierIndex >= 0
      ? { number: earlierIndex + 1, href: hrefFor(earlierIndex) }
      : null;

  const railRevisions: RailRevision[] = entry.revisions
    .slice(0, head.index + 1)
    .map((_, index) => ({
      number: index + 1,
      anchor: anchors[index] ?? null,
      current: index === head.index,
      viewing: index === viewedIndex,
      href: readable(index) ? hrefFor(index) : null,
    }))
    .reverse();

  return (
    <section>
      <div className={`wrap ${styles.inner}`}>
        <article>
          <nav className={styles.crumbs} aria-label="Breadcrumb">
            <Link href={`/${publicationId}`}>{publication.name}</Link>
            <span className={styles.sep} aria-hidden="true">
              /
            </span>
            <span className={styles.here} aria-current="page">
              Entry #{entry.id}
            </span>
          </nav>
          <h1>{entry.name || `Untitled (#${entry.id})`}</h1>
          <div className={styles.meta}>
            {head.premium ? (
              <span className="chip prem">
                <LockIcon size={11} strokeWidth={2.4} />
                Premium
              </span>
            ) : (
              <span className="chip pub">Public</span>
            )}
            <span>Entry #{entry.id}</span>
            <span>v{viewedIndex + 1}</span>
            {anchor ? (
              <time dateTime={new Date(anchor.timestampMs).toISOString()}>
                {formatChainDate(anchor.timestampMs)}
              </time>
            ) : null}
            {head.premium ? null : (
              <span>
                by{" "}
                <span className={styles.author} title={revision.author}>
                  {truncateAddress(revision.author)}
                </span>
              </span>
            )}
          </div>
          {viewedIndex !== head.index ? (
            <p className={styles.notice}>
              You are reading v{viewedIndex + 1}, an earlier revision.{" "}
              <Link href={hrefFor(head.index)}>
                Read the current version, v{head.index + 1}
              </Link>
            </p>
          ) : null}

          {head.premium ? (
            <PremiumUnlock
              className={styles.bodyTop}
              publicationId={publicationId}
              entryId={entry.id}
              collectionName={collection}
              revisionNumber={viewedIndex + 1}
              blobHref={blobHref}
            />
          ) : (
            <Suspense
              key={viewedIndex}
              fallback={<BodySkeleton className={styles.bodyTop} />}
            >
              <RevisionBody
                className={styles.bodyTop}
                blobRef={revision.blobRef}
                revisionNumber={viewedIndex + 1}
                blobHref={blobHref}
                earlierRevision={earlierRevision}
              />
            </Suspense>
          )}
        </article>

        <PostRail
          publicationId={publication.id}
          entryId={entry.id}
          revisionNumber={viewedIndex + 1}
          revisionCount={head.index + 1}
          blob={{ href: blobHref, label: blobId ?? blobRefLabel(revision.blobRef) }}
          anchor={anchor}
          accessPolicy={revision.accessPolicy}
          revisions={railRevisions}
        />
      </div>
    </section>
  );
}

/**
 * Index of the revision named by `?rev=`, or null when the value is
 * malformed, newer than what readers see, or not publicly readable
 * (premium and encrypted revisions only render through the Seal unlock).
 */
function requestedRevisionIndex(
  entry: Entry,
  head: { index: number; premium: boolean },
  rev: string | string[],
): number | null {
  if (head.premium || typeof rev !== "string" || !/^[1-9]\d*$/.test(rev)) {
    return null;
  }
  const index = Number(rev) - 1;
  if (index > head.index || entry.revisions[index].encrypted) return null;
  return index;
}

function postHref(
  publicationId: string,
  entryId: number,
  collection: string | undefined,
  revisionIndex: number | null,
): string {
  const query = new URLSearchParams();
  if (collection) query.set("collection", collection);
  if (revisionIndex !== null) query.set("rev", String(revisionIndex + 1));
  const qs = query.toString();
  return `/${publicationId}/${entryId}${qs ? `?${qs}` : ""}`;
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: PostParams;
  searchParams: PostSearchParams;
}) {
  const { publicationId, entryId } = await params;
  const { collection } = await searchParams;
  const entryIdNum = Number(entryId);
  if (!Number.isFinite(entryIdNum)) {
    return { title: "Post not found" };
  }
  const data = await loadPublicEntry(publicationId, entryIdNum, collection);
  if (!data) return { title: "Post not found" };
  const head = readerHead(data.entry);
  return {
    title: data.entry.name || `Post #${data.entry.id}`,
    description: head?.premium
      ? "A Seal-gated premium post on Sui testnet."
      : "A public post on Sui testnet.",
  };
}
