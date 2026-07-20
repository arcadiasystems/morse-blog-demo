"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  toPublisherCapId,
  type Entry,
} from "@arcadiasystems/morse-sdk";
import { SessionKey } from "@mysten/seal";
import { useMorse } from "../hooks/use-morse";

export type UnlockPhase =
  | "idle"
  | "signing-session"
  | "fetching-blob"
  | "decrypting"
  | "done";

export type UnlockInput = {
  entry: Entry;
  publisherCapId: string;
};

const DECODER = new TextDecoder();

/**
 * Decrypts the current draft revision of an encrypted entry.
 *
 * - SessionKey is cached per-session per-account; subsequent unlocks reuse
 *   it (no extra wallet popup) until it expires (ttlMin) or the account
 *   changes.
 * - Reads ciphertext from the Walrus aggregator, runs seal.decrypt with the
 *   sessionKey + sealId + publisherCapId, decodes UTF-8.
 * - Throws if entry isn't encrypted or has no draft.
 */
export function useUnlockEntry() {
  const morse = useMorse();
  const sessionKeyRef = useRef<SessionKey | null>(null);
  const [phase, setPhase] = useState<UnlockPhase>("idle");
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    sessionKeyRef.current = null;
  }, [morse?.account?.address]);

  const unlock = useCallback(
    async (input: UnlockInput): Promise<string> => {
      if (!morse) throw new Error("Connect a wallet first.");
      const { entry, publisherCapId } = input;
      if (entry.draftHead === null) {
        throw new Error("Entry has no draft to decrypt.");
      }
      const revision = entry.revisions[entry.draftHead];
      if (!revision || !revision.encrypted || !revision.sealId) {
        throw new Error("Entry is not encrypted.");
      }

      setIsPending(true);
      setError(null);
      try {
        let sk = sessionKeyRef.current;
        if (!sk || sk.isExpired()) {
          setPhase("signing-session");
          sk = await SessionKey.create({
            address: morse.signer.toSuiAddress(),
            packageId:
              morse.config.originalPackageId ?? morse.config.packageId,
            ttlMin: 10,
            signer: morse.signer,
            suiClient: morse.client,
          });
          sessionKeyRef.current = sk;
        }

        setPhase("fetching-blob");
        const ciphertext = await morse.walrusRead.readBlobRef(revision.blobRef);

        setPhase("decrypting");
        const plaintext = await morse.seal.decrypt(ciphertext, {
          sessionKey: sk,
          sealId: revision.sealId,
          publisherCapId: toPublisherCapId(publisherCapId),
        });

        setPhase("done");
        return DECODER.decode(plaintext);
      } catch (err) {
        const e = err instanceof Error ? err : new Error(String(err));
        setError(e);
        throw e;
      } finally {
        setIsPending(false);
        setTimeout(() => setPhase("idle"), 500);
      }
    },
    [morse],
  );

  const hasSessionKey = sessionKeyRef.current !== null;

  return { unlock, phase, isPending, error, hasSessionKey };
}
