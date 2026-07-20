"use client";

import type { Entry } from "@arcadiasystems/morse-sdk";
import { WalrusImage } from "./WalrusImage";

type Props = {
  entries: Entry[];
  aggregatorUrl: string;
  buildUrl: (blobObjectId: string) => string;
  onSelect?: (item: { entry: Entry; url: string }) => void;
  emptyState?: React.ReactNode;
};

export function MediaGrid({
  entries,
  buildUrl,
  onSelect,
  emptyState,
}: Props) {
  if (entries.length === 0 && emptyState) {
    return <>{emptyState}</>;
  }

  return (
    <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {entries.map((entry) => {
        const head =
          entry.publicHead !== null
            ? entry.revisions[entry.publicHead]
            : entry.draftHead !== null
              ? entry.revisions[entry.draftHead]
              : null;
        if (!head || head.blobRef.kind !== "blob") return null;
        const url = buildUrl(head.blobRef.blobObjectId);
        const isImage = head.contentType.startsWith("image/");
        void url; // url is forwarded only to onSelect; thumbnail uses SDK fetch

        return (
          <li key={entry.id}>
            <button
              type="button"
              onClick={() => onSelect?.({ entry, url })}
              disabled={!onSelect}
              className="group w-full flex flex-col gap-2 rounded-lg border border-border/60 bg-card/40 overflow-hidden hover:border-primary/40 hover:bg-card/70 transition-all text-left disabled:cursor-default"
            >
              <div className="aspect-square bg-muted/40 overflow-hidden grid place-items-center">
                {isImage ? (
                  <WalrusImage
                    blobObjectId={head.blobRef.blobObjectId}
                    alt={entry.name}
                    contentType={head.contentType}
                    className="size-full object-cover group-hover:scale-105 transition-transform"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-1 text-muted-foreground text-xs p-2 text-center">
                    <span className="font-mono uppercase">
                      {head.contentType.split("/")[1] ?? "binary"}
                    </span>
                  </div>
                )}
              </div>
              <div className="px-2.5 pb-2 flex flex-col gap-0.5">
                <p className="text-xs font-medium truncate">
                  {entry.name || `Entry #${entry.id}`}
                </p>
                <p className="text-[10px] text-muted-foreground font-mono">
                  #{entry.id}
                </p>
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
