"use client";

import { useEffect, useState } from "react";
import { Copy, FileText, Lock, X } from "lucide-react";
import { toast } from "sonner";
import {
  NotFoundError,
  type Entry,
  type Revision,
} from "@arcadiasystems/morse-sdk";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MarkdownRenderer } from "@/components/blog/MarkdownRenderer";
import { WalrusImage } from "@/components/blog/WalrusImage";
import { useMorse } from "@/hooks/use-morse";
import { mapSdkError } from "@/services/errors";
import { truncateAddress } from "@/utils/address";

type Props = {
  entry: Entry;
  revision: Revision | null;
  onClose: () => void;
  /**
   * When provided, the viewer offers a "Copy to editor" button that calls
   * this with the markdown body. Disabled for binary or encrypted revisions.
   */
  onCopyToEditor?: (markdown: string) => void;
};

const DECODER = new TextDecoder();

function isTextContentType(contentType: string): boolean {
  if (!contentType) return true;
  if (contentType.startsWith("text/")) return true;
  if (contentType === "application/json") return true;
  if (contentType === "application/xml") return true;
  return false;
}

/**
 * Read-only viewer for a single revision. Fetches the blob bytes from
 * Walrus and renders them as markdown (text) or via `<img>` (binary
 * image). Encrypted revisions show a hint to use the edit page's decrypt
 * flow - we don't reproduce SessionKey here to keep this dialog stateless.
 */
export function RevisionViewer({
  entry,
  revision,
  onClose,
  onCopyToEditor,
}: Props) {
  const morse = useMorse();
  const [text, setText] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(false);

  const open = revision !== null;
  const isEncrypted = revision?.encrypted ?? false;
  const contentType = revision?.contentType ?? "text/markdown";
  const isText = !isEncrypted && isTextContentType(contentType);
  const isImage = !isEncrypted && contentType.startsWith("image/");
  const isPublicHead = revision !== null && entry.publicHead === revision.id;
  const isDraftHead = revision !== null && entry.draftHead === revision.id;

  useEffect(() => {
    setText(null);
    setError(null);
    if (!morse || !revision || isEncrypted) return;
    if (!isText) return;

    let cancelled = false;
    setLoading(true);
    morse.walrusRead
      .readBlobRef(revision.blobRef)
      .then((bytes) => {
        if (cancelled) return;
        setText(DECODER.decode(bytes));
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err : new Error(String(err)));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [morse, revision, isEncrypted, isText]);

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? null : onClose())}>
      <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 flex-wrap">
            <DialogTitle>
              Version {revision ? revision.id + 1 : ""}
            </DialogTitle>
            {isPublicHead ? (
              <Badge
                variant="outline"
                className="border-primary/40 bg-primary/10 text-primary text-[10px]"
              >
                Current public
              </Badge>
            ) : null}
            {isDraftHead ? (
              <Badge
                variant="outline"
                className="border-amber-400/40 bg-amber-400/10 text-amber-300 text-[10px]"
              >
                Draft
              </Badge>
            ) : null}
            {isEncrypted ? (
              <Badge
                variant="outline"
                className="border-border/60 gap-1 text-[10px]"
              >
                <Lock className="size-2.5" />
                Encrypted
              </Badge>
            ) : null}
          </div>
          <DialogDescription className="flex items-center gap-3 text-xs">
            <span className="font-mono">{contentType}</span>
            <span>·</span>
            <span>
              by{" "}
              <span className="font-mono">
                {truncateAddress(revision?.author ?? "", 6, 4)}
              </span>
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2">
          {isEncrypted ? (
            <div className="rounded-lg border border-amber-400/30 bg-amber-400/5 px-4 py-8 text-center text-sm text-muted-foreground">
              This revision is encrypted. Open the edit page and use the
              decrypt flow to view its body.
            </div>
          ) : isImage && revision?.blobRef.kind === "blob" ? (
            <div className="rounded-lg overflow-hidden border border-border/60 bg-muted/30">
              <WalrusImage
                blobObjectId={revision.blobRef.blobObjectId}
                alt={`Version ${revision.id + 1}`}
                contentType={contentType}
                className="w-full max-h-[60vh] object-contain"
              />
            </div>
          ) : !isText ? (
            <div className="rounded-lg border border-border/60 bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
              Binary content ({contentType}) - no inline preview.
            </div>
          ) : loading ? (
            <div className="flex flex-col gap-2">
              <Skeleton className="h-6 w-2/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-4/6" />
            </div>
          ) : error ? (
            <div className="rounded-lg border border-amber-400/40 bg-amber-400/5 px-4 py-6 text-sm text-muted-foreground text-center">
              {(() => {
                const m = mapSdkError(error);
                return (
                  <>
                    <span className="block text-foreground font-medium mb-1">
                      {m.title}
                    </span>
                    {m.body}
                  </>
                );
              })()}
            </div>
          ) : (
            <MarkdownRenderer source={text ?? ""} />
          )}
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 pt-3 border-t border-border/60">
          <p className="text-[11px] text-muted-foreground">
            <FileText className="size-3 inline -mt-0.5 mr-1" />
            {error instanceof NotFoundError && error.resource === "blob"
              ? "This revision's content has expired on Walrus and can't be recovered. Re-write the post from the editor to create a fresh version."
              : "Revisions are immutable. To “rollback”, copy this content into the editor and save as a new draft."}
          </p>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="size-3.5" />
              Close
            </Button>
            {onCopyToEditor && isText && text !== null && !isEncrypted ? (
              <Button
                size="sm"
                onClick={() => {
                  onCopyToEditor(text);
                  toast.success("Loaded into editor", {
                    description:
                      "Save draft to write a new revision with this content.",
                  });
                  onClose();
                }}
                className="gap-1.5"
              >
                <Copy className="size-3.5" />
                Copy to editor
              </Button>
            ) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
