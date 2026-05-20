"use client";

import { useEffect, useState } from "react";
import {
  toBlobObjectId,
  type BlobObjectId,
} from "@arcadiasystems/morse-sdk";
import { useMorse } from "@/hooks/use-morse";
import { Skeleton } from "@/components/ui/skeleton";

type Props = {
  blobObjectId: string;
  alt: string;
  className?: string;
  /** Optional content-type for choosing a fallback icon for non-images. */
  contentType?: string;
};

/**
 * Renders an image stored on Walrus using the SDK's read adapter. Fetches
 * bytes via `readBlobByObjectId` (which resolves to a real walrus blobId via
 * Sui RPC under the hood) and wraps them in a session-scoped `blob:` URL.
 * Avoids guessing aggregator URL patterns - works with any aggregator the
 * SDK is configured for.
 */
export function WalrusImage({
  blobObjectId,
  alt,
  className,
  contentType,
}: Props) {
  const morse = useMorse();
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!morse) return;
    let cancelled = false;
    let createdUrl: string | null = null;

    (async () => {
      try {
        const bytes = await morse.walrusRead.readBlobByObjectId(
          toBlobObjectId(blobObjectId) as BlobObjectId,
        );
        if (cancelled) return;
        const blob = new Blob(
          [bytes as unknown as BlobPart],
          contentType ? { type: contentType } : undefined,
        );
        createdUrl = URL.createObjectURL(blob);
        setUrl(createdUrl);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    })();

    return () => {
      cancelled = true;
      if (createdUrl) URL.revokeObjectURL(createdUrl);
    };
  }, [morse, blobObjectId, contentType]);

  if (error) {
    return (
      <div
        className={`grid place-items-center text-[10px] text-muted-foreground ${className ?? ""}`}
        title={error.message}
      >
        unavailable
      </div>
    );
  }

  if (!url) {
    return <Skeleton className={className} />;
  }

  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt={alt} className={className} loading="lazy" />;
}
