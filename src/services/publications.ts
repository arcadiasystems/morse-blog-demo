import type {
  OwnerCapId,
  Publication,
  PublicationId,
  RpcPublicationReader,
  SuiAddress,
} from "@arcadiasystems/morse-sdk";

export type OwnedPublicationWithDetails = {
  ownerCapId: OwnerCapId;
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
