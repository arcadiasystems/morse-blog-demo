import Link from "next/link";
import { Lock } from "lucide-react";
import { Badge } from "@morse/shared/components/ui/badge";
import type { Entry } from "@arcadiasystems/morse-sdk";

export function PublicEntryCard({
  entry,
  publicationId,
  premium,
  preview,
  featured = false,
}: {
  entry: Entry;
  publicationId: string;
  premium?: boolean;
  preview?: string;
  featured?: boolean;
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
  const entryNum = String(entry.id).padStart(2, "0");

  if (featured) {
    return (
      <Link
        href={`/${publicationId}/${entry.id}`}
        className="group relative block rounded-xl border border-border/60 bg-card/80 p-8 sm:p-10 hover:border-primary/60 transition-all"
      >
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold uppercase tracking-widest text-primary">
              Featured
            </span>
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
          <h3 className="text-2xl sm:text-3xl font-heading font-bold tracking-tight leading-snug group-hover:text-primary transition-colors">
            {entry.name || `Untitled (#${entry.id})`}
          </h3>
          {premium ? (
            <p className="text-sm text-muted-foreground max-w-2xl">
              Connect a wallet to unlock and read this post.
            </p>
          ) : snippet ? (
            <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl line-clamp-3">
              {snippet}
              {trimmed.length > snippet.length ? "..." : ""}
            </p>
          ) : null}
          <span className="text-sm font-medium text-primary group-hover:text-accent-foreground transition-colors mt-2">
            Read more &rarr;
          </span>
        </div>
        <span
          aria-hidden
          className="absolute top-6 right-8 text-5xl font-heading font-bold text-muted-foreground/10 leading-none"
        >
          {entryNum}
        </span>
      </Link>
    );
  }

  return (
    <Link
      href={`/${publicationId}/${entry.id}`}
      className="group relative flex flex-col gap-3 rounded-xl border border-border/60 bg-card/50 border-t-2 border-t-primary p-5 overflow-hidden hover:border-t-4 transition-all"
    >
      {/* Large muted entry number in top-right */}
      <span
        aria-hidden
        className="absolute top-3 right-4 text-3xl font-heading font-bold text-muted-foreground/20 leading-none"
      >
        {entryNum}
      </span>

      {/* Title */}
      <h3 className="text-lg font-heading font-semibold tracking-tight leading-snug pr-12 group-hover:text-primary transition-colors">
        {entry.name || `Untitled (#${entry.id})`}
      </h3>

      {/* Snippet */}
      {premium ? (
        <p className="text-sm text-muted-foreground">
          Connect a wallet to unlock and read this post.
        </p>
      ) : snippet ? (
        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
          {snippet}
          {trimmed.length > snippet.length ? "..." : ""}
        </p>
      ) : null}

      {/* Bottom row */}
      <div className="flex items-center justify-between mt-auto pt-2">
        <span className="text-sm font-medium text-primary group-hover:text-accent-foreground transition-colors">
          Read more &rarr;
        </span>
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
    </Link>
  );
}
