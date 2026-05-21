"use client";

import {
  DragEvent,
  use,
  useCallback,
  useEffect,
  useState,
} from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  FileUp,
  Loader2,
  Lock,
  Save,
  Send,
  Trash2,
  TriangleAlert,
  Unlock,
} from "lucide-react";
import { toast } from "sonner";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { EmptyState } from "@/components/feedback/EmptyState";
import { ErrorState } from "@/components/feedback/ErrorState";
import { StatusIndicator } from "@/components/feedback/StatusIndicator";
import { ContentPicker } from "@/components/blog/ContentPicker";
import { MarkdownEditor } from "@/components/blog/MarkdownEditor";
import { MediaPicker } from "@/components/blog/MediaPicker";
import { VersionTimeline } from "@/components/blog/VersionTimeline";
import { WalrusImage } from "@/components/blog/WalrusImage";
import { WalletButton } from "@/components/layout/WalletButton";
import { MEDIA_COLLECTION_NAME } from "@/lib/morse-config";
import { DEFAULT_COLLECTION_NAME } from "@/hooks/use-create-publication";
import { useEntryContent } from "@/hooks/use-entry-content";
import { usePublication } from "@/hooks/use-publication";
import { usePublisherCap } from "@/hooks/use-publisher-cap";
import { useSaveDraft, usePublishDraft } from "@/hooks/use-update-post";
import { useSaveEncryptedDraft } from "@/hooks/use-save-encrypted-draft";
import { useDeletePost } from "@/hooks/use-delete-post";
import { useUnlockEntry } from "@/hooks/use-unlock-entry";
import { mapSdkError } from "@/services/errors";

const MAX_FILE_BYTES = 5 * 1024 * 1024;

export default function EditPostPage({
  params,
}: {
  params: Promise<{ publicationId: string; entryId: string }>;
}) {
  const { publicationId, entryId: entryIdStr } = use(params);
  const entryId = Number(entryIdStr);
  const router = useRouter();
  const account = useCurrentAccount();
  const searchParams = useSearchParams();
  const collectionName =
    searchParams.get("collection") || DEFAULT_COLLECTION_NAME;

  const publication = usePublication(publicationId);
  const cap = usePublisherCap(publicationId);
  const content = useEntryContent(publicationId, entryId, collectionName);
  const hasMediaCollection =
    publication.data?.collections.some(
      (c) => c.name === MEDIA_COLLECTION_NAME,
    ) ?? false;

  const insertMarkdown = (snippet: string) => {
    setMarkdown((prev) => {
      const sep =
        prev.length === 0
          ? ""
          : prev.endsWith("\n\n")
            ? ""
            : prev.endsWith("\n")
              ? "\n"
              : "\n\n";
      return `${prev}${sep}${snippet}\n`;
    });
  };
  const saveDraft = useSaveDraft();
  const publishDraft = usePublishDraft();
  const saveEncryptedDraft = useSaveEncryptedDraft();
  const deletePost = useDeletePost();
  const unlock = useUnlockEntry();

  const [markdown, setMarkdown] = useState("");
  const [originalContent, setOriginalContent] = useState("");
  const [dragging, setDragging] = useState(false);
  const [decrypted, setDecrypted] = useState(false);

  const entry = content.data?.entry;
  const draftRev =
    entry && entry.draftHead !== null ? entry.revisions[entry.draftHead] : null;
  const isPremium = Boolean(draftRev?.encrypted);
  const headRev =
    entry && entry.publicHead !== null
      ? entry.revisions[entry.publicHead]
      : draftRev;
  const isBinaryEntry = content.data?.content === null && !isPremium;
  const entryContentType = content.data?.contentType ?? "text/markdown";
  const isImageEntry = isBinaryEntry && entryContentType.startsWith("image/");

  useEffect(() => {
    if (!content.data || content.isFetching) return;
    if (isPremium) return;
    if (originalContent !== "") return;
    if (content.data.content === null) return; // binary - no text body to load
    setMarkdown(content.data.content);
    setOriginalContent(content.data.content);
  }, [content.data, content.isFetching, isPremium, originalContent]);

  const onDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(true);
  }, []);
  const onDragLeave = useCallback(() => setDragging(false), []);
  const onDrop = useCallback(async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    if (file.size > MAX_FILE_BYTES) {
      toast.warning("File is large for testnet", {
        description: `${(file.size / 1024 / 1024).toFixed(1)} MB exceeds the ~5 MB soft cap.`,
      });
    }
    const isTextLike =
      file.type.startsWith("text/") ||
      file.name.endsWith(".md") ||
      file.name.endsWith(".markdown") ||
      file.name.endsWith(".txt");
    if (!isTextLike) {
      toast.error("Only markdown / text files supported");
      return;
    }
    const text = await file.text();
    setMarkdown(text);
    toast.success(`Loaded ${file.name}`);
  }, []);

  if (!account) {
    return (
      <div className="flex flex-col gap-6 py-4 sm:py-8 max-w-4xl">
        <BackLink publicationId={publicationId} />
        <EmptyState
          icon={<Lock className="size-5" />}
          title="Connect a wallet to edit"
          description="Editing needs your publisher cap. Connect the wallet that holds it."
          action={<WalletButton size="lg" />}
        />
      </div>
    );
  }

  if (!Number.isFinite(entryId)) {
    return (
      <div className="flex flex-col gap-6 py-4 sm:py-8 max-w-4xl">
        <BackLink publicationId={publicationId} />
        <ErrorState
          title="Invalid entry id"
          description="The URL contains a malformed entry id."
        />
      </div>
    );
  }

  if (content.isPending || cap.isPending) {
    return (
      <div className="flex flex-col gap-6 py-4 sm:py-8 max-w-4xl">
        <BackLink publicationId={publicationId} />
        <Skeleton className="h-9 w-2/3" />
        <Skeleton className="h-[480px] w-full" />
      </div>
    );
  }

  if (content.isError || !entry) {
    return (
      <div className="flex flex-col gap-6 py-4 sm:py-8 max-w-4xl">
        <BackLink publicationId={publicationId} />
        <ErrorState
          title="Could not load this post"
          description={
            content.error instanceof Error
              ? content.error.message
              : "Unknown error reading entry."
          }
        />
      </div>
    );
  }

  if (!cap.data) {
    return (
      <div className="flex flex-col gap-6 py-4 sm:py-8 max-w-4xl">
        <BackLink publicationId={publicationId} />
        <EmptyState
          icon={<Lock className="size-5" />}
          title="No publisher cap for this blog"
          description="Your wallet doesn't hold a PublisherCap on this publication."
        />
      </div>
    );
  }

  const hasDraftHead = entry.draftHead !== null;
  const isDirty = markdown !== originalContent;
  const isSavingPublic = saveDraft.isPending;
  const isSavingEncrypted = saveEncryptedDraft.isPending;
  const isSaving = isSavingPublic || isSavingEncrypted;
  const canSave = isDirty && !isSaving && (!isPremium || decrypted);
  const canPublish =
    hasDraftHead && !publishDraft.isPending && !isSaving && !isPremium;

  async function onUnlock() {
    if (!cap.data || !entry) return;
    try {
      const plaintext = await unlock.unlock({
        entry,
        publisherCapId: cap.data.id,
      });
      setMarkdown(plaintext);
      setOriginalContent(plaintext);
      setDecrypted(true);
      toast.success("Decrypted");
    } catch (err) {
      const m = mapSdkError(err);
      toast.error(m.title, { description: m.body });
    }
  }

  async function onSavePublicDraft() {
    if (!cap.data) return;
    saveDraft.mutate(
      {
        publicationId,
        publisherCapId: cap.data.id,
        entryId,
        markdown,
        collectionName,
      },
      {
        onSuccess: () => {
          toast.success("Draft saved", {
            description: "Click Publish to make the new revision public.",
          });
          setOriginalContent(markdown);
        },
        onError: (err) => {
          const m = mapSdkError(err);
          toast.error(m.title, { description: m.body });
        },
      },
    );
  }

  async function onSaveEncryptedDraft() {
    if (!cap.data || !entry || !draftRev || !draftRev.sealId) return;
    saveEncryptedDraft.mutate(
      {
        publicationId,
        publisherCapId: cap.data.id,
        entryId,
        sealId: draftRev.sealId,
        markdown,
        collectionName,
      },
      {
        onSuccess: () => {
          toast.success("Encrypted draft saved", {
            description: "Readers with access see the new revision now.",
          });
          setOriginalContent(markdown);
        },
        onError: (err) => {
          const m = mapSdkError(err);
          toast.error(m.title, { description: m.body });
        },
      },
    );
  }

  async function onSave() {
    if (isPremium) {
      await onSaveEncryptedDraft();
    } else {
      await onSavePublicDraft();
    }
  }

  async function onPublishDraft() {
    if (!cap.data || !entry || entry.draftHead === null) return;
    const dr = entry.revisions[entry.draftHead];
    if (!dr) return;
    if (dr.blobRef.kind !== "blob") {
      toast.error("Quilt-backed drafts not supported here", {
        description:
          "This demo only publishes single-blob revisions. The current draft references a Walrus quilt patch - use the SDK's quilt-aware publishFromDraft path directly to ship it.",
      });
      return;
    }
    publishDraft.mutate(
      {
        publicationId,
        publisherCapId: cap.data.id,
        entryId,
        draftRevisionId: entry.draftHead,
        blobObjectId: dr.blobRef.blobObjectId,
        contentType: dr.contentType,
        collectionName,
      },
      {
        onSuccess: () => {
          toast.success("Published", {
            description: "A new public revision is live.",
          });
        },
        onError: (err) => {
          const m = mapSdkError(err);
          toast.error(m.title, { description: m.body });
        },
      },
    );
  }

  async function onDelete() {
    if (!cap.data) return;
    deletePost.mutate(
      {
        publicationId,
        publisherCapId: cap.data.id,
        entryId,
        collectionName,
      },
      {
        onSuccess: () => {
          toast.success("Post deleted");
          router.push(`/my-blogs/${publicationId}`);
        },
        onError: (err) => {
          const m = mapSdkError(err);
          toast.error(m.title, { description: m.body });
        },
      },
    );
  }

  const savePhase = isPremium
    ? saveEncryptedDraft.phase
    : saveDraft.phase;

  return (
    <div className="flex flex-col gap-6 py-4 sm:py-8 max-w-5xl">
      <BackLink publicationId={publicationId} />
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="font-mono border-border/60">
            #{entry.id}
          </Badge>
          {isPremium ? (
            <Badge
              variant="outline"
              className="gap-1 border-amber-400/40 bg-amber-400/10 text-amber-300"
            >
              <Lock className="size-3" />
              Premium
            </Badge>
          ) : entry.publicHead !== null ? (
            <Badge
              variant="outline"
              className="border-primary/40 bg-primary/10 text-primary"
            >
              Published
            </Badge>
          ) : (
            <Badge variant="outline" className="border-border/70">
              Unpublished
            </Badge>
          )}
          {!isPremium &&
          hasDraftHead &&
          entry.draftHead !== entry.publicHead ? (
            <Badge
              variant="outline"
              className="border-amber-400/40 bg-amber-400/10 text-amber-300"
            >
              Draft pending publish
            </Badge>
          ) : null}
        </div>
        <h1 className="text-3xl font-bold tracking-tight">
          {entry.name || `Entry #${entry.id}`}
        </h1>
        <p className="text-sm text-muted-foreground">
          {isPremium
            ? "Premium posts are encrypted client-side. The current draft is the visible version - no separate publish step."
            : isBinaryEntry
              ? `Binary entry (${entryContentType}). Body is a file, not markdown - preview below. Delete to replace, since names are immutable.`
              : "Title is immutable once the entry is created. Edit the body below and save a draft, then publish to make the new revision public."}
        </p>
      </div>

      <Alert className="bg-card/40 border-border/60">
        <TriangleAlert className="size-4" />
        <AlertTitle className="text-sm">Append-only revisions</AlertTitle>
        <AlertDescription className="text-xs text-muted-foreground">
          {isPremium
            ? "Every save creates a new encrypted revision. The sealId is reused so readers with access keep their decryption keys."
            : isBinaryEntry
              ? "This is a binary entry created via the Media tab uploader. To replace, delete and re-upload (the publication's existing posts that reference this image will still point to the old, deleted entry)."
              : "Every save creates a new revision on-chain. The previous public revision stays in history forever. There is no in-place edit."}
        </AlertDescription>
      </Alert>

      <div className="grid lg:grid-cols-[1fr_280px] gap-6">
        <div className="flex flex-col gap-2">
          {isBinaryEntry ? (
            <div className="flex flex-col gap-3 rounded-xl border border-border/60 bg-card/40 p-5">
              {isImageEntry && headRev?.blobRef.kind === "blob" ? (
                <div className="rounded-lg overflow-hidden border border-border/60 bg-muted/40">
                  <WalrusImage
                    blobObjectId={headRev.blobRef.blobObjectId}
                    alt={entry.name}
                    contentType={entryContentType}
                    className="w-full max-h-[520px] object-contain"
                  />
                </div>
              ) : (
                <div className="rounded-lg border border-border/60 bg-muted/30 px-4 py-10 grid place-items-center text-center text-sm text-muted-foreground">
                  Binary file ({entryContentType}). No inline preview - use
                  the public URL or the Media tab to view.
                </div>
              )}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    File name
                  </span>
                  <span className="font-mono truncate">{entry.name}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    Content type
                  </span>
                  <span className="font-mono">{entryContentType}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    Entry id
                  </span>
                  <span className="font-mono">#{entry.id}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    Revisions
                  </span>
                  <span className="font-mono">{entry.revisions.length}</span>
                </div>
              </div>
            </div>
          ) : isPremium && !decrypted ? (
            <div className="flex flex-col items-center gap-4 rounded-xl border border-amber-400/30 bg-amber-400/5 px-6 py-10 text-center">
              <div className="grid place-items-center size-12 rounded-full bg-amber-400/10 text-amber-300 border border-amber-400/40">
                <Lock className="size-5" />
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="text-base font-semibold">Encrypted body</h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  Decrypt with your publisher cap to load the current content
                  into the editor. One signed personal message.
                </p>
              </div>
              <div className="flex flex-col items-center gap-2">
                {unlock.isPending ? (
                  <StatusIndicator
                    phase={
                      unlock.phase === "signing-session"
                        ? "signing-session"
                        : unlock.phase === "fetching-blob"
                          ? "fetching-blob"
                          : "decrypting"
                    }
                  />
                ) : null}
                <Button
                  onClick={onUnlock}
                  disabled={unlock.isPending}
                  className="gap-2"
                >
                  <Unlock className="size-4" />
                  {unlock.hasSessionKey ? "Decrypt" : "Unlock to edit"}
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 flex-wrap">
                <MediaPicker
                  publicationId={publicationId}
                  hasMediaCollection={hasMediaCollection}
                  onInsert={({ name, url }) => {
                    const safeAlt = name.replace(/[\[\]]/g, "");
                    insertMarkdown(`![${safeAlt}](${url})`);
                  }}
                />
                <ContentPicker
                  publicationId={publicationId}
                  collectionName={collectionName}
                  excludeEntryId={entry.id}
                  onInsert={({ name, url }) => {
                    const safeAlt = name.replace(/[\[\]]/g, "");
                    insertMarkdown(`[${safeAlt}](${url})`);
                  }}
                />
              </div>
              <div
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                className={`relative rounded-lg transition-all ${
                  dragging
                    ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
                    : ""
                }`}
              >
                {dragging ? (
                  <div className="absolute inset-0 z-20 grid place-items-center rounded-lg bg-primary/10 backdrop-blur-sm pointer-events-none">
                    <div className="flex flex-col items-center gap-2 text-primary">
                      <FileUp className="size-6" />
                      <p className="text-sm font-medium">
                        Drop to replace content
                      </p>
                    </div>
                  </div>
                ) : null}
                <MarkdownEditor value={markdown} onChange={setMarkdown} />
              </div>
            </>
          )}
          <p className="text-xs text-muted-foreground">
            Pick from your library to compose, or drop a new file from your
            machine - text replaces the body, images and binaries upload to
            the <code className="font-mono">{MEDIA_COLLECTION_NAME}</code>{" "}
            collection and insert references.
          </p>
        </div>

        <aside className="flex flex-col gap-5 rounded-xl border border-border/60 bg-card/30 p-4 lg:max-h-[640px] lg:overflow-y-auto">
          <VersionTimeline
            entry={entry}
            onCopyToEditor={
              isBinaryEntry || isPremium
                ? undefined
                : (md) => setMarkdown(md)
            }
          />
        </aside>
      </div>

      <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border border-border/60 bg-card/40 p-4">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-1.5 self-start"
              disabled={deletePost.isPending}
            >
              <Trash2 className="size-3.5" />
              Delete post
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this post?</AlertDialogTitle>
              <AlertDialogDescription>
                The entry will be removed from the publication. Walrus blobs
                that backed its revisions remain on-chain but become orphaned.
                This is irreversible.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={onDelete}
                className="bg-destructive text-white hover:bg-destructive/90"
              >
                Delete permanently
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:gap-3">
          <div className="flex items-center gap-2 min-h-7">
            {isSaving ? (
              <div className="flex flex-col gap-0.5">
                <StatusIndicator
                  phase={
                    savePhase === "encrypting"
                      ? "encrypting-seal"
                      : savePhase === "uploading-walrus"
                        ? "uploading-walrus"
                        : "confirming-sui"
                  }
                />
                <span className="text-[10px] text-muted-foreground">
                  Sui finality takes ~10-20s on testnet
                </span>
              </div>
            ) : publishDraft.isPending ? (
              <div className="flex flex-col gap-0.5">
                <StatusIndicator phase="confirming-sui" />
                <span className="text-[10px] text-muted-foreground">
                  Sui finality takes ~10-20s on testnet
                </span>
              </div>
            ) : isDirty ? (
              <span className="text-[11px] text-amber-300">
                Unsaved changes
              </span>
            ) : isPremium ? (
              <span className="text-[11px] text-muted-foreground">
                Encrypted · readable by cap holders
              </span>
            ) : !isDirty && !hasDraftHead ? (
              <span className="text-[11px] text-muted-foreground">
                No changes
              </span>
            ) : hasDraftHead && entry.draftHead !== entry.publicHead ? (
              <span className="text-[11px] text-amber-300">
                Draft saved · ready to publish
              </span>
            ) : null}
          </div>
          <TooltipProvider delayDuration={150}>
            <div className="flex gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <span tabIndex={canSave ? -1 : 0}>
                    <Button
                      variant="outline"
                      onClick={onSave}
                      disabled={!canSave}
                      className="gap-1.5"
                    >
                      {isSaving ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Save className="size-4" />
                      )}
                      {isPremium ? "Save encrypted draft" : "Save draft"}
                    </Button>
                  </span>
                </TooltipTrigger>
                {!canSave ? (
                  <TooltipContent side="top" className="max-w-xs">
                    {isPremium && !decrypted
                      ? "Decrypt the body first to enable saving a new encrypted revision."
                      : isSaving
                        ? "Saving in progress..."
                        : "Edit the body below to enable save. The button stays off until the editor differs from the loaded revision."}
                  </TooltipContent>
                ) : null}
              </Tooltip>
              {!isPremium ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span tabIndex={canPublish ? -1 : 0}>
                      <Button
                        onClick={onPublishDraft}
                        disabled={!canPublish}
                        className="gap-1.5"
                      >
                        {publishDraft.isPending ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <Send className="size-4" />
                        )}
                        Publish draft
                      </Button>
                    </span>
                  </TooltipTrigger>
                  {!canPublish ? (
                    <TooltipContent side="top" className="max-w-xs">
                      {!hasDraftHead
                        ? "No unpublished draft exists. Edit the body and Save draft first - publishing promotes a draft revision to public."
                        : entry.draftHead === entry.publicHead
                          ? "The current draft is already the public revision. Save a new draft to create something to publish."
                          : "Wait for the current operation to finish."}
                    </TooltipContent>
                  ) : null}
                </Tooltip>
              ) : null}
            </div>
          </TooltipProvider>
        </div>
      </div>
    </div>
  );
}

function BackLink({ publicationId }: { publicationId: string }) {
  return (
    <Button
      asChild
      variant="ghost"
      size="sm"
      className="self-start gap-1.5 -ml-2"
    >
      <Link href={`/my-blogs/${publicationId}`}>
        <ArrowLeft className="size-4" />
        Back to admin
      </Link>
    </Button>
  );
}
