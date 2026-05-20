"use client";

import { useState } from "react";
import { FileText, Lock, Send } from "lucide-react";
import type { Entry } from "@arcadiasystems/morse-sdk";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/feedback/EmptyState";
import { classifyEntry } from "@/components/blog/EntryRow";
import { useEntries } from "@/hooks/use-entries";
import { DEFAULT_COLLECTION_NAME } from "@/hooks/use-create-publication";
import { truncateAddress } from "@/utils/address";

type Props = {
  publicationId: string;
  collectionName?: string;
  /** Exclude this entry id (typically the one being edited). */
  excludeEntryId?: number;
  onInsert: (insertion: { name: string; url: string; entry: Entry }) => void;
  children?: React.ReactNode;
};

/**
 * Dialog for inserting a markdown link to another entry in the publication.
 * Default scope is the `posts` collection; pass `collectionName` to browse
 * a different folder. Only entries with a public revision are listed since
 * a link to a draft/premium entry would 404 for unauthenticated readers.
 */
export function ContentPicker({
  publicationId,
  collectionName = DEFAULT_COLLECTION_NAME,
  excludeEntryId,
  onInsert,
  children,
}: Props) {
  const [open, setOpen] = useState(false);
  const entries = useEntries(open ? publicationId : undefined, collectionName);

  const linkable =
    entries.data?.filter(
      (e) =>
        e.id !== excludeEntryId && classifyEntry(e) === "public",
    ) ?? [];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children ?? (
          <Button type="button" variant="outline" size="sm" className="gap-1.5">
            <FileText className="size-3.5" />
            Link a post
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Link to another entry</DialogTitle>
          <DialogDescription>
            Inserts a markdown link to a published entry in the{" "}
            <code className="font-mono">{collectionName}</code> collection.
            Drafts and premium entries are hidden because a public reader
            following the link would 404 or hit the unlock gate.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-2">
          {entries.isPending ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-lg" />
              ))}
            </div>
          ) : linkable.length === 0 ? (
            <EmptyState
              icon={<FileText className="size-5" />}
              title="Nothing to link yet"
              description="Publish at least one entry in this collection first."
            />
          ) : (
            <ul className="flex flex-col gap-2">
              {linkable.map((entry) => (
                <li key={entry.id}>
                  <button
                    type="button"
                    onClick={() => {
                      const url = `/${publicationId}/${entry.id}?collection=${encodeURIComponent(collectionName)}`;
                      onInsert({ name: entry.name, url, entry });
                      setOpen(false);
                    }}
                    className="w-full flex items-center gap-3 rounded-lg border border-border/60 bg-card/40 hover:bg-card/70 hover:border-primary/40 px-4 py-3 transition-all text-left"
                  >
                    <div className="grid place-items-center size-9 rounded-md bg-primary/10 text-primary border border-primary/30 shrink-0">
                      <FileText className="size-4" />
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                      <p className="text-sm font-medium truncate">
                        {entry.name || `Entry #${entry.id}`}
                      </p>
                      <p className="text-[11px] text-muted-foreground font-mono">
                        #{entry.id} ·{" "}
                        {entry.revisions.length}{" "}
                        revision
                        {entry.revisions.length === 1 ? "" : "s"} · by{" "}
                        {truncateAddress(
                          entry.revisions[entry.publicHead!]?.author ?? "",
                          4,
                          4,
                        )}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className="gap-1 border-primary/40 bg-primary/10 text-primary text-[10px]"
                    >
                      <Send className="size-2.5" />
                      Public
                    </Badge>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {entries.data && entries.data.length > linkable.length ? (
            <p className="mt-3 text-[11px] text-muted-foreground flex items-center gap-1.5">
              <Lock className="size-3" />
              {entries.data.length - linkable.length} entries hidden (drafts
              or premium - not linkable from public posts)
            </p>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
