import Link from "next/link";
import { ArrowLeft, ExternalLink, Layers } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Publication } from "@arcadiasystems/morse-sdk";
import { truncateAddress } from "@/utils/address";

export function AdminHeader({
  publication,
  publicationId,
}: {
  publication: Publication;
  publicationId: string;
}) {
  return (
    <div className="flex flex-col gap-4">
      <Button
        asChild
        variant="ghost"
        size="sm"
        className="self-start gap-1.5 -ml-2"
      >
        <Link href="/my-blogs">
          <ArrowLeft className="size-4" />
          All blogs
        </Link>
      </Button>
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div className="flex flex-col gap-2 min-w-0">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight truncate">
            {publication.name}
          </h1>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="font-mono border-border/60">
              /{publication.slug}
            </Badge>
            <Badge variant="outline" className="gap-1 border-border/60">
              <Layers className="size-3" />
              {publication.collections.length}{" "}
              {publication.collections.length === 1
                ? "collection"
                : "collections"}
            </Badge>
            <span className="text-[11px] text-muted-foreground font-mono">
              {truncateAddress(publicationId, 6, 6)}
            </span>
          </div>
        </div>
        <Button asChild variant="outline" size="sm" className="gap-1.5">
          <Link href={`/${publicationId}`} target="_blank" rel="noreferrer">
            View public
            <ExternalLink className="size-3.5" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
