import Link from "next/link";
import { ArrowLeft, BookOpen, FileText } from "lucide-react";
import { notFound } from "next/navigation";
import { Button } from "@morse/shared/components/ui/button";
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

  return (
    <div className="flex flex-col gap-8 py-4 sm:py-8 max-w-4xl">
      <Button
        asChild
        variant="ghost"
        size="sm"
        className="self-start gap-1.5 -ml-2"
      >
        <Link href="/">
          <ArrowLeft className="size-4" />
          Home
        </Link>
      </Button>

      <header className="flex flex-col gap-3">
        <Badge
          variant="outline"
          className="self-start border-primary/40 bg-primary/10 text-primary"
        >
          Public blog
        </Badge>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
          {publication.name}
        </h1>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="font-mono">/{publication.slug}</span>
          <span>·</span>
          <span>
            {publicCount} {publicCount === 1 ? "post" : "posts"}
          </span>
        </div>
      </header>

      {visibleEntries.length === 0 ? (
        <EmptyState
          icon={<FileText className="size-5" />}
          title="No posts yet"
          description="This publication hasn't published any posts. Check back later."
        />
      ) : (
        <ul className="grid gap-4">
          {visibleEntries.map((entry) => (
            <li key={entry.id}>
              <PublicEntryCard
                entry={entry}
                publicationId={publicationId}
                premium={classifyEntry(entry) === "premium"}
              />
            </li>
          ))}
        </ul>
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
