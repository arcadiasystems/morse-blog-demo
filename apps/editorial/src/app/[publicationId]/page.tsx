import Link from "next/link";
import { FileText } from "lucide-react";
import { notFound } from "next/navigation";
import { EmptyState } from "@morse/shared/components/feedback/EmptyState";
import { PublicEntryCard } from "@/components/blog/PublicEntryCard";
import { classifyEntry } from "@morse/shared/utils/entry-status";
import {
  loadPublicBlog,
  readPublicRevisionText,
} from "@morse/shared/services/public-blog.server";
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

  // Fetch content previews for public entries
  const previews = new Map<number, string>();
  await Promise.all(
    visibleEntries.map(async (entry) => {
      if (classifyEntry(entry) !== "public") return;
      const rev = entry.revisions[entry.publicHead!];
      if (!rev) return;
      try {
        const text = await readPublicRevisionText(rev.blobRef);
        if (text) {
          const cleaned = text.replace(/^#+\s*/gm, "").trim();
          previews.set(entry.id, cleaned.slice(0, 200));
        }
      } catch {
        // Silently skip preview if blob fetch fails
      }
    }),
  );

  return (
    <div className="flex flex-col py-8 sm:py-14 max-w-2xl mx-auto">
      <nav className="mb-8">
        <Link
          href="/"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          morse editorial
        </Link>
      </nav>

      <header className="text-center mb-2">
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight font-serif">
          {publication.name}
        </h1>
        <p className="mt-2 text-sm italic text-muted-foreground">
          {publicCount} {publicCount === 1 ? "post" : "posts"}
        </p>
      </header>

      <hr className="border-border my-6" />

      {visibleEntries.length === 0 ? (
        <EmptyState
          icon={<FileText className="size-5" />}
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
              preview={previews.get(entry.id)}
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
  return generatePublicBlogMetadata(publicationId, "morse editorial");
}
