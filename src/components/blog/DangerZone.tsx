"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShieldAlert, ArrowRightLeft } from "lucide-react";
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
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusIndicator } from "@/components/feedback/StatusIndicator";
import { Field } from "@/components/forms/Field";
import { useTransferOwnership } from "@/hooks/use-cap-mutations";
import { useOwnerCap } from "@/hooks/use-owner-cap";
import { mapSdkError } from "@/services/errors";
import { isValidSuiAddress, truncateAddress } from "@/utils/address";

export function DangerZone({ publicationId }: { publicationId: string }) {
  const router = useRouter();
  const ownerCap = useOwnerCap(publicationId);
  const transfer = useTransferOwnership();

  const [recipient, setRecipient] = useState("");
  const [recipientError, setRecipientError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (ownerCap.isPending || !ownerCap.data) return null;
  const ownerCapId = ownerCap.data;
  const trimmed = recipient.trim();
  const canTransfer =
    trimmed.length > 0 &&
    !recipientError &&
    !transfer.isPending &&
    isValidSuiAddress(trimmed);

  function onRecipientChange(v: string) {
    setRecipient(v);
    if (v.trim().length === 0) {
      setRecipientError(null);
      return;
    }
    if (!isValidSuiAddress(v.trim())) {
      setRecipientError("Not a valid Sui address (0x + hex).");
    } else {
      setRecipientError(null);
    }
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canTransfer) return;
    setConfirmOpen(true);
  }

  function onConfirm() {
    setConfirmOpen(false);
    transfer.mutate(
      {
        ownerCapId,
        recipient: trimmed,
      },
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

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-xl border border-destructive/40 bg-destructive/5 overflow-hidden"
    >
      <div className="p-5 border-b border-destructive/30 flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <ShieldAlert className="size-4 text-destructive" />
          <h2 className="text-sm font-semibold">Danger zone</h2>
        </div>
        <p className="text-xs text-muted-foreground">
          Transferring ownership moves the OwnerCap to the recipient address.
          You immediately lose admin access. Your existing PublisherCap (if
          any) stays valid until the new owner revokes it.
        </p>
      </div>
      <div className="p-5 flex flex-col gap-4">
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
      </div>
      <div className="px-5 py-4 border-t border-destructive/30 bg-destructive/[0.06] flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-h-7">
          {transfer.isPending ? (
            <StatusIndicator phase="confirming-sui" />
          ) : null}
        </div>
        <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <AlertDialogTrigger asChild>
            <Button
              type="submit"
              disabled={!canTransfer}
              className="bg-destructive text-white hover:bg-destructive/90 gap-1.5"
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
                This is irreversible from your side. After this transaction:
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>The OwnerCap object moves to the recipient.</li>
                  <li>You lose the ability to issue or revoke caps.</li>
                  <li>You lose the ability to delete this publication.</li>
                  <li>
                    Your existing PublisherCap (if any) stays valid until the
                    new owner revokes it.
                  </li>
                </ul>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={onConfirm}
                className="bg-destructive text-white hover:bg-destructive/90"
              >
                Yes, transfer ownership
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </form>
  );
}
