import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Lock } from "lucide-react";
import { Badge } from "@morse/shared/components/ui/badge";
import { Button } from "@morse/shared/components/ui/button";
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
      <article className="flex flex-col gap-6 py-4 sm:py-8 max-w-3xl">
        <BackLink
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
    <article className="flex flex-col gap-6 py-4 sm:py-8 max-w-3xl">
      <BackLink
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

function BackLink({
  publicationId,
  publicationName,
}: {
  publicationId: string;
  publicationName: string;
}) {
  return (
    <Button
      asChild
      variant="ghost"
      size="sm"
      className="self-start gap-1.5 -ml-2"
    >
      <Link href={`/${publicationId}`}>
        <ArrowLeft className="size-4" />
        {publicationName}
      </Link>
    </Button>
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
    <header className="flex flex-col gap-3 pb-4 border-b border-border/60">
      <div className="flex items-center gap-2">
        {premium ? (
          <Badge variant="outline" className="gap-1 border-amber-400/40 bg-amber-400/10 text-amber-300">
            <Lock className="size-3" />
            Premium
          </Badge>
        ) : (
          <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary">
            Post
          </Badge>
        )}
        <span className="text-xs text-muted-foreground font-mono">
          #{entry.id}
        </span>
        <span className="text-xs text-muted-foreground">
          · v{revisionCount}
        </span>
      </div>
      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
        {entry.name || `Untitled (#${entry.id})`}
      </h1>
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
  return generatePostMetadata({ publicationId, entryId }, collection, "morse blog");
}
