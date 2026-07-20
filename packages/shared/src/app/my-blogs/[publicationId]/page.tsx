"use client";

import { use } from "react";
import Link from "next/link";
import {
  FileText,
  Pencil,
  Plus,
  Settings,
  Users,
} from "lucide-react";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { toast } from "sonner";
import { Boxes, Image as ImageIcon } from "lucide-react";
import { Button } from "../../../components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../../components/ui/tabs";
import { Skeleton } from "../../../components/ui/skeleton";
import { EmptyState } from "../../../components/feedback/EmptyState";
import { ErrorState } from "../../../components/feedback/ErrorState";
import { AdminHeader } from "../../../components/blog/AdminHeader";
import { CollectionSection } from "../../../components/blog/CollectionSection";
import { DangerZone } from "../../../components/blog/DangerZone";
import { EntryRow, classifyEntry } from "../../../components/blog/EntryRow";
import { hasPendingDraft } from "../../../utils/entry-status";
import { MediaTab } from "../../../components/blog/MediaTab";
import { MembersTab } from "../../../components/blog/MembersTab";
import { WalletButton } from "../../../components/layout/WalletButton";
import { DEFAULT_COLLECTION_NAME } from "../../../hooks/use-create-publication";
import { useDeletePost } from "../../../hooks/use-delete-post";
import { useEntries } from "../../../hooks/use-entries";
import { usePublication } from "../../../hooks/use-publication";
import { usePublisherCap } from "../../../hooks/use-publisher-cap";
import { mapSdkError } from "../../../services/errors";

export default function PublicationAdminPage({
  params,
}: {
  params: Promise<{ publicationId: string }>;
}) {
  const { publicationId } = use(params);
  const account = useCurrentAccount();
  const query = usePublication(publicationId);
  const cap = usePublisherCap(publicationId);
  const hasPostsCollection = query.data?.collections.some(
    (c) => c.name === DEFAULT_COLLECTION_NAME,
  );
  const entries = useEntries(
    hasPostsCollection ? publicationId : undefined,
    DEFAULT_COLLECTION_NAME,
  );
  const deletePost = useDeletePost();

  const handleDelete = (entryId: number, collectionName: string) => {
    if (!cap.data) {
      toast.error("Missing publisher cap", {
        description: "Cannot delete without a PublisherCap for this blog.",
      });
      return;
    }
    deletePost.mutate(
      {
        publicationId,
        publisherCapId: cap.data.id,
        entryId,
        collectionName,
      },
      {
        onSuccess: () => toast.success("Post deleted"),
        onError: (err) => {
          const m = mapSdkError(err);
          toast.error(m.title, { description: m.body });
        },
      },
    );
  };

  if (!account) {
    return (
      <div className="flex flex-col gap-6 py-4 sm:py-8 max-w-4xl">
        <EmptyState
          icon={<Settings className="size-5" />}
          title="Connect a wallet to manage this blog"
          description="You'll need to be the holder of the OwnerCap to edit. Public reading does not require a wallet."
          action={<WalletButton size="lg" />}
        />
      </div>
    );
  }

  if (query.isPending) {
    return (
      <div className="flex flex-col gap-6 py-4 sm:py-8 max-w-4xl">
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-12 w-2/3" />
        <Skeleton className="h-10 w-full max-w-md" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (query.isError) {
    return (
      <div className="flex flex-col gap-6 py-4 sm:py-8 max-w-4xl">
        <ErrorState
          title="Could not load this publication"
          description={
            query.error instanceof Error
              ? query.error.message
              : "Unknown error reading publication from chain."
          }
          action={
            <Button variant="outline" asChild>
              <Link href="/my-blogs">Back to my blogs</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const publication = query.data!;
  const publicEntries =
    entries.data?.filter((e) => classifyEntry(e) === "public") ?? [];
  // Drafts tab = anything with unpublished work: pure drafts, premium
  // (encrypted, draft-only by design), and published posts that have a
  // newer unpublished draft revision.
  const draftEntries =
    entries.data?.filter((e) => {
      const s = classifyEntry(e);
      return s === "draft" || s === "premium" || hasPendingDraft(e);
    }) ?? [];

  return (
    <div className="flex flex-col gap-8 py-4 sm:py-8 max-w-4xl">
      <AdminHeader publication={publication} publicationId={publicationId} />

      <Tabs defaultValue="content" className="flex flex-col gap-4">
        <TabsList className="self-start">
          <TabsTrigger value="content" className="gap-1.5">
            <Boxes className="size-3.5" />
            Content
          </TabsTrigger>
          <TabsTrigger value="posts" className="gap-1.5">
            <FileText className="size-3.5" />
            Posts
          </TabsTrigger>
          <TabsTrigger value="drafts" className="gap-1.5">
            <Pencil className="size-3.5" />
            Drafts
          </TabsTrigger>
          <TabsTrigger value="media" className="gap-1.5">
            <ImageIcon className="size-3.5" />
            Media
          </TabsTrigger>
          <TabsTrigger value="members" className="gap-1.5">
            <Users className="size-3.5" />
            Members
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-1.5">
            <Settings className="size-3.5" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="content" className="flex flex-col gap-3 mt-2">
          {publication.collections.length === 0 ? (
            <EmptyState
              icon={<Boxes className="size-5" />}
              title="No collections on this publication"
              description="The default `posts` collection is normally created at publication time. Create a new blog if this is unexpected."
            />
          ) : (
            publication.collections.map((c) => (
              <CollectionSection
                key={c.name}
                publicationId={publicationId}
                collection={c}
                onDelete={handleDelete}
                deleting={deletePost.isPending}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="posts" className="flex flex-col gap-4 mt-2">
          <div className="flex items-center justify-between gap-3">
            <div className="flex flex-col gap-0.5">
              <h2 className="text-sm font-semibold">Published posts</h2>
              <p className="text-xs text-muted-foreground">
                Posts with a public revision pointer. Hidden drafts live on the
                Drafts tab.
              </p>
            </div>
            <Button
              asChild
              size="sm"
              className="gap-1.5"
              disabled={!hasPostsCollection}
            >
              <Link href={`/my-blogs/${publicationId}/write`}>
                <Plus className="size-3.5" />
                Write post
              </Link>
            </Button>
          </div>

          {!hasPostsCollection ? (
            <EmptyState
              icon={<FileText className="size-5" />}
              title="Default collection missing"
              description={`No "${DEFAULT_COLLECTION_NAME}" collection on this publication. It should be created automatically with the blog - try creating a new blog or contact support.`}
            />
          ) : entries.isPending ? (
            <div className="flex flex-col gap-2">
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </div>
          ) : entries.isError ? (
            <ErrorState
              title="Could not load posts"
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
          ) : publicEntries.length === 0 ? (
            <EmptyState
              icon={<FileText className="size-5" />}
              title="No posts yet"
              description="Write your first post. Body content goes to Walrus, the on-chain entry references the blob."
              action={
                <Button asChild className="gap-1.5">
                  <Link href={`/my-blogs/${publicationId}/write`}>
                    <Plus className="size-3.5" />
                    Write first post
                  </Link>
                </Button>
              }
            />
          ) : (
            <ul className="flex flex-col gap-2">
              {publicEntries.map((entry) => (
                <li key={entry.id}>
                  <EntryRow
                entry={entry}
                publicationId={publicationId}
                collectionName={DEFAULT_COLLECTION_NAME}
                onDelete={handleDelete}
                deleting={deletePost.isPending}
              />
                </li>
              ))}
            </ul>
          )}
        </TabsContent>

        <TabsContent value="drafts" className="flex flex-col gap-4 mt-2">
          <div className="flex flex-col gap-0.5">
            <h2 className="text-sm font-semibold">Drafts & premium</h2>
            <p className="text-xs text-muted-foreground">
              Posts with unpublished edits, plus premium (encrypted) posts -
              which stay here permanently because encrypted entries have no
              public-publish path.
            </p>
          </div>
          {draftEntries.length === 0 ? (
            <EmptyState
              icon={<Pencil className="size-5" />}
              title="Nothing in drafts"
              description="Save an edit without publishing, or write a premium (encrypted) post, and it'll show up here."
            />
          ) : (
            <ul className="flex flex-col gap-2">
              {draftEntries.map((entry) => (
                <li key={entry.id}>
                  <EntryRow
                    entry={entry}
                    publicationId={publicationId}
                    collectionName={DEFAULT_COLLECTION_NAME}
                    onDelete={handleDelete}
                    deleting={deletePost.isPending}
                  />
                </li>
              ))}
            </ul>
          )}
        </TabsContent>

        <TabsContent value="media" className="mt-2">
          <MediaTab publicationId={publicationId} publication={publication} />
        </TabsContent>

        <TabsContent value="members" className="mt-2">
          <MembersTab publicationId={publicationId} />
        </TabsContent>

        <TabsContent value="settings" className="mt-2 flex flex-col gap-5">
          <div className="rounded-xl border border-border/60 bg-card/40 p-5 flex flex-col gap-3">
            <h3 className="text-sm font-semibold">Publication ID</h3>
            <p className="text-xs font-mono text-muted-foreground break-all">
              {publicationId}
            </p>
            <h3 className="text-sm font-semibold mt-2">Collections</h3>
            {publication.collections.length > 0 ? (
              <ul className="flex flex-col gap-2">
                {publication.collections.map((c) => (
                  <li
                    key={c.name}
                    className="flex items-center justify-between rounded-md border border-border/60 px-3 py-2 text-sm"
                  >
                    <span className="font-mono">{c.name}</span>
                    <span className="text-[11px] text-muted-foreground uppercase tracking-wide">
                      {c.storageMode}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-muted-foreground">
                No collections on this publication.
              </p>
            )}
          </div>
          <DangerZone publicationId={publicationId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
