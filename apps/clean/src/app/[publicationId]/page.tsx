import Link from "next/link";
import { notFound } from "next/navigation";
import { EmptyState } from "@morse/shared/components/feedback/EmptyState";
import { PublicEntryCard } from "@/components/blog/PublicEntryCard";
import { classifyEntry } from "@morse/shared/utils/entry-status";
import { loadPublicBlog } from "@morse/shared/services/public-blog.server";
import { generatePublicBlogMetadata } from "@morse/shared/lib/metadata";

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
  const data = await loadPublicBlog(publicationId);

  if (!data) {
    notFound();
  }

  const { publication, entries } = data;
  const visibleEntries = entries.filter((e) => {
    const s = classifyEntry(e);
    return s === "public" || s === "premium";
  });
  const publicCount = visibleEntries.filter(
    (e) => classifyEntry(e) === "public",
  ).length;

  return (
    <div className="flex flex-col gap-6 py-4 sm:py-8">
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link
          href="/"
          className="hover:text-foreground transition-colors"
        >
          Home
        </Link>
        <span className="text-muted-foreground/60">&rsaquo;</span>
        <span className="text-foreground">{publication.name}</span>
      </nav>

      <header className="flex items-baseline gap-3 pb-4 border-b border-border">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
          {publication.name}
        </h1>
        <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
          {publicCount} {publicCount === 1 ? "post" : "posts"}
        </span>
      </header>

      {visibleEntries.length === 0 ? (
        <EmptyState
          icon={null}
          title="No posts yet"
          description="This publication hasn't published any posts. Check back later."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {visibleEntries.map((entry) => (
            <PublicEntryCard
              key={entry.id}
              entry={entry}
              publicationId={publicationId}
              premium={classifyEntry(entry) === "premium"}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ publicationId: string }>;
}) {
  const { publicationId } = await params;
  return generatePublicBlogMetadata(publicationId, "morse clean");
}
