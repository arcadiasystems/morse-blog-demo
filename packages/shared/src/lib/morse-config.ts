import { morseConfig } from "@arcadiasystems/morse-sdk";

export const MORSE_NETWORK = "testnet" as const;

export const WALRUS_PUBLISHERS = [
  "https://walrus-testnet-publisher.nami.cloud",
  "https://publisher.testnet.walrus.atalma.io",
  "https://walrus-testnet-publisher.stakingdefenseleague.com",
] as const;

export const DEFAULT_WALRUS_PUBLISHER = WALRUS_PUBLISHERS[0];

/**
 * Walrus storage lease length, in epochs, for every blob we upload (post
 * bodies, encrypted drafts, media). Blobs are NOT permanent: once the lease
 * lapses the aggregator 404s the bytes. The morse Move layer rejects
 * non-deletable blobs, so there is no "store forever" option - duration is
 * the only knob, and the WAL cost scales with it.
 *
 * Testnet epoch is ~1 day and the protocol caps the lease near 53 epochs
 * ahead, so 50 gives ~50 days of survivability - enough that a grant demo
 * left idle for weeks won't expire mid-review. Bump toward the cap if needed.
 */
export const WALRUS_STORAGE_EPOCHS = 50;

/**
 * Aggregator list. The SDK ships a default that points at Mysten's canonical
 * testnet aggregator and we trust it - swapping to an operator-specific
 * aggregator (e.g. nami.cloud) caused CORS/DNS issues that surfaced as
 * `Failed to fetch`. Cross-operator propagation can take ~30s on testnet
 * but reads work universally once the blob lands on the storage committee.
 *
 * To override (e.g. running your own aggregator with verified-bytes mode):
 * pass `walrusEndpoints.aggregator` to `morseConfig` below.
 */
export const FALLBACK_AGGREGATORS = [
  "https://aggregator.walrus-testnet.walrus.space",
  "https://walrus-testnet.blockscope.net",
] as const;

export const morseAppConfig = morseConfig({
  network: MORSE_NETWORK,
});

export const WAL_TESTNET_COIN_TYPE =
  "0x8270feb7375eee355e64fdb69c50abb6b5f9393a722883c1cf45f8e26048810a::wal::WAL";

export const FAUCET_URLS = {
  sui: "https://faucet.sui.io/",
  wal: "https://stake-wal.wal.app/",
} as const;

/**
 * Publication rendered by the homepage's "Read the demo blog" link.
 * Set after seeding (see seed/); empty string hides the link.
 */
export const DEMO_PUBLICATION_ID =
	process.env.NEXT_PUBLIC_DEMO_PUBLICATION_ID ??
	"0x69d4c49be455c72c91de0fdabbb9d94f396ace0cc7f5bbd4b858086dde9cf327";

export const DEFAULT_COLLECTION_NAME = "posts";
export const MEDIA_COLLECTION_NAME = "media";

/**
 * Builds an aggregator URL that serves blob bytes directly by Sui object id.
 * Browser-safe `<img src>` URL for any media entry the wallet has access to.
 *
 * Most public Walrus aggregators support `/v1/blobs/by-object-id/<id>` in
 * addition to the by-blob-id path; if your aggregator does not, swap the
 * URL pattern or resolve `blob_id` via Sui RPC first.
 */
export function walrusObjectUrl(
  aggregatorUrl: string,
  blobObjectId: string,
): string {
  return `${aggregatorUrl}/v1/blobs/by-object-id/${encodeURIComponent(blobObjectId)}`;
}
