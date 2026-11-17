import { bcs } from "@mysten/sui/bcs";
import { SuiGrpcClient } from "@mysten/sui/grpc";
import { deriveDynamicFieldID } from "@mysten/sui/utils";
import { TESTNET_FULLNODE } from "./test-wallet";

/**
 * Object ids of the denylist rows the app reads to learn whether the caps
 * `holder` has on `publicationId` are revoked: one per cap. A row exists only
 * once its cap is revoked, but the app asks for it either way.
 *
 * Reads Testnet directly, through the same SDK the app uses. The SDK is
 * published as an ES module only, so it is loaded with `import()`: Playwright
 * runs this file as CommonJS.
 */
export async function revocationRowIds(
  publicationId: string,
  holder: string,
): Promise<string[]> {
  const { morseConfig, RpcPublicationReader, toPublicationId, toSuiAddress } =
    await import("@arcadiasystems/morse-sdk");
  const client = new SuiGrpcClient({
    network: "testnet",
    baseUrl: TESTNET_FULLNODE,
  });
  const reader = RpcPublicationReader.fromMorseConfig(
    morseConfig({ network: "testnet" }),
    client,
  );
  const id = toPublicationId(publicationId);
  const [publication, caps] = await Promise.all([
    reader.getPublication(id),
    reader.listPublisherCapsOwnedBy(toSuiAddress(holder)),
  ]);
  return caps.results
    .filter((cap) => cap.publicationId === id)
    .map((cap) =>
      deriveDynamicFieldID(
        publication.revokedPublisherCapsTableId,
        "0x2::object::ID",
        bcs.Address.serialize(cap.id).toBytes(),
      ),
    );
}
