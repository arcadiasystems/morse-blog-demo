import Link from "next/link";
import { ArrowUpRight, Lock } from "lucide-react";
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
  const trimmed = preview?.replace(/^#+\s*/, "").trim() ?? "";
  const snippet = trimmed.slice(0, 220);

  return (
    <Link
      href={`/${publicationId}/${entry.id}`}
      className="group relative overflow-hidden rounded-xl border border-border/60 bg-card/40 hover:border-primary/40 hover:bg-card/70 transition-all p-5 flex flex-col gap-3"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-12 -right-12 size-32 rounded-full bg-primary/0 blur-2xl group-hover:bg-primary/15 transition-colors"
      />
      <div className="relative flex items-start justify-between gap-3">
        <h3 className="text-lg font-semibold tracking-tight leading-snug group-hover:text-primary transition-colors">
          {entry.name || `Untitled (#${entry.id})`}
        </h3>
        {premium ? (
          <span className="shrink-0 inline-flex items-center gap-1 rounded-full border border-amber-400/40 bg-amber-400/10 text-amber-300 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide">
            <Lock className="size-3" />
            Premium
          </span>
        ) : null}
      </div>
      {premium ? (
        <p className="text-sm text-muted-foreground">
          Connect a wallet to unlock and read this post.
        </p>
      ) : snippet ? (
        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
          {snippet}
          {trimmed.length > snippet.length ? "..." : ""}
        </p>
      ) : null}
      <div className="relative flex items-center justify-between text-[11px] text-muted-foreground mt-1">
        <span className="font-mono">Entry #{entry.id}</span>
        <ArrowUpRight className="size-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
      </div>
    </Link>
  );
}
