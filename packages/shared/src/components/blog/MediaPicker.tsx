"use client";

import { DragEvent, useCallback, useState } from "react";
import { Image as ImageIcon, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import type { Entry } from "@arcadiasystems/morse-sdk";
import { Button } from "../../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../components/ui/dialog";
import { Skeleton } from "../../components/ui/skeleton";
import { EmptyState } from "../../components/feedback/EmptyState";
import { StatusIndicator } from "../../components/feedback/StatusIndicator";
import { MediaGrid } from "./MediaGrid";
import { useEntries } from "../../hooks/use-entries";
import { useMorse } from "../../hooks/use-morse";
import { usePublisherCap } from "../../hooks/use-publisher-cap";
import { useUploadMedia } from "../../hooks/use-upload-media";
import {
  MEDIA_COLLECTION_NAME,
  walrusObjectUrl,
} from "../../lib/morse-config";
import { mapSdkError } from "../../services/errors";

const MAX_FILE_BYTES = 5 * 1024 * 1024;

type Props = {
  publicationId: string;
  hasMediaCollection: boolean;
  /**
   * Called when the user picks an existing item or uploads a new one.
   * `entry` is present for library picks and omitted for fresh uploads
   * (the new entry isn't in the local list yet); callers only need
   * `name` + `url` to insert the markdown reference.
   */
  onInsert: (insertion: {
    name: string;
    url: string;
    entry?: Entry;
  }) => void;
  /** Custom trigger; defaults to a small outline button. */
  children?: React.ReactNode;
};

/**
 * Dialog that lets the writer pick an existing media entry OR upload a new
 * one in place. New uploads land in the `media` collection so they appear
 * in the Media tab too. Picking inserts a markdown image reference into the
 * editor.
 */
export function MediaPicker({
  publicationId,
  hasMediaCollection,
  onInsert,
  children,
}: Props) {
  const morse = useMorse();
  const cap = usePublisherCap(publicationId);
  const upload = useUploadMedia();
  const [open, setOpen] = useState(false);
  const [dragging, setDragging] = useState(false);

  const entries = useEntries(
    open && hasMediaCollection ? publicationId : undefined,
    MEDIA_COLLECTION_NAME,
  );

  const aggregatorUrl = morse?.config.walrusEndpoints.aggregator ?? "";
  const hasCollectionNow = hasMediaCollection;

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      if (!cap.data) {
        toast.error("Missing publisher cap", {
          description: "Cannot upload without a PublisherCap for this blog.",
        });
        return;
      }
      const arr = Array.from(files);
      let insertedAny = false;
      for (const file of arr) {
        if (file.size > MAX_FILE_BYTES) {
          toast.warning(`${file.name} exceeds the ~5 MB testnet cap`, {
            description: `${(file.size / 1024 / 1024).toFixed(1)} MB - upload may fail or be rate-limited.`,
          });
        }
        await new Promise<void>((resolve) => {
          upload.mutate(
            {
              publicationId,
              publisherCapId: cap.data!.id,
              hasMediaCollection: hasCollectionNow,
              file,
            },
            {
              onSuccess: (result) => {
                // Upload + insert in one action: build the reference and
                // drop it straight into the post, no second click.
                const url = walrusObjectUrl(
                  aggregatorUrl,
                  result.blobObjectId as unknown as string,
                );
                const isImage = file.type.startsWith("image/");
                const name = file.name.replace(/[\[\]]/g, "");
                if (isImage) {
                  onInsert({ name, url });
                  insertedAny = true;
                }
                toast.success(`Uploaded and inserted ${file.name}`);
                resolve();
              },
              onError: (err) => {
                const m = mapSdkError(err);
                toast.error(m.title, { description: m.body });
                resolve();
              },
            },
          );
        });
      }
      if (insertedAny) setOpen(false);
    },
    [cap.data, publicationId, hasCollectionNow, upload, aggregatorUrl, onInsert],
  );

  const onDragOver = useCallback((e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setDragging(true);
  }, []);
  const onDragLeave = useCallback(() => setDragging(false), []);
  const onDrop = useCallback(
    async (e: DragEvent<HTMLLabelElement>) => {
      e.preventDefault();
      setDragging(false);
      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        await handleFiles(files);
      }
    },
    [handleFiles],
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children ?? (
          <Button type="button" variant="outline" size="sm" className="gap-1.5">
            <ImageIcon className="size-3.5" />
            Insert image
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Insert an image</DialogTitle>
          <DialogDescription>
            Two ways to add an image to your post:
          </DialogDescription>
        </DialogHeader>

        <ol className="flex flex-col gap-2 text-sm text-muted-foreground list-decimal pl-5">
          <li>
            <span className="text-foreground font-medium">Upload a new image.</span>{" "}
            Drop it on the box below (or click to browse). It uploads to your{" "}
            <code className="font-mono text-xs">media</code> library on Walrus.
          </li>
          <li>
            <span className="text-foreground font-medium">It inserts itself.</span>{" "}
            Once the upload finishes, the image is added to your post
            automatically and this dialog closes.
          </li>
          <li>
            <span className="text-foreground font-medium">Or reuse one you already uploaded.</span>{" "}
            Pick any image from the Library below to insert it again, no
            re-upload needed.
          </li>
        </ol>

        <label
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          className={`mt-2 flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed transition-all py-6 px-6 cursor-pointer ${
            dragging
              ? "border-primary bg-primary/10"
              : "border-border/60 bg-card/30 hover:border-primary/40 hover:bg-card/50"
          }`}
        >
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            disabled={upload.isPending || !cap.data}
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                void handleFiles(e.target.files);
                e.target.value = "";
              }
            }}
          />
          <div className="grid place-items-center size-10 rounded-full bg-primary/10 text-primary border border-primary/30">
            {upload.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Upload className="size-4" />
            )}
          </div>
          <p className="text-sm font-medium">
            {upload.isPending
              ? "Uploading..."
              : "Drop images or click to upload"}
          </p>
          {upload.isPending ? (
            <StatusIndicator
              phase={
                upload.phase === "creating-collection"
                  ? "confirming-sui"
                  : upload.phase === "uploading-walrus"
                    ? "uploading-walrus"
                    : "confirming-sui"
              }
            />
          ) : (
            <p className="text-[11px] text-muted-foreground">
              PNG / JPG / WebP / GIF. Keep individual files under ~5 MB.
            </p>
          )}
        </label>

        <div className="mt-4 flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Library
          </h3>
          <span className="text-[11px] text-muted-foreground">
            {entries.data?.length ?? 0} item
            {(entries.data?.length ?? 0) === 1 ? "" : "s"}
          </span>
        </div>

        <div className="mt-2">
          {!hasMediaCollection && (entries.data?.length ?? 0) === 0 ? (
            <EmptyState
              icon={<ImageIcon className="size-5" />}
              title="No media yet"
              description="Drop or pick a file above to create the media collection and add your first asset."
            />
          ) : entries.isPending ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="aspect-square rounded-lg" />
              ))}
            </div>
          ) : entries.data && entries.data.length > 0 ? (
            <MediaGrid
              entries={entries.data}
              aggregatorUrl={aggregatorUrl}
              buildUrl={(id) => walrusObjectUrl(aggregatorUrl, id)}
              onSelect={({ entry, url }) => {
                onInsert({ name: entry.name, url, entry });
                setOpen(false);
              }}
            />
          ) : (
            <EmptyState
              icon={<ImageIcon className="size-5" />}
              title="Library is empty"
              description="Drop a file above to add the first item."
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
