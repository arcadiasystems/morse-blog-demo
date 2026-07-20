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
  const snippet = trimmed.slice(0, 150);

  return (
    <Link
      href={`/${publicationId}/${entry.id}`}
      className="block py-5 border-b border-border"
    >
      <h3 className="text-xl font-semibold tracking-tight leading-snug font-serif hover:underline">
        {entry.name || `Untitled (#${entry.id})`}
        {premium && (
          <span className="text-sm font-normal text-muted-foreground">
            {" "}
            (premium)
          </span>
        )}
      </h3>
      <p className="mt-1 text-xs text-muted-foreground">
        Entry #{entry.id}
      </p>
      {premium ? (
        <p className="mt-2 text-sm text-muted-foreground">
          Connect a wallet to unlock and read this post.
        </p>
      ) : snippet ? (
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed line-clamp-2">
          {snippet}
          {trimmed.length > snippet.length ? "..." : ""}
        </p>
      ) : null}
    </Link>
  );
}
