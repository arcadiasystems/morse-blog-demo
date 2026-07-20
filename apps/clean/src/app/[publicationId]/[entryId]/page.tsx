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
      <article className="flex flex-col gap-6 py-4 sm:py-8 max-w-3xl mx-auto">
        <Breadcrumbs
          publicationId={publicationId}
          publicationName={publication.name}
          postTitle={entry.name || `Untitled (#${entry.id})`}
        />
        <div className="bg-card rounded-lg shadow-sm border border-border p-6 sm:p-10">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {entry.name || `Untitled (#${entry.id})`}
          </h1>
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <span className="bg-muted rounded-full px-2 py-0.5 text-xs text-muted-foreground">
              Entry #{entry.id}
            </span>
            <span className="bg-muted rounded-full px-2 py-0.5 text-xs text-muted-foreground">
              Version {revisionCount}
            </span>
            <span className="bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs font-medium">
              Premium
            </span>
          </div>
          <hr className="border-border my-6" />
          <PremiumUnlock
            publicationId={publicationId}
            entryId={entry.id}
            collectionName={collection}
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
    <article className="flex flex-col gap-6 py-4 sm:py-8 max-w-3xl mx-auto">
      <Breadcrumbs
        publicationId={publicationId}
        publicationName={publication.name}
        postTitle={entry.name || `Untitled (#${entry.id})`}
      />
      <div className="bg-card rounded-lg shadow-sm border border-border p-6 sm:p-10">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {entry.name || `Untitled (#${entry.id})`}
        </h1>
        <div className="flex flex-wrap items-center gap-2 mt-3">
          <span className="bg-muted rounded-full px-2 py-0.5 text-xs text-muted-foreground">
            Entry #{entry.id}
          </span>
          <span className="bg-muted rounded-full px-2 py-0.5 text-xs text-muted-foreground">
            Version {revisionCount}
          </span>
        </div>
        <hr className="border-border my-6" />
        {content ? (
          <MarkdownRenderer source={content} />
        ) : (
          <EmptyState
            icon={null}
            title="Could not load content"
            description="The Walrus aggregator did not return bytes for this revision. The blob may be expired, unavailable, or the aggregator may be rate-limiting. Try refreshing in a moment."
          />
        )}
      </div>
    </article>
  );
}

function Breadcrumbs({
  publicationId,
  publicationName,
  postTitle,
}: {
  publicationId: string;
  publicationName: string;
  postTitle: string;
}) {
  return (
    <nav className="flex items-center gap-1.5 text-sm text-muted-foreground flex-wrap">
      <Link href="/" className="hover:text-foreground transition-colors">
        Home
      </Link>
      <span className="text-muted-foreground/60">&rsaquo;</span>
      <Link
        href={`/${publicationId}`}
        className="hover:text-foreground transition-colors"
      >
        {publicationName}
      </Link>
      <span className="text-muted-foreground/60">&rsaquo;</span>
      <span className="text-foreground truncate max-w-[200px]">
        {postTitle}
      </span>
    </nav>
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
  return generatePostMetadata({ publicationId, entryId }, collection, "morse clean");
}
