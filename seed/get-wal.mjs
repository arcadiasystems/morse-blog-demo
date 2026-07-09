#!/usr/bin/env node
/**
 * Swap testnet SUI for WAL via the Walrus exchange objects, so the seed
 * wallet can pay for Walrus storage. Uses the demo wallet key in
 * seed/.demo-wallet.key (or MORSE_PRIVATE_KEY if set).
 *
 *   node seed/get-wal.mjs [sui-amount]   # default: 1 SUI
 *
 * Exchange object IDs are the published Walrus testnet deployment set
 * (docs.wal.app → Setup). Re-check them after a Walrus testnet reset.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { SuiGrpcClient } from "@mysten/sui/grpc";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { Transaction } from "@mysten/sui/transactions";

const EXCHANGE_OBJECTS = [
  "0x59ab926eb0d94d0d6d6139f11094ea7861914ad2ecffc7411529c60019133997",
  "0x89127f53890840ab6c52fca96b4a5cf853d7de52318d236807ad733f976eef7b",
  "0x9f9b4f113862e8b1a3591d7955fadd7c52ecc07cf24be9e3492ce56eb8087805",
  "0xb60118f86ecb38ec79e74586f1bb184939640911ee1d63a84138d080632ee28a",
];

const here = dirname(fileURLToPath(import.meta.url));
const key =
  process.env.MORSE_PRIVATE_KEY ??
  readFileSync(join(here, ".demo-wallet.key"), "utf8").trim();
const keypair = Ed25519Keypair.fromSecretKey(key);
const address = keypair.getPublicKey().toSuiAddress();

const suiAmount = Number(process.argv[2] ?? "1");
const mist = BigInt(Math.round(suiAmount * 1e9));

const client = new SuiGrpcClient({
  network: "testnet",
  baseUrl: "https://fullnode.testnet.sui.io:443",
});

const { balance } = await client.getBalance({ owner: address });
console.log(`address ${address}`);
console.log(`SUI balance: ${Number(balance.balance) / 1e9}`);
if (BigInt(balance.balance) < mist + 100_000_000n) {
  console.error(`Not enough SUI to swap ${suiAmount} and keep gas. Fund via https://faucet.sui.io`);
  process.exit(1);
}

// Resolve the exchange package from the first live exchange object's type.
let pkg, exchangeId;
for (const id of EXCHANGE_OBJECTS) {
  try {
    const o = await client.getObject({ objectId: id });
    const type = o.object?.objectType ?? o.object?.type;
    const m = String(type).match(/^(0x[a-f0-9]+)::wal_exchange::Exchange/);
    if (m) { pkg = m[1]; exchangeId = id; break; }
  } catch { /* try next */ }
}
if (!pkg) { console.error("No live exchange object found — Walrus testnet may have reset; update EXCHANGE_OBJECTS from docs.wal.app"); process.exit(1); }
console.log(`exchange ${exchangeId} (package ${pkg})`);

const tx = new Transaction();
const [payment] = tx.splitCoins(tx.gas, [tx.pure.u64(mist)]);
const wal = tx.moveCall({
  target: `${pkg}::wal_exchange::exchange_all_for_wal`,
  arguments: [tx.object(exchangeId), payment],
});
tx.transferObjects([wal], tx.pure.address(address));

const result = await client.signAndExecuteTransaction({ transaction: tx, signer: keypair });
const digest = result.transaction?.digest ?? result.digest;
console.log(`swap tx: ${digest}`);
await client.waitForTransaction({ digest });

const balances = await client.listBalances({ owner: address });
for (const b of balances.balances ?? []) {
  if (String(b.coinType).includes("::wal::WAL")) {
    console.log(`WAL balance: ${Number(b.balance) / 1e9}`);
  }
}
console.log("done — the seed wallet can now pay for Walrus storage.");
