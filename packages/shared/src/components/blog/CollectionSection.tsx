"use client";

import Link from "next/link";
import { FileText, Image as ImageIcon, Layers, Plus } from "lucide-react";
import type { Collection } from "@arcadiasystems/morse-sdk";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Skeleton } from "../../components/ui/skeleton";
import { EmptyState } from "../../components/feedback/EmptyState";
import { ErrorState } from "../../components/feedback/ErrorState";
import { EntryRow } from "./EntryRow";
import { useEntries } from "../../hooks/use-entries";
import { MEDIA_COLLECTION_NAME } from "../../lib/morse-config";


type Props = {
  publicationId: string;
  collection: Collection;
  onDelete: (entryId: number, collectionName: string) => void;
  deleting: boolean;
};

export function CollectionSection({
  publicationId,
  collection,
  onDelete,
  deleting,
}: Props) {
  const entries = useEntries(publicationId, collection.name);
  const isMedia = collection.name === MEDIA_COLLECTION_NAME;
  const entryCount = entries.data?.length ?? 0;
  const addEntryHref = `/my-blogs/${publicationId}/write?collection=${encodeURIComponent(collection.name)}`;

  return (
    <section className="rounded-xl border border-border/60 bg-card/30 overflow-hidden">
      <header className="flex items-center justify-between gap-3 px-5 py-4 border-b border-border/60 bg-card/40">
        <div className="flex items-center gap-3 min-w-0">
          <div className="grid place-items-center size-9 rounded-lg bg-primary/10 text-primary border border-primary/30 shrink-0">
            <Layers className="size-4" />
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-mono text-sm font-semibold truncate">
                {collection.name}
              </h3>
              <Badge
                variant="outline"
                className="border-border/60 text-[10px] uppercase tracking-wide"
              >
                {collection.storageMode}
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground">
              {entryCount} {entryCount === 1 ? "entry" : "entries"} · next id:{" "}
              <span className="font-mono">{collection.nextEntryId}</span>
            </p>
          </div>
        </div>
        <Button asChild size="sm" className="gap-1.5 shrink-0">
          <Link href={addEntryHref}>
            {isMedia ? (
              <ImageIcon className="size-3.5" />
            ) : (
              <Plus className="size-3.5" />
            )}
            Add entry
          </Link>
        </Button>
      </header>

      <div className="px-5 py-4">
        {entries.isPending ? (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        ) : entries.isError ? (
          <ErrorState
            title="Could not load entries"
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
        ) : entries.data!.length === 0 ? (
          <EmptyState
            icon={
              isMedia ? (
                <ImageIcon className="size-5" />
              ) : (
                <FileText className="size-5" />
              )
            }
            title="No entries in this collection"
            description={
              isMedia
                ? "Drop images on the Media tab to upload them here, or click Add entry (text) to write a markdown entry into this collection."
                : "Click Add entry to write the first entry into this collection."
            }
          />
        ) : (
          <ul className="flex flex-col gap-2">
            {entries.data!.map((entry) => (
              <li key={entry.id}>
                <EntryRow
                  entry={entry}
                  publicationId={publicationId}
                  collectionName={collection.name}
                  onDelete={onDelete}
                  deleting={deleting}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
