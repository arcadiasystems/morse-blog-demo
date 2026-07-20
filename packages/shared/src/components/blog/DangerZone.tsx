"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRightLeft,
  Loader2,
  ShieldAlert,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
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
} from "../../components/ui/alert-dialog";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { StatusIndicator } from "../../components/feedback/StatusIndicator";
import { Field } from "../../components/forms/Field";
import { useTransferOwnership } from "../../hooks/use-cap-mutations";
import { useDeletePublication } from "../../hooks/use-delete-publication";
import { useOwnerCap } from "../../hooks/use-owner-cap";
import { usePublisherCap } from "../../hooks/use-publisher-cap";
import { usePublication } from "../../hooks/use-publication";
import { useEntries } from "../../hooks/use-entries";
import { mapSdkError } from "../../services/errors";
import { isValidSuiAddress, truncateAddress } from "../../utils/address";
import { DEFAULT_COLLECTION_NAME } from "../../lib/morse-config";

export function DangerZone({ publicationId }: { publicationId: string }) {
  const router = useRouter();
  const ownerCap = useOwnerCap(publicationId);
  const cap = usePublisherCap(publicationId);
  const transfer = useTransferOwnership();
  const del = useDeletePublication();
  const publication = usePublication(publicationId);
  // Best-effort confirmation count: posts + media + collections + 1.
  const postsEntries = useEntries(publicationId, DEFAULT_COLLECTION_NAME);

  const [recipient, setRecipient] = useState("");
  const [recipientError, setRecipientError] = useState<string | null>(null);
  const [transferConfirm, setTransferConfirm] = useState(false);

  if (ownerCap.isPending || !ownerCap.data) return null;
  const ownerCapId = ownerCap.data;
  const trimmed = recipient.trim();
  const canTransfer =
    trimmed.length > 0 &&
    !recipientError &&
    !transfer.isPending &&
    !del.isPending &&
    isValidSuiAddress(trimmed);

  const collectionCount = publication.data?.collections.length ?? 0;
  const knownEntryCount = postsEntries.data?.length ?? 0;
  // Lower bound (we only counted the posts collection cheaply) - shown as "~".
  const approxConfirmations = knownEntryCount + collectionCount + 1;

  function onRecipientChange(v: string) {
    setRecipient(v);
    if (v.trim().length === 0) {
      setRecipientError(null);
      return;
    }
    setRecipientError(
      isValidSuiAddress(v.trim()) ? null : "Not a valid Sui address (0x + hex).",
    );
  }

  function onTransferSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canTransfer) return;
    setTransferConfirm(true);
  }

  function onTransferConfirm() {
    setTransferConfirm(false);
    transfer.mutate(
      { ownerCapId, recipient: trimmed },
      {
        onSuccess: () => {
          toast.success("Ownership transferred", {
            description: `OwnerCap moved to ${truncateAddress(trimmed)}. You no longer admin this blog.`,
          });
          router.push("/my-blogs");
        },
        onError: (err) => {
          const m = mapSdkError(err);
          toast.error(m.title, { description: m.body });
        },
      },
    );
  }

  function onDeleteConfirm() {
    if (!cap.data) {
      toast.error("Missing publisher cap", {
        description:
          "Deleting requires removing entries + collections, which needs your PublisherCap.",
      });
      return;
    }
    del.mutate(
      {
        publicationId,
        ownerCapId,
        publisherCapId: cap.data.id,
      },
      {
        onSuccess: () => {
          toast.success("Blog deleted", {
            description: "The publication and all its collections are gone.",
          });
          router.push("/my-blogs");
        },
        onError: (err) => {
          const m = mapSdkError(err);
          toast.error(m.title, { description: m.body });
        },
      },
    );
  }

  return (
    <div className="rounded-xl border border-destructive/40 bg-destructive/5 overflow-hidden">
      <div className="p-5 border-b border-destructive/30 flex items-center gap-2">
        <ShieldAlert className="size-4 text-destructive" />
        <h2 className="text-sm font-semibold">Danger zone</h2>
      </div>

      {/* Transfer ownership */}
      <form onSubmit={onTransferSubmit} className="flex flex-col">
        <div className="p-5 flex flex-col gap-4 border-b border-destructive/20">
          <div className="flex flex-col gap-1">
            <h3 className="text-sm font-medium">Transfer ownership</h3>
            <p className="text-xs text-muted-foreground">
              Moves the OwnerCap to the recipient. You immediately lose admin
              access. Your existing PublisherCap (if any) stays valid until the
              new owner revokes it.
            </p>
          </div>
          <Field
            id="recipient"
            label="New owner address"
            required
            help="0x-prefixed Sui address. Make sure they're ready to receive the OwnerCap object."
            error={recipientError}
          >
            <Input
              id="recipient"
              value={recipient}
              onChange={(e) => onRecipientChange(e.target.value)}
              placeholder="0x4f3a..."
              className="font-mono"
              spellCheck={false}
            />
          </Field>
          <div className="flex items-center justify-between gap-3">
            <div className="min-h-7 flex items-center">
              {transfer.isPending ? (
                <StatusIndicator phase="confirming-sui" />
              ) : null}
            </div>
            <AlertDialog
              open={transferConfirm}
              onOpenChange={setTransferConfirm}
            >
              <AlertDialogTrigger asChild>
                <Button
                  type="submit"
                  disabled={!canTransfer}
                  variant="outline"
                  className="gap-1.5 border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  {transfer.isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <ArrowRightLeft className="size-4" />
                  )}
                  Transfer ownership
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Transfer ownership to {truncateAddress(trimmed)}?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    This is irreversible from your side. After this
                    transaction:
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                      <li>The OwnerCap object moves to the recipient.</li>
                      <li>You lose the ability to issue or revoke caps.</li>
                      <li>You lose the ability to delete this blog.</li>
                      <li>
                        Your existing PublisherCap (if any) stays valid until
                        the new owner revokes it.
                      </li>
                    </ul>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={onTransferConfirm}
                    className="bg-destructive text-white hover:bg-destructive/90"
                  >
                    Yes, transfer ownership
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </form>

      {/* Delete blog */}
      <div className="p-5 flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h3 className="text-sm font-medium">Delete this blog</h3>
          <p className="text-xs text-muted-foreground">
            Permanently removes the publication. The Move contract requires
            collections to be empty first, so this cascades: every entry is
            deleted, then every collection, then the publication.{" "}
            <span className="text-foreground/90">
              Each step is a separate wallet confirmation
            </span>{" "}
            (roughly {approxConfirmations} for this blog).
          </p>
        </div>
        <div className="flex items-center justify-between gap-3">
          <div className="min-h-7 flex items-center gap-2">
            {del.isPending ? (
              <>
                <StatusIndicator
                  phase={
                    del.phase === "deleting-publication"
                      ? "confirming-sui"
                      : "confirming-sui"
                  }
                />
                <span className="text-[11px] text-muted-foreground">
                  {del.phase === "deleting-entries"
                    ? "Removing entries"
                    : del.phase === "deleting-collections"
                      ? "Removing collections"
                      : "Removing publication"}{" "}
                  {del.progress.total > 0
                    ? `(${del.progress.done}/${del.progress.total})`
                    : ""}
                </span>
              </>
            ) : null}
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                disabled={del.isPending || transfer.isPending}
                className="bg-destructive text-white hover:bg-destructive/90 gap-1.5"
              >
                {del.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Trash2 className="size-4" />
                )}
                Delete blog
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  Delete &ldquo;{publication.data?.name ?? "this blog"}&rdquo;?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  This permanently deletes the publication and everything in
                  it. It cannot be undone. The cascade will prompt you to sign{" "}
                  <span className="text-foreground/90">
                    ~{approxConfirmations} transactions
                  </span>{" "}
                  (entries, then collections, then the publication). Walrus
                  blobs that backed deleted entries become orphaned but are not
                  reclaimed.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={onDeleteConfirm}
                  className="bg-destructive text-white hover:bg-destructive/90"
                >
                  Delete permanently
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}
