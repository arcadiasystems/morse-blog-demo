"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ExternalLink,
  Lock,
  MoreHorizontal,
  PencilLine,
  Send,
  Trash2,
} from "lucide-react";
import type { Entry } from "@arcadiasystems/morse-sdk";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { classifyEntry, type EntryStatus } from "@/utils/entry-status";

// Re-export the pure helpers from the server-safe util so existing imports
// keep working. The implementation lives in `@/utils/entry-status` so server
// components can use it without crossing the client boundary.
export { classifyEntry };
export type { EntryStatus };

const STATUS_META: Record<
  EntryStatus,
  { label: string; icon: React.ReactNode; tone: string }
> = {
  public: {
    label: "Public",
    icon: <Send className="size-3" />,
    tone: "border-primary/40 bg-primary/10 text-primary",
  },
  draft: {
    label: "Draft",
    icon: <PencilLine className="size-3" />,
    tone: "border-amber-400/40 bg-amber-400/10 text-amber-300",
  },
  premium: {
    label: "Premium",
    icon: <Lock className="size-3" />,
    tone: "border-amber-400/40 bg-amber-400/10 text-amber-300",
  },
  empty: {
    label: "Empty",
    icon: null,
    tone: "border-border/60 bg-muted/30 text-muted-foreground",
  },
};

export function EntryRow({
  entry,
  publicationId,
  collectionName,
  onDelete,
  deleting,
}: {
  entry: Entry;
  publicationId: string;
  collectionName: string;
  onDelete?: (entryId: number, collectionName: string) => void;
  deleting?: boolean;
}) {
  const status = classifyEntry(entry);
  const meta = STATUS_META[status];
  const revisionCount = entry.revisions.length;
  const [confirmOpen, setConfirmOpen] = useState(false);
  const qs = `?collection=${encodeURIComponent(collectionName)}`;
  const editHref = `/my-blogs/${publicationId}/posts/${entry.id}/edit${qs}`;
  const publicHref = `/${publicationId}/${entry.id}${qs}`;

  return (
    <>
      <div className="group flex items-center gap-3 rounded-lg border border-border/60 bg-card/40 hover:bg-card/70 hover:border-primary/40 px-4 py-3 transition-all">
        <Link
          href={editHref}
          className="flex-1 min-w-0 flex flex-col gap-1 cursor-pointer"
        >
          <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
            {entry.name || `Entry #${entry.id}`}
          </p>
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <span className="font-mono">#{entry.id}</span>
            <span>·</span>
            <span>
              {revisionCount} revision{revisionCount === 1 ? "" : "s"}
            </span>
            {status !== "premium" &&
            entry.draftHead !== null &&
            entry.draftHead !== entry.publicHead ? (
              <>
                <span>·</span>
                <span className="text-amber-300">draft pending</span>
              </>
            ) : null}
          </div>
        </Link>
        <Badge variant="outline" className={`gap-1 ${meta.tone}`}>
          {meta.icon}
          {meta.label}
        </Badge>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 shrink-0"
              aria-label="Open actions menu"
            >
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem asChild>
              <Link href={editHref}>
                <PencilLine className="size-3.5" />
                Edit
              </Link>
            </DropdownMenuItem>
            {status === "public" ? (
              <DropdownMenuItem asChild>
                <Link href={publicHref} target="_blank" rel="noreferrer">
                  <ExternalLink className="size-3.5" />
                  View public
                </Link>
              </DropdownMenuItem>
            ) : null}
            {onDelete ? (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={(e) => {
                    e.preventDefault();
                    setConfirmOpen(true);
                  }}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="size-3.5" />
                  Delete
                </DropdownMenuItem>
              </>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {onDelete ? (
        <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this post?</AlertDialogTitle>
              <AlertDialogDescription>
                &ldquo;{entry.name || `Entry #${entry.id}`}&rdquo; will be
                removed from the publication. Walrus blobs backing its revisions
                stay on-chain but become orphaned. This is irreversible.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => onDelete(entry.id, collectionName)}
                disabled={deleting}
                className="bg-destructive text-white hover:bg-destructive/90"
              >
                {deleting ? "Deleting..." : "Delete permanently"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ) : null}
    </>
  );
}
