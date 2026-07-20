import Link from "next/link";
import type { Entry } from "@arcadiasystems/morse-sdk";

export function PublicEntryCard({
  entry,
  publicationId,
  premium,
}: {
  entry: Entry;
  publicationId: string;
  premium?: boolean;
}) {
  const title = entry.name || `untitled-${entry.id}`;

  return (
    <div className="py-1 font-mono text-sm flex items-baseline gap-3">
      <span className="text-muted-foreground shrink-0 tabular-nums">
        #{String(entry.id).padStart(3, "0")}
      </span>
      <Link
        href={`/${publicationId}/${entry.id}`}
        className="text-foreground hover:underline truncate"
      >
        {title}
      </Link>
      {premium && (
        <span className="text-muted-foreground shrink-0">[premium]</span>
      )}
    </div>
  );
}
