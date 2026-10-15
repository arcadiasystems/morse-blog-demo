import type { SuiGrpcClient } from "@mysten/sui/grpc";
import { blobIdFromInt } from "@mysten/walrus";

type ObjectReader = Pick<SuiGrpcClient, "getObject">;

/**
 * Resolves the content-addressed Walrus blob id of a Sui `Blob` object, the
 * same lookup the SDK's aggregator adapter performs before every read: the
 * object's `blob_id` field is a u256 that Walrus encodes as URL-safe base64.
 * Read-only and safe on server or client.
 *
 * @throws When the object is missing or has no `blob_id` field.
 */
export async function resolveWalrusBlobId(
  client: ObjectReader,
  blobObjectId: string,
  signal?: AbortSignal,
): Promise<string> {
  const { object } = await client.getObject({
    objectId: blobObjectId,
    include: { json: true },
    signal,
  });
  const raw = object.json?.blob_id;
  if (typeof raw !== "string" && typeof raw !== "number") {
    throw new Error(`Walrus blob object ${blobObjectId} has no blob_id field`);
  }
  return blobIdFromInt(BigInt(raw));
}
