import Link from "next/link";
import { ArrowUpRight, BookOpen, Layers, Users } from "lucide-react";
import { Badge } from "../../components/ui/badge";
import type { OwnedPublicationWithDetails } from "../../services/publications";
import { truncateAddress } from "../../utils/address";

export function PublicationCard({
  item,
  shared = false,
}: {
  item: OwnedPublicationWithDetails;
  /** Renders a "co-author" badge when the wallet only holds a publisher cap. */
  shared?: boolean;
}) {
  const { publication, publicationId } = item;
  const collectionCount = publication.collections.length;

  return (
    <Link
      href={`/my-blogs/${publicationId}`}
      className="group relative overflow-hidden rounded-xl border border-border/60 bg-card/40 p-5 hover:border-primary/40 hover:bg-card/70 transition-all flex flex-col gap-3"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-12 -right-12 size-32 rounded-full bg-primary/0 blur-2xl group-hover:bg-primary/15 transition-colors"
      />
      <div className="relative flex items-start justify-between gap-3">
        <div className="grid place-items-center size-9 rounded-lg bg-primary/10 text-primary border border-primary/30">
          <BookOpen className="size-4" />
        </div>
        <ArrowUpRight className="size-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
      </div>
      <div className="relative flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-semibold tracking-tight truncate">
            {publication.name}
          </h3>
          {shared ? (
            <Badge
              variant="outline"
              className="gap-1 border-amber-400/40 bg-amber-400/10 text-amber-300 text-[10px] shrink-0"
            >
              <Users className="size-2.5" />
              Co-author
            </Badge>
          ) : null}
        </div>
        <p className="text-xs text-muted-foreground font-mono">
          /{publication.slug}
        </p>
      </div>
      <div className="relative flex items-center gap-2 mt-1">
        <Badge variant="outline" className="gap-1 border-border/60 font-normal">
          <Layers className="size-3" />
          {collectionCount}{" "}
          {collectionCount === 1 ? "collection" : "collections"}
        </Badge>
        <span className="text-[11px] text-muted-foreground font-mono ml-auto">
          {truncateAddress(publicationId, 4, 4)}
        </span>
      </div>
    </Link>
  );
}
