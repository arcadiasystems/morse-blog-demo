"use client";

import { DragEvent, useCallback, useState } from "react";
import { FileUp, Image as ImageIcon, Info, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import type { Publication } from "@arcadiasystems/morse-sdk";
import { Alert, AlertDescription, AlertTitle } from "../../components/ui/alert";
import { Button } from "../../components/ui/button";
import { Skeleton } from "../../components/ui/skeleton";
import { EmptyState } from "../../components/feedback/EmptyState";
import { ErrorState } from "../../components/feedback/ErrorState";
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
  publication: Publication;
};

export function MediaTab({ publicationId, publication }: Props) {
  const morse = useMorse();
  const cap = usePublisherCap(publicationId);
  const hasMediaCollection = publication.collections.some(
    (c) => c.name === MEDIA_COLLECTION_NAME,
  );
  const entries = useEntries(
    hasMediaCollection ? publicationId : undefined,
    MEDIA_COLLECTION_NAME,
  );
  const upload = useUploadMedia();
  const [dragging, setDragging] = useState(false);

  const aggregatorUrl = morse?.config.walrusEndpoints.aggregator ?? "";

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      if (!cap.data) {
        toast.error("Missing publisher cap", {
          description: "Cannot upload without a PublisherCap for this blog.",
        });
        return;
      }
      const arr = Array.from(files);
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
              hasMediaCollection,
              file,
            },
            {
              onSuccess: () => {
                toast.success(`Uploaded ${file.name}`);
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
    },
    [cap.data, publicationId, hasMediaCollection, upload],
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
    <div className="flex flex-col gap-4">
      <Alert className="bg-card/40 border-border/60">
        <Info className="size-4" />
        <AlertTitle className="text-sm">Media library</AlertTitle>
        <AlertDescription className="text-xs text-muted-foreground">
          Images live on Walrus as entries in the{" "}
          <code className="font-mono">{MEDIA_COLLECTION_NAME}</code>{" "}
          collection. Reference them from posts via{" "}
          <code className="font-mono">![alt](aggregator-url)</code> - the
          writer has an Insert image button that does this for you.
        </AlertDescription>
      </Alert>

      <label
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed transition-all py-12 px-6 cursor-pointer ${
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
        <div className="grid place-items-center size-12 rounded-full bg-primary/10 text-primary border border-primary/30">
          {upload.isPending ? (
            <Loader2 className="size-5 animate-spin" />
          ) : (
            <Upload className="size-5" />
          )}
        </div>
        <div className="flex flex-col items-center gap-1">
          <p className="text-sm font-medium">
            {upload.isPending
              ? "Uploading..."
              : "Drop images or click to upload"}
          </p>
          <p className="text-xs text-muted-foreground text-center">
            PNG / JPG / WebP / GIF. Keep individual files under ~5 MB for
            reliable testnet uploads.
          </p>
        </div>
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
        ) : null}
      </label>

      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Library</h3>
        <span className="text-xs text-muted-foreground">
          {entries.data?.length ?? 0} item
          {(entries.data?.length ?? 0) === 1 ? "" : "s"}
        </span>
      </div>

      {!hasMediaCollection ? (
        <EmptyState
          icon={<ImageIcon className="size-5" />}
          title="No media yet"
          description="Drop a file above to create the media collection and upload your first asset. Two popups on first upload (collection + entry), one popup after that."
        />
      ) : entries.isPending ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-lg" />
          ))}
        </div>
      ) : entries.isError ? (
        <ErrorState
          title="Could not load media"
          description={
            entries.error instanceof Error
              ? entries.error.message
              : "Unknown error reading entries."
          }
          action={
            <Button variant="outline" onClick={() => entries.refetch()}>
              Try again
            </Button>
          }
        />
      ) : (
        <MediaGrid
          entries={entries.data!}
          aggregatorUrl={aggregatorUrl}
          buildUrl={(id) => walrusObjectUrl(aggregatorUrl, id)}
          emptyState={
            <EmptyState
              icon={<FileUp className="size-5" />}
              title="Library is empty"
              description="Drop or pick an image above to add the first item."
            />
          }
        />
      )}
    </div>
  );
}
