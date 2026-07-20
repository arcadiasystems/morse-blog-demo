"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  Copy,
  Info,
  Loader2,
  MailPlus,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "../../components/ui/alert";
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
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { EmptyState } from "../../components/feedback/EmptyState";
import { StatusIndicator } from "../../components/feedback/StatusIndicator";
import { Field } from "../../components/forms/Field";
import {
  useIssuePublisherCap,
  useRevokePublisherCap,
} from "../../hooks/use-cap-mutations";
import { useOwnerCap } from "../../hooks/use-owner-cap";
import { mapSdkError } from "../../services/errors";
import { isValidSuiAddress, truncateAddress } from "../../utils/address";

type IssuedCap = {
  publisherCapId: string;
  holder: string;
  issuedAt: number;
};

const storageKey = (publicationId: string) =>
  `morse-blog:issued-caps:${publicationId}`;

function loadIssued(publicationId: string): IssuedCap[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(storageKey(publicationId));
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function saveIssued(publicationId: string, caps: IssuedCap[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      storageKey(publicationId),
      JSON.stringify(caps),
    );
  } catch {
    // ignore quota errors
  }
}

export function MembersTab({ publicationId }: { publicationId: string }) {
  const ownerCap = useOwnerCap(publicationId);
  const issue = useIssuePublisherCap();
  const revoke = useRevokePublisherCap();

  const [holder, setHolder] = useState("");
  const [holderError, setHolderError] = useState<string | null>(null);
  const [issuedCaps, setIssuedCaps] = useState<IssuedCap[]>([]);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  useEffect(() => {
    setIssuedCaps(loadIssued(publicationId));
  }, [publicationId]);

  if (ownerCap.isPending) {
    return <p className="text-sm text-muted-foreground">Loading...</p>;
  }

  if (!ownerCap.data) {
    return (
      <EmptyState
        icon={<Users className="size-5" />}
        title="Only the owner can manage members"
        description="The owner cap for this blog is not in your wallet. Connect with the owner wallet to issue, revoke, or transfer caps."
      />
    );
  }

  const ownerCapId = ownerCap.data;
  const trimmed = holder.trim();
  const canIssue =
    trimmed.length > 0 &&
    !holderError &&
    !issue.isPending &&
    isValidSuiAddress(trimmed);

  function onHolderChange(v: string) {
    setHolder(v);
    if (v.trim().length === 0) {
      setHolderError(null);
      return;
    }
    if (!isValidSuiAddress(v.trim())) {
      setHolderError("Not a valid Sui address (0x + hex).");
    } else {
      setHolderError(null);
    }
  }

  function onIssue(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canIssue) return;
    issue.mutate(
      {
        publicationId,
        ownerCapId,
        holder: trimmed,
      },
      {
        onSuccess: (result) => {
          const next: IssuedCap = {
            publisherCapId: result.publisherCapId,
            holder: trimmed,
            issuedAt: Date.now(),
          };
          const updated = [next, ...issuedCaps];
          setIssuedCaps(updated);
          saveIssued(publicationId, updated);
          setHolder("");
          toast.success("Publisher cap issued", {
            description: `${truncateAddress(trimmed)} can now write posts.`,
          });
        },
        onError: (err) => {
          const m = mapSdkError(err);
          toast.error(m.title, { description: m.body });
        },
      },
    );
  }

  function onRevoke(cap: IssuedCap) {
    setRevokingId(cap.publisherCapId);
    revoke.mutate(
      {
        publicationId,
        ownerCapId,
        publisherCapId: cap.publisherCapId,
      },
      {
        onSuccess: () => {
          const updated = issuedCaps.filter(
            (c) => c.publisherCapId !== cap.publisherCapId,
          );
          setIssuedCaps(updated);
          saveIssued(publicationId, updated);
          toast.success("Cap revoked", {
            description: `${truncateAddress(cap.holder)} can no longer write to this publication.`,
          });
        },
        onError: (err) => {
          const m = mapSdkError(err);
          toast.error(m.title, { description: m.body });
        },
        onSettled: () => setRevokingId(null),
      },
    );
  }

  async function onCopy(value: string) {
    await navigator.clipboard.writeText(value);
    toast.message("Copied to clipboard");
  }

  return (
    <div className="flex flex-col gap-5">
      <Alert className="bg-card/40 border-border/60">
        <Info className="size-4" />
        <AlertTitle className="text-sm">Local cap history</AlertTitle>
        <AlertDescription className="text-xs text-muted-foreground">
          Issued caps are tracked in this browser&apos;s storage. The on-chain
          state is authoritative - a production tool would discover caps via
          an indexer.
        </AlertDescription>
      </Alert>

      <form
        onSubmit={onIssue}
        className="rounded-xl border border-border/60 bg-card/40 overflow-hidden"
      >
        <div className="p-5 border-b border-border/60 flex flex-col gap-1">
          <h2 className="text-sm font-semibold">Invite a co-author</h2>
          <p className="text-xs text-muted-foreground">
            Issues a PublisherCap to the holder. They can write posts but
            cannot manage members or transfer ownership.
          </p>
        </div>
        <div className="p-5 flex flex-col gap-4">
          <Field
            id="holder"
            label="Sui address"
            required
            help="0x-prefixed Sui address. Send the holder the public URL of this blog so they can write from their own wallet."
            error={holderError}
          >
            <Input
              id="holder"
              value={holder}
              onChange={(e) => onHolderChange(e.target.value)}
              placeholder="0x4f3a..."
              className="font-mono"
              spellCheck={false}
            />
          </Field>
        </div>
        <div className="px-5 py-4 border-t border-border/60 bg-card/30 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-h-7">
            {issue.isPending ? <StatusIndicator phase="confirming-sui" /> : null}
          </div>
          <Button type="submit" disabled={!canIssue} className="gap-1.5">
            {issue.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <MailPlus className="size-4" />
            )}
            Invite
          </Button>
        </div>
      </form>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Issued caps</h2>
          <span className="text-xs text-muted-foreground">
            {issuedCaps.length} active
          </span>
        </div>
        {issuedCaps.length === 0 ? (
          <EmptyState
            icon={<UserPlus className="size-5" />}
            title="No co-authors yet"
            description="Invite one by Sui address above. They'll be able to write posts using their own wallet."
          />
        ) : (
          <ul className="flex flex-col gap-2">
            {issuedCaps.map((cap) => (
              <li
                key={cap.publisherCapId}
                className="flex items-center gap-3 rounded-lg border border-border/60 bg-card/40 px-4 py-3"
              >
                <div className="grid place-items-center size-9 rounded-md bg-primary/10 text-primary border border-primary/30 shrink-0">
                  <UserPlus className="size-4" />
                </div>
                <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                  <button
                    onClick={() => onCopy(cap.holder)}
                    className="flex items-center gap-1.5 font-mono text-sm hover:text-primary transition-colors"
                  >
                    {truncateAddress(cap.holder, 8, 6)}
                    <Copy className="size-3 opacity-60" />
                  </button>
                  <button
                    onClick={() => onCopy(cap.publisherCapId)}
                    className="flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground hover:text-foreground transition-colors text-left"
                  >
                    cap: {truncateAddress(cap.publisherCapId, 6, 4)}
                    <Copy className="size-2.5 opacity-60" />
                  </button>
                </div>
                <Badge variant="outline" className="border-border/60 text-[10px]">
                  Active
                </Badge>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                      disabled={revokingId === cap.publisherCapId}
                      aria-label="Revoke cap"
                    >
                      {revokingId === cap.publisherCapId ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Trash2 className="size-4" />
                      )}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Revoke this cap?</AlertDialogTitle>
                      <AlertDialogDescription>
                        {truncateAddress(cap.holder)} will lose write access
                        immediately. Their existing posts stay on the
                        publication. They can no longer decrypt premium posts
                        either - Seal verifies cap status on every decrypt.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => onRevoke(cap)}
                        className="bg-destructive text-white hover:bg-destructive/90"
                      >
                        Revoke cap
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
