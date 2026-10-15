"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { LockIcon } from "@/components/brand/icons";
import { StateCard } from "@/components/feedback/StateCard";
import { RevisionLoadError } from "@/components/feedback/RevisionLoadError";
import { MarkdownRenderer } from "@/components/blog/MarkdownRenderer";
import { SignToDecryptDialog } from "@/components/blog/SignToDecryptDialog";
import { WalletButton } from "@/components/layout/WalletButton";
import { DEFAULT_COLLECTION_NAME } from "@/lib/morse-config";
import { useEntries } from "@/hooks/use-entries";
import { usePublisherCap } from "@/hooks/use-publisher-cap";
import { useUnlockEntry, type UnlockPhase } from "@/hooks/use-unlock-entry";
import { isWalrusReadFailure, mapSdkError } from "@/services/errors";
import styles from "./PremiumUnlock.module.css";

type Props = {
  publicationId: string;
  entryId: number;
  collectionName?: string;
  /** 1-based number of the encrypted revision, for the load-error copy. */
  revisionNumber: number;
  /** Aggregator URL of the encrypted blob, for the load-error state. */
  blobHref: string;
  className?: string;
};

/**
 * Shape-only text behind the lock. Never the ciphertext, never the body:
 * the real post is fetched and decrypted only after the reader signs.
 */
const PLACEHOLDER_PARAGRAPHS = [
  "Lorem ipsum is not used here; this text is only a shape. The body of a premium post is encrypted client-side before it reaches Walrus, so the bytes on the network are unreadable without a key.",
  "Readers who hold the right capability sign one message and the Seal key server releases the decryption key. The decrypted text never touches a Morse server because there is no Morse server.",
  "What follows is the playbook itself, section by section, with the numbers from the first three launches.",
  "The first rule is to publish the terms before the raise, not after. The second is to anchor the roadmap the day it is announced. The third is to never edit in place.",
];

const NO_WALLET_NOTE =
  "No wallet? The public posts on this blog need nothing. The encrypted bytes are still on Walrus and the record is still on Sui; only the key is gated.";

const PENDING_LABEL: Record<UnlockPhase, string> = {
  idle: "Unlocking",
  "signing-session": "Waiting for your signature",
  "fetching-blob": "Fetching from Walrus",
  decrypting: "Decrypting",
  done: "Decrypting",
};

/**
 * Client-side unlock surface for premium entries. The public post page
 * server-renders the metadata and record; this component gates the body:
 * connect, confirm the signature, then SessionKey.create -> walrus read ->
 * seal.decrypt, and render the Markdown inline.
 */
export function PremiumUnlock({
  publicationId,
  entryId,
  collectionName = DEFAULT_COLLECTION_NAME,
  revisionNumber,
  blobHref,
  className,
}: Props) {
  const account = useCurrentAccount();
  const entries = useEntries(publicationId, collectionName);
  const entry = entries.data?.find((e) => e.id === entryId);
  const cap = usePublisherCap(publicationId);
  const unlock = useUnlockEntry();
  const [plaintext, setPlaintext] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [fetchFailed, setFetchFailed] = useState(false);

  const runUnlock = async () => {
    if (!entry || !cap.data) return;
    setConfirming(false);
    setFetchFailed(false);
    try {
      const text = await unlock.unlock({
        entry,
        publisherCapId: cap.data.id,
      });
      setPlaintext(text);
      toast.success("Unlocked");
    } catch (err) {
      if (isWalrusReadFailure(err)) {
        setFetchFailed(true);
        return;
      }
      const m = mapSdkError(err);
      toast.error(m.title, { description: m.body });
    }
  };

  if (plaintext !== null) {
    return <MarkdownRenderer source={plaintext} className={className} />;
  }

  if (fetchFailed) {
    return (
      <RevisionLoadError
        className={className}
        revisionNumber={revisionNumber}
        blobHref={blobHref}
        onRetry={runUnlock}
        retrying={unlock.isPending}
      />
    );
  }

  if (account && entries.isSuccess && !entry) {
    return (
      <StateCard
        className={className}
        icon={<LockIcon size={20} />}
        title="Entry not found"
      >
        This entry may have been deleted or the blog ID is wrong.
      </StateCard>
    );
  }

  const access: Access = !account
    ? "disconnected"
    : entries.isPending || cap.isPending
      ? "checking"
      : cap.data
        ? "granted"
        : "denied";

  return (
    <div className={`${styles.lock} ${className ?? ""}`}>
      <div className={styles.blur} aria-hidden="true">
        {PLACEHOLDER_PARAGRAPHS.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
      <div className={styles.panel}>
        <div className={styles.unlock}>
          <UnlockCard
            access={access}
            pendingLabel={unlock.isPending ? PENDING_LABEL[unlock.phase] : null}
            hasSessionKey={unlock.hasSessionKey}
            onUnlock={() =>
              unlock.hasSessionKey ? runUnlock() : setConfirming(true)
            }
          />
        </div>
      </div>
      <SignToDecryptDialog
        open={confirming}
        onOpenChange={setConfirming}
        onSign={runUnlock}
      />
    </div>
  );
}

type Access = "disconnected" | "checking" | "denied" | "granted";

function UnlockCard({
  access,
  pendingLabel,
  hasSessionKey,
  onUnlock,
}: {
  access: Access;
  /** Progress label while an unlock runs; null when idle. */
  pendingLabel: string | null;
  hasSessionKey: boolean;
  onUnlock: () => void;
}) {
  switch (access) {
    case "disconnected":
      return (
        <>
          <CardTitle>Connect to unlock</CardTitle>
          <p>
            This post is encrypted with Seal. Connect a wallet that holds a
            publisher cap on this blog, sign one message, and it decrypts in
            your browser.
          </p>
          <WalletButton />
          <small>{NO_WALLET_NOTE}</small>
        </>
      );
    case "checking":
      return (
        <>
          <CardTitle>Checking your access</CardTitle>
          <p>Looking up your publisher cap for this blog on Sui.</p>
          <button type="button" className="btn btn-ultra" disabled>
            Checking access
          </button>
        </>
      );
    case "denied":
      return (
        <>
          <CardTitle>No access</CardTitle>
          <p>
            Your wallet does not hold a publisher cap on this blog. The blog
            owner can issue you one to grant decryption access.
          </p>
          <small>{NO_WALLET_NOTE}</small>
        </>
      );
    case "granted":
      return (
        <>
          <CardTitle>Unlock this post</CardTitle>
          <p>
            This post is encrypted with Seal. Your wallet holds a publisher cap
            on this blog. Sign one message and it decrypts in your browser.
          </p>
          <button
            type="button"
            className="btn btn-ultra"
            disabled={pendingLabel !== null}
            aria-live="polite"
            onClick={onUnlock}
          >
            {pendingLabel ?? (hasSessionKey ? "Decrypt post" : "Unlock post")}
          </button>
        </>
      );
  }
}

function CardTitle({ children }: { children: string }) {
  return (
    <h2 className={styles.title}>
      <LockIcon size={22} />
      {children}
    </h2>
  );
}
