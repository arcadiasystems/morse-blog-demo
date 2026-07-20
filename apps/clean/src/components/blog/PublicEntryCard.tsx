import Link from "next/link";
import type { Entry } from "@arcadiasystems/morse-sdk";

export function PublicEntryCard({
  entry,
  publicationId,
  premium,
  preview,
}: {
  entry: Entry;
  publicationId: string;
  premium?: boolean;
  preview?: string;
}) {
  const trimmed =
    preview
      ?.replace(/^#+\s*/gm, "")
      .replace(/!\[.*?\]\(.*?\)/g, "")
      .replace(/\[([^\]]+)\]\(.*?\)/g, "$1")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/~~([^~]+)~~/g, "$1")
      .replace(/\*{1,2}([^*]+)\*{1,2}/g, "$1")
      .replace(/^>\s?/gm, "")
      .replace(/^[-*]\s+/gm, "")
      .replace(/^---+$/gm, "")
      .replace(/\n{2,}/g, " ")
      .trim() ?? "";
  const snippet = trimmed.slice(0, 220);

  return (
    <Link
      href={`/${publicationId}/${entry.id}`}
      className="relative block bg-card rounded-lg shadow-sm border border-border p-5 hover:shadow-md transition-shadow"
    >
      {premium && (
        <span className="absolute top-3 right-3 bg-primary text-primary-foreground text-[10px] font-medium rounded-full px-2 py-0.5">
          Premium
        </span>
      )}
      <h3 className="text-lg font-semibold text-foreground leading-snug pr-16">
        {entry.name || `Untitled (#${entry.id})`}
      </h3>
      {premium ? (
        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
          Connect a wallet to unlock and read this post.
        </p>
      ) : snippet ? (
        <p className="text-sm text-muted-foreground mt-2 leading-relaxed line-clamp-2">
          {snippet}
          {trimmed.length > snippet.length ? "..." : ""}
        </p>
      ) : null}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
        <span className="text-xs text-muted-foreground">
          Entry #{entry.id}
        </span>
        <span className="text-xs text-primary font-medium">
          Read &rarr;
        </span>
      </div>
    </Link>
  );
}
