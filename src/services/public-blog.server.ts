import "server-only";
import {
  type BlobRef,
  type Entry,
  NotFoundError,
  type Publication,
  type PublicationId,
  toPublicationId,
  ValidationError,
} from "@arcadiasystems/morse-sdk";
import { DEFAULT_COLLECTION_NAME } from "@/lib/morse-config";
import { getServerMorseReader } from "@/services/morse-reader.server";
import { resolveWalrusBlobId } from "@/services/walrus-blob-id";

export type PublicBlogData = {
  publication: Publication;
  entries: Entry[];
};

/**
 * A publication id from the URL, or null when the path segment is not a Sui
 * object id at all (`/favicon.ico`, a typo): nothing can exist there.
 */
function publicationIdFromPath(segment: string): PublicationId | null {
  try {
    return toPublicationId(segment);
  } catch (error) {
    if (error instanceof ValidationError) return null;
    throw error;
  }
}

/**
 * Logs a failed public read and hands the error back for the caller to
 * throw. Only "the chain has no such publication, collection or entry" is a
 * 404; an RPC failure or an entry that will not decode is a real fault, and
 * rendering it as "not found" would hide it from readers and from the logs.
 */
function publicReadFailure(what: string, error: unknown): unknown {
  console.error(`[public-blog] Could not load ${what}`, error);
  return error;
}

/**
 * The public blog index data, or null when the publication does not exist.
 * @throws When the read fails for any other reason; the route's error
 *   boundary renders it.
 */
export async function loadPublicBlog(
  publicationId: string,
): Promise<PublicBlogData | null> {
  const id = publicationIdFromPath(publicationId);
  if (id === null) return null;
  const { reader } = getServerMorseReader();
  try {
    const publication = await reader.getPublication(id);
    const hasPosts = publication.collections.some(
      (c) => c.name === DEFAULT_COLLECTION_NAME,
    );
    const entries: Entry[] = [];
    if (hasPosts) {
      for await (const entry of reader.scanEntries(
        publication.id,
        DEFAULT_COLLECTION_NAME,
      )) {
        entries.push(entry);
      }
      entries.sort((a, b) => b.id - a.id);
    }
    return { publication, entries };
  } catch (error) {
    if (error instanceof NotFoundError) return null;
    throw publicReadFailure(`publication ${id}`, error);
  }
}

/**
 * One public entry with its publication, or null when either does not exist.
 * @throws When the read fails for any other reason; the route's error
 *   boundary renders it.
 */
export async function loadPublicEntry(
  publicationId: string,
  entryId: number,
  collectionName: string = DEFAULT_COLLECTION_NAME,
): Promise<{ publication: Publication; entry: Entry } | null> {
  const id = publicationIdFromPath(publicationId);
  // Entry ids are non-negative integers; `/1.5` or `/-1` names nothing.
  if (id === null || !Number.isInteger(entryId) || entryId < 0) return null;
  const { reader } = getServerMorseReader();
  try {
    const publication = await reader.getPublication(id);
    const entry = await reader.getEntry(
      publication.id,
      collectionName,
      entryId,
    );
    return { publication, entry };
  } catch (error) {
    if (error instanceof NotFoundError) return null;
    throw publicReadFailure(
      `entry ${collectionName}:${entryId} of publication ${id}`,
      error,
    );
  }
}

const TEXT_DECODER = new TextDecoder();

/**
 * How long the public post page waits on the Walrus aggregator before it
 * gives up and shows the "Could not load this revision" state.
 */
const REVISION_READ_TIMEOUT_MS = 15_000;

export async function readPublicRevisionText(
  blobRef: BlobRef,
): Promise<string | null> {
  const { walrusRead } = getServerMorseReader();
  try {
    const bytes = await walrusRead.readBlobRef(blobRef, {
      signal: AbortSignal.timeout(REVISION_READ_TIMEOUT_MS),
    });
    return TEXT_DECODER.decode(bytes);
  } catch {
    return null;
  }
}

/**
 * Walrus blob id behind a revision, for display and aggregator links. Null
 * for quilt patches (no standalone blob) or when the Sui lookup fails.
 */
export async function resolvePublicBlobId(
  blobRef: BlobRef,
): Promise<string | null> {
  if (blobRef.kind !== "blob") return null;
  const { client } = getServerMorseReader();
  try {
    return await resolveWalrusBlobId(client, blobRef.blobObjectId);
  } catch (err) {
    console.error(
      `[public-blog] Could not resolve blob id for ${blobRef.blobObjectId}`,
      err,
    );
    return null;
  }
}
