import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Lock } from "lucide-react";
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

  if (status === "premium") {
    return (
      <article className="flex flex-col py-8 sm:py-14 max-w-2xl mx-auto">
        <PublicationLink
          publicationId={publicationId}
          publicationName={publication.name}
        />
        <PostHeader entry={entry} premium />
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
    <article className="flex flex-col py-8 sm:py-14 max-w-2xl mx-auto">
      <PublicationLink
        publicationId={publicationId}
        publicationName={publication.name}
      />
      <PostHeader entry={entry} />
      {content ? (
        <MarkdownRenderer source={content} />
      ) : (
        <EmptyState
          icon={<Lock className="size-5" />}
          title="Could not load content"
          description="The Walrus aggregator did not return bytes for this revision. The blob may be expired, unavailable, or the aggregator may be rate-limiting. Try refreshing in a moment."
        />
      )}
    </article>
  );
}

function PublicationLink({
  publicationId,
  publicationName,
}: {
  publicationId: string;
  publicationName: string;
}) {
  return (
    <nav className="mb-8">
      <Link
        href={`/${publicationId}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="size-3.5" />
        {publicationName}
      </Link>
    </nav>
  );
}

function PostHeader({
  entry,
  premium,
}: {
  entry: import("@arcadiasystems/morse-sdk").Entry;
  premium?: boolean;
}) {
  const revisionCount = entry.revisions.length;
  return (
    <header className="text-center mb-2">
      <h1 className="text-3xl font-semibold tracking-tight font-serif">
        {entry.name || `Untitled (#${entry.id})`}
        {premium && (
          <span className="text-base font-normal text-muted-foreground">
            {" "}
            (premium)
          </span>
        )}
      </h1>
      <p className="mt-2 text-sm italic text-muted-foreground">
        Entry #{entry.id} · Version {revisionCount}
      </p>
      <hr className="border-border mt-6" />
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
  return generatePostMetadata({ publicationId, entryId }, collection, "morse editorial");
}
