"use client";

import { DragEvent, FormEvent, use, useCallback, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  FileUp,
  Lock,
  Loader2,
  Send,
  TriangleAlert,
} from "lucide-react";
import { toast } from "sonner";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { EmptyState } from "@/components/feedback/EmptyState";
import { ErrorState } from "@/components/feedback/ErrorState";
import { StatusIndicator } from "@/components/feedback/StatusIndicator";
import { Field } from "@/components/forms/Field";
import { FormShell } from "@/components/forms/FormShell";
import { ContentPicker } from "@/components/blog/ContentPicker";
import { MarkdownEditor } from "@/components/blog/MarkdownEditor";
import { MediaPicker } from "@/components/blog/MediaPicker";
import { WalletButton } from "@/components/layout/WalletButton";
import {
  MEDIA_COLLECTION_NAME,
  walrusObjectUrl,
} from "@/lib/morse-config";
import { DEFAULT_COLLECTION_NAME } from "@/hooks/use-create-publication";
import { useMorse } from "@/hooks/use-morse";
import { usePublication } from "@/hooks/use-publication";
import { usePublisherCap } from "@/hooks/use-publisher-cap";
import { useUploadMedia } from "@/hooks/use-upload-media";
import { useWritePublicPost } from "@/hooks/use-write-post";
import { useWriteEncryptedPost } from "@/hooks/use-write-encrypted-post";
import { mapSdkError } from "@/services/errors";

const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB testnet soft cap

export default function WritePostPage({
  params,
}: {
  params: Promise<{ publicationId: string }>;
}) {
  const { publicationId } = use(params);
  const account = useCurrentAccount();
  const router = useRouter();
  const searchParams = useSearchParams();
  const collectionName =
    searchParams.get("collection") || DEFAULT_COLLECTION_NAME;

  const morse = useMorse();
  const publication = usePublication(publicationId);
  const cap = usePublisherCap(publicationId);
  const writePublic = useWritePublicPost();
  const writeEncrypted = useWriteEncryptedPost();
  const uploadMedia = useUploadMedia();

  const [title, setTitle] = useState("");
  const [markdown, setMarkdown] = useState("");
  const [dragging, setDragging] = useState(false);
  const [premium, setPremium] = useState(false);

  const hasMediaCollection =
    publication.data?.collections.some(
      (c) => c.name === MEDIA_COLLECTION_NAME,
    ) ?? false;
  const aggregatorUrl = morse?.config.walrusEndpoints.aggregator ?? "";

  const handleFile = useCallback(
    async (file: File): Promise<void> => {
      if (file.size > MAX_FILE_BYTES) {
        toast.warning("File is large for testnet", {
          description: `${(file.size / 1024 / 1024).toFixed(1)} MB exceeds the ~5 MB soft cap. Uploads may fail.`,
        });
      }

      const isTextLike =
        file.type.startsWith("text/") ||
        file.name.endsWith(".md") ||
        file.name.endsWith(".markdown") ||
        file.name.endsWith(".txt");

      // Plain text / markdown -> load into the editor body
      if (isTextLike) {
        const text = await file.text();
        setMarkdown(text);
        if (!title.trim()) {
          const stem = file.name.replace(/\.(md|markdown|txt)$/i, "");
          setTitle(stem);
        }
        toast.success(`Loaded ${file.name}`);
        return;
      }

      // Anything else -> upload to media library and insert reference
      if (!cap.data) {
        toast.error("Missing publisher cap", {
          description:
            "Your wallet doesn't hold a PublisherCap on this publication, so the file can't be uploaded into media.",
        });
        return;
      }
      await new Promise<void>((resolve) => {
        uploadMedia.mutate(
          {
            publicationId,
            publisherCapId: cap.data!.id,
            hasMediaCollection,
            file,
          },
          {
            onSuccess: (result) => {
              const url = walrusObjectUrl(
                aggregatorUrl,
                result.blobObjectId as unknown as string,
              );
              const isImage = file.type.startsWith("image/");
              const safeAlt = file.name.replace(/[\[\]]/g, "");
              const ref = isImage
                ? `![${safeAlt}](${url})`
                : `[${safeAlt}](${url})`;
              setMarkdown((prev) => {
                const sep = prev.length === 0
                  ? ""
                  : prev.endsWith("\n\n")
                    ? ""
                    : prev.endsWith("\n")
                      ? "\n"
                      : "\n\n";
                return `${prev}${sep}${ref}\n`;
              });
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
    },
    [
      cap.data,
      publicationId,
      hasMediaCollection,
      uploadMedia,
      aggregatorUrl,
      title,
    ],
  );

  const onDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(true);
  }, []);
  const onDragLeave = useCallback(() => setDragging(false), []);
  const onDrop = useCallback(
    async (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragging(false);
      const files = Array.from(e.dataTransfer.files ?? []);
      for (const file of files) {
        // eslint-disable-next-line no-await-in-loop
        await handleFile(file);
      }
    },
    [handleFile],
  );

  if (!account) {
    return (
      <div className="flex flex-col gap-6 py-4 sm:py-8 max-w-3xl">
        <BackLink publicationId={publicationId} />
        <EmptyState
          icon={<Send className="size-5" />}
          title="Connect a wallet to write"
          description="Writing a post needs the publisher cap. Connect the wallet that holds it."
          action={<WalletButton size="lg" />}
        />
      </div>
    );
  }

  if (publication.isPending || cap.isPending) {
    return (
      <div className="flex flex-col gap-6 py-4 sm:py-8 max-w-3xl">
        <BackLink publicationId={publicationId} />
        <p className="text-sm text-muted-foreground">Loading editor...</p>
      </div>
    );
  }

  if (publication.isError) {
    return (
      <div className="flex flex-col gap-6 py-4 sm:py-8 max-w-3xl">
        <BackLink publicationId={publicationId} />
        <ErrorState
          title="Publication not found"
          description={
            publication.error instanceof Error
              ? publication.error.message
              : "Couldn't load this publication."
          }
        />
      </div>
    );
  }

  if (!cap.data) {
    return (
      <div className="flex flex-col gap-6 py-4 sm:py-8 max-w-3xl">
        <BackLink publicationId={publicationId} />
        <EmptyState
          icon={<Lock className="size-5" />}
          title="No publisher cap for this blog"
          description="Your wallet doesn't hold a PublisherCap on this publication. The blog owner can issue you one from the Members tab."
        />
      </div>
    );
  }

  const titleError =
    title.length > 0 && title.trim().length === 0 ? "Title is required." : null;
  const isSubmitting = writePublic.isPending || writeEncrypted.isPending;
  const canSubmit =
    title.trim().length > 0 && markdown.trim().length > 0 && !isSubmitting;

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canSubmit || !cap.data) return;

    const args = {
      publicationId,
      publisherCapId: cap.data.id,
      title: title.trim(),
      markdown,
      collectionName,
    } as const;

    const handlers = {
      onSuccess: (result: { entryId: number }) => {
        toast.success(premium ? "Premium post published" : "Post published", {
          description: premium
            ? `Encrypted entry #${result.entryId} is live - readers need to unlock.`
            : `Entry #${result.entryId} is live.`,
        });
        router.push(`/my-blogs/${publicationId}`);
      },
      onError: (err: Error) => {
        const mapped = mapSdkError(err);
        toast.error(mapped.title, { description: mapped.body });
      },
    };

    if (premium) {
      writeEncrypted.mutate(args, handlers);
    } else {
      writePublic.mutate(args, handlers);
    }
  }

  const submitPhase = premium ? writeEncrypted.phase : writePublic.phase;

  return (
    <div className="flex flex-col gap-6 py-4 sm:py-8 max-w-3xl">
      <BackLink publicationId={publicationId} />
      <div className="flex flex-col gap-1.5">
        <h1 className="text-3xl font-bold tracking-tight">Write post</h1>
        <p className="text-sm text-muted-foreground">
          Drafting for{" "}
          <span className="text-foreground font-medium">
            {publication.data!.name}
          </span>{" "}
          in collection{" "}
          <code className="font-mono text-foreground/90 text-[0.9em]">
            {collectionName}
          </code>
          . Markdown is supported. The post body goes to Walrus; the on-chain
          entry references the blob.
        </p>
      </div>

      <Alert className="bg-card/40 border-border/60">
        <TriangleAlert className="size-4" />
        <AlertTitle className="text-sm">Walrus testnet limits</AlertTitle>
        <AlertDescription className="text-xs text-muted-foreground">
          Keep posts under ~5 MB for reliable testnet uploads. Publisher
          operators may rate-limit large or frequent submissions. Mainnet
          supports larger payloads with appropriate WAL.
        </AlertDescription>
      </Alert>

      <FormShell
        title="New post"
        description="One wallet popup confirms the on-chain entry. Walrus upload is publisher-paid (no extra popup)."
        onSubmit={onSubmit}
        footer={
          <>
            <div className="flex items-center gap-2 min-h-7">
              {isSubmitting ? (
                <StatusIndicator
                  phase={
                    submitPhase === "encrypting"
                      ? "encrypting-seal"
                      : submitPhase === "uploading-walrus"
                        ? "uploading-walrus"
                        : "confirming-sui"
                  }
                />
              ) : null}
            </div>
            <Button
              type="submit"
              disabled={!canSubmit}
              className="gap-2 min-w-40"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Publishing...
                </>
              ) : premium ? (
                <>
                  <Lock className="size-4" />
                  Publish premium
                </>
              ) : (
                <>
                  <Send className="size-4" />
                  Publish post
                </>
              )}
            </Button>
          </>
        }
      >
        <Field id="title" label="Title" required error={titleError}>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="My first post on Walrus"
            maxLength={200}
            autoFocus
          />
        </Field>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <Label className="text-sm font-medium">Content</Label>
            <div className="flex items-center gap-2 flex-wrap">
              <MediaPicker
                publicationId={publicationId}
                hasMediaCollection={hasMediaCollection}
                onInsert={({ name, url }) => {
                  const safeAlt = name.replace(/[\[\]]/g, "");
                  setMarkdown((prev) => {
                    const sep =
                      prev.length === 0
                        ? ""
                        : prev.endsWith("\n\n")
                          ? ""
                          : prev.endsWith("\n")
                            ? "\n"
                            : "\n\n";
                    return `${prev}${sep}![${safeAlt}](${url})\n`;
                  });
                }}
              />
              <ContentPicker
                publicationId={publicationId}
                collectionName={collectionName}
                onInsert={({ name, url }) => {
                  const safeAlt = name.replace(/[\[\]]/g, "");
                  setMarkdown((prev) => {
                    const sep =
                      prev.length === 0
                        ? ""
                        : prev.endsWith("\n\n")
                          ? ""
                          : prev.endsWith("\n")
                            ? "\n"
                            : "\n\n";
                    return `${prev}${sep}[${safeAlt}](${url})\n`;
                  });
                }}
              />
              <label
                className={`flex items-center gap-2 text-xs select-none cursor-pointer ${
                  premium ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <Switch checked={premium} onCheckedChange={setPremium} />
                <TooltipProvider delayDuration={150}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="flex items-center gap-1.5">
                        <Lock className="size-3" />
                        Premium (encrypted)
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="left" className="max-w-xs">
                      Encrypts the body client-side with Seal. Only wallets
                      that hold a publisher cap on this publication can unlock
                      and read it. Premium posts have no public revision - the
                      encrypted draft IS the visible version (no separate
                      publish step).
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </label>
            </div>
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
                  <p className="text-sm font-medium">Drop to upload</p>
                  <p className="text-xs text-muted-foreground">
                    text replaces the body · images and files upload to media
                  </p>
                </div>
              </div>
            ) : null}
            <MarkdownEditor value={markdown} onChange={setMarkdown} />
          </div>
          <p className="text-xs text-muted-foreground">
            Drop any file on the editor. <code>.md</code> / <code>.txt</code>{" "}
            replaces the body; images and other binaries upload to the{" "}
            <code className="font-mono">{MEDIA_COLLECTION_NAME}</code>{" "}
            collection on Walrus and insert a reference at the bottom.
          </p>
        </div>
      </FormShell>
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
