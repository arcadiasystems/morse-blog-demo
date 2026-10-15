import { notFound } from "next/navigation";
import { EmptyPublication } from "@/components/feedback/EmptyPublication";
import { PostList, type PostRowData } from "@/components/blog/PostList";
import { PublicationHeader } from "@/components/blog/PublicationHeader";
import { readerHead } from "@/utils/entry-status";
import { loadPublicBlog } from "@/services/public-blog.server";
import {
  anchorEntryRevisions,
  loadPublicationHistory,
  loadPublicationOwner,
} from "@/services/publication-history.server";
import styles from "./publication.module.css";

// Always re-fetch on each request - testnet state changes minute-to-minute
// and a stale cache makes the public reader feel broken right after a publish.
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function PublicBlogIndexPage({
  params,
}: {
  params: Promise<{ publicationId: string }>;
}) {
  const { publicationId } = await params;
  const [data, history] = await Promise.all([
    loadPublicBlog(publicationId),
    loadPublicationHistory(publicationId),
  ]);

  if (!data) {
    notFound();
  }

  const { publication, entries } = data;
  const ownerAddress = history?.ownerCapId
    ? await loadPublicationOwner(history.ownerCapId)
    : null;

  const rows: PostRowData[] = entries.flatMap((entry) => {
    const head = readerHead(entry);
    if (!head) return [];
    const anchor = history
      ? anchorEntryRevisions(history, entry)[head.index]
      : null;
    return [
      {
        entry,
        premium: head.premium,
        revisionNumber: head.index + 1,
        anchoredAtMs: anchor?.timestampMs ?? null,
      },
    ];
  });

  return (
    <>
      <PublicationHeader
        publication={publication}
        entryCount={rows.length}
        ownerAddress={ownerAddress}
      />
      <section>
        <div className={`wrap ${styles.posts}`}>
          {rows.length === 0 ? (
            <EmptyPublication publicationId={publication.id} />
          ) : (
            <PostList publicationId={publicationId} rows={rows} />
          )}
        </div>
      </section>
    </>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ publicationId: string }>;
}) {
  const { publicationId } = await params;
  const data = await loadPublicBlog(publicationId);
  if (!data) {
    return { title: "Publication not found" };
  }
  return {
    title: data.publication.name,
    description: "A public blog on Sui testnet, stored on Walrus.",
  };
}
