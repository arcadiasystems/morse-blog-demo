import Link from "next/link";
import { notFound } from "next/navigation";
import { EmptyState } from "@morse/shared/components/feedback/EmptyState";
import { PublicEntryCard } from "@/components/blog/PublicEntryCard";
import { classifyEntry } from "@morse/shared/utils/entry-status";
import { loadPublicBlog } from "@morse/shared/services/public-blog.server";
import { generatePublicBlogMetadata } from "@morse/shared/lib/metadata";

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

  return (
    <div className="flex flex-col py-8">
      <nav className="mb-6 font-mono text-sm">
        <Link
          href="/"
          className="text-muted-foreground hover:text-foreground"
        >
          ← back
        </Link>
      </nav>

      <h1 className="font-mono text-lg font-bold mb-1">
        {publication.name}
      </h1>
      <p className="font-mono text-xs text-muted-foreground mb-6">
        {visibleEntries.length}{" "}
        {visibleEntries.length === 1 ? "entry" : "entries"}
      </p>

      {visibleEntries.length === 0 ? (
        <EmptyState
          icon={<span className="font-mono text-lg">-</span>}
          title="No posts yet"
          description="This publication hasn't published any posts. Check back later."
        />
      ) : (
        <div className="flex flex-col">
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
  return generatePublicBlogMetadata(publicationId, "morse minimal");
}
