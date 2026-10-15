import { quiltPatchIdToString, type BlobRef } from "@arcadiasystems/morse-sdk";
import {
  MORSE_NETWORK,
  morseAppConfig,
  walrusObjectUrl,
} from "@/lib/morse-config";

/**
 * Explorer and aggregator links for on-chain records. Sui objects and
 * transactions go to Suiscan on the demo's network; Walrus bytes go to the
 * same aggregator the SDK reads from, using the aggregator's URL patterns
 * (`/v1/blobs/<blobId>`, `/v1/blobs/by-object-id/<id>`,
 * `/v1/blobs/by-quilt-patch-id/<id>`).
 */
const SUISCAN_BASE = `https://suiscan.xyz/${MORSE_NETWORK}`;

export function suiscanObjectUrl(objectId: string): string {
  return `${SUISCAN_BASE}/object/${objectId}`;
}

export function suiscanAccountUrl(address: string): string {
  return `${SUISCAN_BASE}/account/${address}`;
}

export function suiscanTxUrl(digest: string): string {
  return `${SUISCAN_BASE}/tx/${digest}`;
}

function aggregatorUrl(): string {
  return morseAppConfig.walrusEndpoints.aggregator;
}

export function walrusBlobUrl(blobId: string): string {
  return `${aggregatorUrl()}/v1/blobs/${encodeURIComponent(blobId)}`;
}

/** The on-chain id behind a revision's bytes: blob object id or quilt patch id. */
export function blobRefLabel(blobRef: BlobRef): string {
  return blobRef.kind === "blob"
    ? blobRef.blobObjectId
    : quiltPatchIdToString(blobRef.patchId);
}

/**
 * Best link to a revision's bytes. Prefers the content-addressed blob id
 * when it has been resolved; otherwise falls back to the Sui object id (or
 * quilt patch id), which the aggregator resolves itself.
 */
export function walrusRevisionUrl(
  blobRef: BlobRef,
  blobId: string | null,
): string {
  if (blobId) return walrusBlobUrl(blobId);
  if (blobRef.kind === "blob") {
    return walrusObjectUrl(aggregatorUrl(), blobRef.blobObjectId);
  }
  return `${aggregatorUrl()}/v1/blobs/by-quilt-patch-id/${encodeURIComponent(blobRefLabel(blobRef))}`;
}
