import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Lock } from "lucide-react";
import { Badge } from "@morse/shared/components/ui/badge";
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
  const isPremium = status === "premium";

  if (isPremium) {
    return (
      <article className="flex flex-col gap-8 py-6 sm:py-12">
        <Breadcrumb
          publicationId={publicationId}
          publicationName={publication.name}
          postTitle={entry.name || `Post #${entry.id}`}
        />
        <div className="grid lg:grid-cols-[1fr_280px] gap-8">
          {/* Main content */}
          <div className="flex flex-col gap-6">
            <PostHeader entry={entry} premium />
            <PremiumUnlock
              publicationId={publicationId}
              entryId={entry.id}
              collectionName={collection}
            />
          </div>
          {/* Sidebar */}
          <Sidebar
            entry={entry}
            publicationId={publicationId}
            publicationName={publication.name}
            revisionCount={revisionCount}
            isPremium
          />
        </div>
      </article>
    );
  }

  const revision = entry.revisions[entry.publicHead!];
  if (!revision) {
    notFound();
  }
  const content = await readPublicRevisionText(revision.blobRef);

  return (
    <article className="flex flex-col gap-8 py-6 sm:py-12">
      <Breadcrumb
        publicationId={publicationId}
        publicationName={publication.name}
        postTitle={entry.name || `Post #${entry.id}`}
      />
      <div className="grid lg:grid-cols-[1fr_280px] gap-8">
        {/* Main content */}
        <div className="flex flex-col gap-6">
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
        </div>
        {/* Sidebar */}
        <Sidebar
          entry={entry}
          publicationId={publicationId}
          publicationName={publication.name}
          revisionCount={revisionCount}
        />
      </div>
    </article>
  );
}

function Breadcrumb({
  publicationId,
  publicationName,
  postTitle,
}: {
  publicationId: string;
  publicationName: string;
  postTitle: string;
}) {
  return (
    <nav className="flex items-center gap-2 text-sm text-muted-foreground">
      <Link href="/" className="hover:text-foreground transition-colors">
        Home
      </Link>
      <span>/</span>
      <Link
        href={`/${publicationId}`}
        className="hover:text-foreground transition-colors"
      >
        {publicationName}
      </Link>
      <span>/</span>
      <span className="text-foreground font-medium truncate max-w-[200px]">
        {postTitle}
      </span>
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
    <header className="flex flex-col gap-4">
      <h1 className="text-3xl sm:text-4xl font-heading font-bold tracking-tight">
        {entry.name || `Untitled (#${entry.id})`}
      </h1>
      <div className="flex flex-wrap items-center gap-2">
        <Badge
          variant="outline"
          className="border-primary/40 bg-primary/10 text-primary text-[11px]"
        >
          #{entry.id}
        </Badge>
        <Badge
          variant="outline"
          className="border-border/60 text-muted-foreground text-[11px]"
        >
          v{revisionCount}
        </Badge>
        {premium && (
          <Badge
            variant="outline"
            className="gap-1 border-amber-400/40 bg-amber-400/10 text-amber-300 text-[11px]"
          >
            <Lock className="size-3" />
            Premium
          </Badge>
        )}
      </div>
      <hr className="border-border/60" />
    </header>
  );
}

function Sidebar({
  entry,
  publicationId,
  publicationName,
  revisionCount,
  isPremium,
}: {
  entry: import("@arcadiasystems/morse-sdk").Entry;
  publicationId: string;
  publicationName: string;
  revisionCount: number;
  isPremium?: boolean;
}) {
  return (
    <aside className="flex flex-col gap-6 lg:sticky lg:top-8 lg:self-start">
      {/* Post Info card */}
      <div className="rounded-xl border border-border/60 bg-card/50 p-5 flex flex-col gap-4">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Post Info
        </h3>
        <div className="flex flex-col gap-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Entry</span>
            <span className="font-mono font-medium">#{entry.id}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Versions</span>
            <span className="font-mono font-medium">{revisionCount}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Status</span>
            {isPremium ? (
              <span className="inline-flex items-center gap-1 text-amber-300 font-medium">
                <Lock className="size-3" />
                Premium
              </span>
            ) : (
              <span className="text-primary font-medium">Public</span>
            )}
          </div>
        </div>
      </div>

      {/* Navigation card */}
      <div className="rounded-xl border border-border/60 bg-card/50 p-5 flex flex-col gap-4">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Navigation
        </h3>
        <Link
          href={`/${publicationId}`}
          className="inline-flex items-center gap-2 text-sm text-primary hover:text-accent-foreground transition-colors"
        >
          <ArrowLeft className="size-4" />
          Back to {publicationName}
        </Link>
      </div>
    </aside>
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
