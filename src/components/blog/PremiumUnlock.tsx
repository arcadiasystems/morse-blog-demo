"use client";

import { useState } from "react";
import { Lock, Unlock } from "lucide-react";
import { toast } from "sonner";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/feedback/EmptyState";
import { StatusIndicator } from "@/components/feedback/StatusIndicator";
import { MarkdownRenderer } from "@/components/blog/MarkdownRenderer";
import { WalletButton } from "@/components/layout/WalletButton";
import { DEFAULT_COLLECTION_NAME } from "@/lib/morse-config";
import { useEntries } from "@/hooks/use-entries";
import { usePublisherCap } from "@/hooks/use-publisher-cap";
import { useUnlockEntry } from "@/hooks/use-unlock-entry";
import { mapSdkError } from "@/services/errors";

type Props = {
  publicationId: string;
  entryId: number;
  collectionName?: string;
};

/**
 * Client-side unlock surface for premium entries. The public post page
 * server-renders the metadata + lock CTA; once the user clicks "Unlock", we
 * run SessionKey.create -> walrus read -> seal.decrypt and render markdown
 * inline.
 */
export function PremiumUnlock({
  publicationId,
  entryId,
  collectionName = DEFAULT_COLLECTION_NAME,
}: Props) {
  const account = useCurrentAccount();
  const entries = useEntries(publicationId, collectionName);
  const entry = entries.data?.find((e) => e.id === entryId);
  const cap = usePublisherCap(publicationId);
  const unlock = useUnlockEntry();
  const [plaintext, setPlaintext] = useState<string | null>(null);

  if (!account) {
    return (
      <EmptyState
        icon={<Lock className="size-5" />}
        title="Connect to unlock"
        description="This is an encrypted post. Connect a wallet that holds a publisher cap on this publication to decrypt and read."
        action={<WalletButton size="lg" />}
      />
    );
  }

  if (entries.isPending || cap.isPending) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/6" />
      </div>
    );
  }

  if (!entry) {
    return (
      <EmptyState
        icon={<Lock className="size-5" />}
        title="Entry not found"
        description="This entry may have been deleted or the publication ID is wrong."
      />
    );
  }

  if (!cap.data) {
    return (
      <EmptyState
        icon={<Lock className="size-5" />}
        title="No access"
        description="Your wallet does not hold a publisher cap on this publication. The blog owner can issue you one to grant decryption access."
      />
    );
  }

  if (plaintext !== null) {
    return <MarkdownRenderer source={plaintext} />;
  }

  const onUnlock = async () => {
    try {
      const text = await unlock.unlock({
        entry,
        publisherCapId: cap.data!.id,
      });
      setPlaintext(text);
      toast.success("Unlocked");
    } catch (err) {
      const m = mapSdkError(err);
      toast.error(m.title, { description: m.body });
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 rounded-xl border border-amber-400/30 bg-amber-400/5 px-6 py-10 text-center">
      <div className="grid place-items-center size-12 rounded-full bg-amber-400/10 text-amber-300 border border-amber-400/40">
        <Lock className="size-5" />
      </div>
      <div className="flex flex-col gap-1">
        <h3 className="text-base font-semibold">Premium post</h3>
        <p className="text-sm text-muted-foreground max-w-md">
          Encrypted client-side with Seal. Unlock signs one personal message
          to derive a session key, then decrypts the body in your browser.
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
          {unlock.hasSessionKey ? "Decrypt" : "Unlock with wallet"}
        </Button>
      </div>
    </div>
  );
}
