import { decodeSuiPrivateKey, type Keypair } from "@mysten/sui/cryptography";
import { SuiGrpcClient } from "@mysten/sui/grpc";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { Secp256k1Keypair } from "@mysten/sui/keypairs/secp256k1";
import { Secp256r1Keypair } from "@mysten/sui/keypairs/secp256r1";
import { Transaction } from "@mysten/sui/transactions";
import { fromBase64, toBase64 } from "@mysten/sui/utils";
import type { BrowserContext } from "@playwright/test";
import { registerTestWallet } from "./register-test-wallet";

/**
 * The test-only Wallet Standard wallet. It is registered in the page by
 * Playwright and never imported by app code, so it is never bundled. Keys
 * stay in this Node process; the page only sees addresses and public keys.
 */
export const TEST_WALLET_NAME = "Morse E2E Wallet";

/** Funded Testnet key of the wallet that owns the blog under test. */
export const OWNER_KEY_ENV = "E2E_SUI_PRIVATE_KEY";
/**
 * Optional key of the co-author wallet. It only receives a PublisherCap and
 * reads, so it needs no funds; without it the tests use a throwaway key.
 */
export const COAUTHOR_KEY_ENV = "E2E_SUI_COAUTHOR_PRIVATE_KEY";

/**
 * The only chain the wallet signs for. The app also lists mainnet and
 * devnet; a request for either is refused here, so a test can never spend
 * outside Testnet whatever key it was given.
 */
const TESTNET_CHAIN = "sui:testnet";
export const TESTNET_FULLNODE = "https://fullnode.testnet.sui.io:443";

type WalletRequest =
  | { kind: "signPersonalMessage"; address: string; message: string }
  | {
      kind: "signTransaction" | "signAndExecuteTransaction";
      address: string;
      chain: string;
      transaction: string;
    };

/** The key in the environment variable `name`, or `null` when it is not set. */
export function keypairFromEnv(name: string): Keypair | null {
  const secret = process.env[name];
  if (!secret) return null;
  let scheme: string;
  try {
    scheme = decodeSuiPrivateKey(secret).scheme;
  } catch {
    // Never surface the decoder's message: it could echo part of the secret.
    throw new Error(`${name} is not a valid suiprivkey string.`);
  }
  switch (scheme) {
    case "ED25519":
      return Ed25519Keypair.fromSecretKey(secret);
    case "Secp256k1":
      return Secp256k1Keypair.fromSecretKey(secret);
    case "Secp256r1":
      return Secp256r1Keypair.fromSecretKey(secret);
    default:
      throw new Error(
        `${name} uses the ${scheme} scheme, which the test wallet does not support.`,
      );
  }
}

/** Registers the test wallet for `keypair` in every page the context opens. */
export async function installTestWallet(
  context: BrowserContext,
  keypair: Keypair,
): Promise<void> {
  const address = keypair.toSuiAddress();
  const client = new SuiGrpcClient({
    network: "testnet",
    baseUrl: TESTNET_FULLNODE,
  });

  await context.exposeFunction(
    "__morseE2eWalletBridge",
    async (request: WalletRequest) => {
      if (request.address !== address)
        throw new Error(`The test wallet has no account ${request.address}.`);
      if (request.kind === "signPersonalMessage")
        return keypair.signPersonalMessage(fromBase64(request.message));
      if (request.chain !== TESTNET_CHAIN)
        throw new Error(`The test wallet only signs for ${TESTNET_CHAIN}.`);

      const transaction = Transaction.from(request.transaction);
      const bytes = await transaction.build({ client });
      if (request.kind === "signTransaction")
        return keypair.signTransaction(bytes);

      const { signature } = await keypair.signTransaction(bytes);
      const result = await client.executeTransaction({
        transaction: bytes,
        signatures: [signature],
        include: { effects: true },
      });
      const executed = result.Transaction ?? result.FailedTransaction;
      const effects = executed.effects.bcs;
      if (!effects)
        throw new Error(`Transaction ${executed.digest} returned no effects.`);
      return {
        bytes: toBase64(bytes),
        signature,
        digest: executed.digest,
        effects: toBase64(effects),
      };
    },
  );

  await context.addInitScript(registerTestWallet, {
    name: TEST_WALLET_NAME,
    bridge: "__morseE2eWalletBridge",
    authorizedKey: "morse-e2e-wallet:authorized",
    chains: [TESTNET_CHAIN],
    accounts: [
      {
        address,
        publicKey: toBase64(keypair.getPublicKey().toSuiBytes()),
      },
    ],
  });
}
