import "server-only";
import {
  type BlobRef,
  type Entry,
  type Publication,
  toPublicationId,
} from "@arcadiasystems/morse-sdk";
import { DEFAULT_COLLECTION_NAME } from "@/lib/morse-config";
import { getServerMorseReader } from "@/services/morse-reader.server";

export type PublicBlogData = {
  publication: Publication;
  entries: Entry[];
};

export async function loadPublicBlog(
  publicationId: string,
): Promise<PublicBlogData | null> {
  const { reader } = getServerMorseReader();
  try {
    const publication = await reader.getPublication(
      toPublicationId(publicationId),
    );
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
  } catch {
    return null;
  }
}

export async function loadPublicEntry(
  publicationId: string,
  entryId: number,
  collectionName: string = DEFAULT_COLLECTION_NAME,
): Promise<{ publication: Publication; entry: Entry } | null> {
  const { reader } = getServerMorseReader();
  try {
    const publication = await reader.getPublication(
      toPublicationId(publicationId),
    );
    const entry = await reader.getEntry(
      publication.id,
      collectionName,
      entryId,
    );
    return { publication, entry };
  } catch {
    return null;
  }
}

const TEXT_DECODER = new TextDecoder();

export async function readPublicRevisionText(
  blobRef: BlobRef,
): Promise<string | null> {
  const { walrusRead } = getServerMorseReader();
  try {
    const bytes = await walrusRead.readBlobRef(blobRef);
    return TEXT_DECODER.decode(bytes);
  } catch {
    return null;
  }
}
