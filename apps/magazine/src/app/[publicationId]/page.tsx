import Link from "next/link";
import { FileText } from "lucide-react";
import { notFound } from "next/navigation";
import { Badge } from "@morse/shared/components/ui/badge";
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

  const [featured, ...rest] = visibleEntries;

  return (
    <div className="flex flex-col gap-10 py-6 sm:py-12">
      {/* Breadcrumb bar */}
      <nav className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link
            href="/"
            className="hover:text-foreground transition-colors"
          >
            Home
          </Link>
          <span>/</span>
          <span className="text-foreground font-medium truncate">
            {publication.name}
          </span>
        </div>
        <Badge
          variant="outline"
          className="border-primary/40 bg-primary/10 text-primary text-[11px] shrink-0"
        >
          {publicCount} {publicCount === 1 ? "post" : "posts"}
        </Badge>
      </nav>

      {/* Publication title */}
      <header>
        <h1 className="text-4xl sm:text-6xl font-heading font-bold uppercase tracking-tight">
          {publication.name}
        </h1>
      </header>

      {visibleEntries.length === 0 ? (
        <EmptyState
          icon={<FileText className="size-5" />}
          title="No posts yet"
          description="This publication hasn't published any posts. Check back later."
        />
      ) : (
        <div className="flex flex-col gap-10">
          {/* Featured hero entry */}
          {featured && (
            <PublicEntryCard
              entry={featured}
              publicationId={publicationId}
              premium={classifyEntry(featured) === "premium"}
              featured
            />
          )}

          {/* Remaining entries */}
          {rest.length > 0 && (
            <div className="flex flex-col gap-6">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Latest Posts
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {rest.map((entry) => (
                  <PublicEntryCard
                    key={entry.id}
                    entry={entry}
                    publicationId={publicationId}
                    premium={classifyEntry(entry) === "premium"}
                  />
                ))}
              </div>
            </div>
          )}
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
  return generatePublicBlogMetadata(publicationId, "morse blog");
}
