import Link from "next/link";
import { notFound } from "next/navigation";
import { EmptyState } from "@morse/shared/components/feedback/EmptyState";
import { MarkdownRenderer } from "@/components/blog/MarkdownRenderer";
import { PremiumUnlock } from "@morse/shared/components/blog/PremiumUnlock";
import { classifyEntry } from "@morse/shared/utils/entry-status";
import {
  loadPublicEntry,
  readPublicRevisionText,
} from "@morse/shared/services/public-blog.server";
import { generatePostMetadata } from "@morse/shared/lib/metadata";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function PublicPostPage({
  params,
  searchParams,
}: {
  params: Promise<{ publicationId: string; entryId: string }>;
  searchParams: Promise<{ collection?: string }>;
}) {
  const { publicationId, entryId } = await params;
  const { collection } = await searchParams;
  const entryIdNum = Number(entryId);
  if (!Number.isFinite(entryIdNum)) {
    notFound();
  }
  const data = await loadPublicEntry(publicationId, entryIdNum, collection);
  if (!data) {
    notFound();
  }
  const { publication, entry } = data;
  const status = classifyEntry(entry);

  if (status === "draft" || status === "empty") {
    notFound();
  }

  const revisionCount = entry.revisions.length;

  if (status === "premium") {
    return (
      <article className="flex flex-col py-8">
        <BackNav publicationId={publicationId} />
        <PostHeader entry={entry} revisionCount={revisionCount} premium />
        <PremiumUnlock
          publicationId={publicationId}
          entryId={entry.id}
          collectionName={collection}
        />
      </article>
    );
  }

  const revision = entry.revisions[entry.publicHead!];
  if (!revision) {
    notFound();
  }
  const content = await readPublicRevisionText(revision.blobRef);

  return (
    <article className="flex flex-col py-8">
      <BackNav publicationId={publicationId} />
      <PostHeader entry={entry} revisionCount={revisionCount} />
      {content ? (
        <MarkdownRenderer source={content} />
      ) : (
        <EmptyState
          icon={<span className="font-mono text-lg">!</span>}
          title="Could not load content"
          description="The Walrus aggregator did not return bytes for this revision."
        />
      )}
    </article>
  );
}

function BackNav({ publicationId }: { publicationId: string }) {
  return (
    <nav className="mb-6 font-mono text-sm">
      <Link
        href={`/${publicationId}`}
        className="text-muted-foreground hover:text-foreground"
      >
        ← back
      </Link>
    </nav>
  );
}

function PostHeader({
  entry,
  revisionCount,
  premium,
}: {
  entry: import("@arcadiasystems/morse-sdk").Entry;
  revisionCount: number;
  premium?: boolean;
}) {
  return (
    <header className="mb-6">
      <h1 className="text-xl font-bold font-mono">
        {entry.name || `Untitled (#${entry.id})`}
      </h1>
      <p className="mt-1 text-xs text-muted-foreground font-mono">
        #{entry.id} · {premium ? "premium" : "public"} · v{revisionCount}
      </p>
      <hr className="border-border mt-4" />
    </header>
  );
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ publicationId: string; entryId: string }>;
  searchParams: Promise<{ collection?: string }>;
}) {
  const { publicationId, entryId } = await params;
  const { collection } = await searchParams;
  return generatePostMetadata(
    { publicationId, entryId },
    collection,
    "morse minimal",
  );
}
