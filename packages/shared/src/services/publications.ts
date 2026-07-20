import type {
  OwnerCapId,
  Publication,
  PublicationId,
  RpcPublicationReader,
  SuiAddress,
} from "@arcadiasystems/morse-sdk";

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
 * Lists publications the wallet can write to via a PublisherCap but does
 * NOT own (no OwnerCap). This is the "shared with me" / co-author set.
 *
 * A publication the wallet both owns and holds a publisher cap on is
 * excluded here (it belongs in the owned list). We resolve ownership by
 * cross-referencing the owned set's publication ids.
 */
export async function listCoauthoredPublicationsWithDetails(
  reader: RpcPublicationReader,
  address: SuiAddress,
  signal?: AbortSignal,
): Promise<OwnedPublicationWithDetails[]> {
  const [capPage, ownedPage] = await Promise.all([
    reader.listPublisherCapsOwnedBy(address, { signal }),
    reader.listPublicationsOwnedBy(address, { signal }),
  ]);

  const ownedIds = new Set(ownedPage.results.map((h) => h.publicationId));

  // Unique publication ids from publisher caps that we do NOT own.
  const coauthoredIds = Array.from(
    new Set(
      capPage.results
        .map((cap) => cap.publicationId)
        .filter((id) => !ownedIds.has(id)),
    ),
  );

  const details = await Promise.all(
    coauthoredIds.map(async (publicationId) => {
      const publication = await reader.getPublication(publicationId, signal);
      return {
        ownerCapId: null,
        publicationId,
        publication,
      };
    }),
  );
  return details;
}
