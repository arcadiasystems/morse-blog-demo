"use client";

import { useState } from "react";
import { CheckCircle2, Circle, Eye, Lock, PencilLine } from "lucide-react";
import type { Entry, Revision } from "@arcadiasystems/morse-sdk";
import { Badge } from "../../components/ui/badge";
import { RevisionViewer } from "./RevisionViewer";
import { truncateAddress } from "../../utils/address";

type Props = {
  entry: Entry;
  /**
   * If provided, the viewer dialog shows a "Copy to editor" button that
   * calls this with the revision's markdown body. Skip the prop on read-only
   * surfaces.
   */
  onCopyToEditor?: (markdown: string) => void;
};

export function VersionTimeline({ entry, onCopyToEditor }: Props) {
  const revisions = entry.revisions;
  const [selected, setSelected] = useState<Revision | null>(null);

  if (revisions.length === 0) return null;

  // Render newest revision first
  const items = revisions.slice().reverse();

  return (
    <>
      <div className="flex flex-col gap-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Revision history
        </h3>
        <ol className="flex flex-col">
          {items.map((rev, i) => {
            const isPublic = entry.publicHead === rev.id;
            const isDraft = entry.draftHead === rev.id;
            const isLast = i === items.length - 1;
            return (
              <li key={rev.id} className="flex gap-3 relative">
                <div className="flex flex-col items-center">
                  {isPublic ? (
                    <CheckCircle2 className="size-4 text-primary shrink-0" />
                  ) : isDraft ? (
                    <PencilLine className="size-4 text-amber-300 shrink-0" />
                  ) : (
                    <Circle className="size-4 text-muted-foreground shrink-0" />
                  )}
                  {!isLast ? (
                    <span className="flex-1 w-px bg-border/60 my-1" />
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => setSelected(rev)}
                  className="group flex-1 min-w-0 pb-4 text-left -ml-1 px-1 py-0.5 rounded hover:bg-card/60 transition-colors"
                  aria-label={`View version ${rev.id + 1}`}
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium group-hover:text-primary transition-colors">
                      Version {rev.id + 1}
                    </span>
                    <Eye className="size-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    {isPublic ? (
                      <Badge
                        variant="outline"
                        className="border-primary/40 bg-primary/10 text-primary text-[10px]"
                      >
                        Current public
                      </Badge>
                    ) : null}
                    {isDraft ? (
                      <Badge
                        variant="outline"
                        className="border-amber-400/40 bg-amber-400/10 text-amber-300 text-[10px]"
                      >
                        Draft
                      </Badge>
                    ) : null}
                    {rev.encrypted ? (
                      <Badge
                        variant="outline"
                        className="border-border/60 text-[10px] gap-1"
                      >
                        <Lock className="size-2.5" />
                        Encrypted
                      </Badge>
                    ) : null}
                  </div>
                  <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
                    by {truncateAddress(rev.author, 6, 4)}
                  </p>
                </button>
              </li>
            );
          })}
        </ol>
      </div>
      <RevisionViewer
        entry={entry}
        revision={selected}
        onClose={() => setSelected(null)}
        onCopyToEditor={onCopyToEditor}
      />
    </>
  );
}
