import {
  type MorsePackageConfig,
  NotFoundError,
  type ObjectReader,
  type OwnerCapId,
  type Publication,
  type PublicationId,
  type PublisherCap,
  RpcPublicationReader,
  type SuiAddress,
} from "@arcadiasystems/morse-sdk";
import { mapWithConcurrency } from "@/utils/concurrency";

export type OwnedPublicationWithDetails = {
  /** Null when the wallet holds a PublisherCap but not the OwnerCap (co-author). */
  ownerCapId: OwnerCapId | null;
  publicationId: PublicationId;
  publication: Publication;
};

/**
 * Lists publications owned by `address` and resolves the full Publication
 * struct for each. Use this in client hooks when you want name/slug/collections
 * for rendering, not just the bare ID + owner cap.
 *
 * On-chain reads only - safe to call from server or client.
 */
export async function listOwnedPublicationsWithDetails(
  reader: RpcPublicationReader,
  address: SuiAddress,
  signal?: AbortSignal,
): Promise<OwnedPublicationWithDetails[]> {
  const page = await reader.listPublicationsOwnedBy(address, { signal });
  const details = await Promise.all(
    page.results.map(async (handle) => {
      const publication = await reader.getPublication(
        handle.publicationId,
        signal,
      );
      return {
        ownerCapId: handle.ownerCapId,
        publicationId: handle.publicationId,
        publication,
      };
    }),
  );
  return details;
}

/**
 * Most publications whose caps are checked at the same time. Each check is a
 * few sequential RPC calls, so this is also the cap on calls in flight: a
 * wallet holding dozens of caps does not fan out into a burst the public
 * fullnode rate-limits.
 */
const CAP_CHECK_CONCURRENCY = 4;

/**
 * A reader that fetches each publication once and answers later reads of it
 * from memory. `isPublisherCapRevoked` loads the publication on every call
 * to find its denylist table, so through this reader checking N caps on one
 * publication costs one publication read instead of N. Build one per
 * listing and drop it afterwards: it never refreshes what it remembers.
 */
class PublicationMemoReader extends RpcPublicationReader {
  private readonly publications = new Map<
    PublicationId,
    Promise<Publication>
  >();

  override getPublication(
    id: PublicationId,
    signal?: AbortSignal,
  ): Promise<Publication> {
    const known = this.publications.get(id);
    if (known) return known;
    const read = super.getPublication(id, signal);
    this.publications.set(id, read);
    return read;
  }
}

/** What a cap check needs: the Sui client and the Morse package ids. */
export type PublisherCapSource = {
  client: ObjectReader;
  config: MorsePackageConfig;
};

export type LivePublisherCaps = {
  publication: Publication;
  /** The caps on this publication its owner has not revoked. Never empty. */
  caps: PublisherCap[];
};

function isMissingPublication(error: unknown): boolean {
  return error instanceof NotFoundError && error.resource === "publication";
}

/**
 * Groups PublisherCaps by publication and keeps the ones that still grant
 * write access. Revoking adds the cap id to a denylist on the publication and
 * leaves the cap object in the holder's wallet, and deleting a publication
 * leaves its caps behind too, so `listPublisherCapsOwnedBy` returns a dead cap
 * exactly like a live one; it only fails once a transaction uses it.
 *
 * Caps on a deleted publication are skipped, as are revoked ones. Any other
 * failure rejects, so a cap is never reported live (or dead) on a read that
 * did not answer.
 */
export async function resolveLivePublisherCaps(
  source: PublisherCapSource,
  caps: readonly PublisherCap[],
  signal?: AbortSignal,
): Promise<LivePublisherCaps[]> {
  const reader = new PublicationMemoReader(
    source.client,
    source.config.originalPackageId ?? source.config.packageId,
  );
  const capsByPublication = new Map<PublicationId, PublisherCap[]>();
  for (const cap of caps) {
    const group = capsByPublication.get(cap.publicationId);
    if (group) group.push(cap);
    else capsByPublication.set(cap.publicationId, [cap]);
  }

  const resolved = await mapWithConcurrency(
    Array.from(capsByPublication),
    CAP_CHECK_CONCURRENCY,
    async ([publicationId, publicationCaps]) => {
      let publication: Publication;
      try {
        publication = await reader.getPublication(publicationId, signal);
      } catch (error) {
        if (isMissingPublication(error)) return null;
        throw error;
      }
      const live: PublisherCap[] = [];
      for (const cap of publicationCaps) {
        const revoked = await reader.isPublisherCapRevoked(
          publicationId,
          cap.id,
          signal,
        );
        if (!revoked) live.push(cap);
      }
      return live.length > 0 ? { publication, caps: live } : null;
    },
  );
  return resolved.filter((group) => group !== null);
}

/**
 * Lists publications the wallet can write to via a PublisherCap but does
 * NOT own (no OwnerCap). This is the "shared with me" / co-author set.
 *
 * A publication the wallet both owns and holds a publisher cap on is
 * excluded here (it belongs in the owned list). We resolve ownership by
 * cross-referencing the owned set's publication ids. A publication that was
 * deleted, or on which every cap the wallet holds has been revoked, is
 * excluded too: the wallet can no longer write to it.
 */
export async function listCoauthoredPublicationsWithDetails(
  source: PublisherCapSource,
  address: SuiAddress,
  signal?: AbortSignal,
): Promise<OwnedPublicationWithDetails[]> {
  const reader = RpcPublicationReader.fromMorseConfig(
    source.config,
    source.client,
  );
  const [capPage, ownedPage] = await Promise.all([
    reader.listPublisherCapsOwnedBy(address, { signal }),
    reader.listPublicationsOwnedBy(address, { signal }),
  ]);

  const ownedIds = new Set(ownedPage.results.map((h) => h.publicationId));

  const live = await resolveLivePublisherCaps(
    source,
    capPage.results.filter((cap) => !ownedIds.has(cap.publicationId)),
    signal,
  );

  return live.map(({ publication }) => ({
    ownerCapId: null,
    publicationId: publication.id,
    publication,
  }));
}
