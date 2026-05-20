/**
 * Browser wallet integration via the wallet-standard protocol.
 *
 * Copied from @arcadiasystems/morse-dcms morse-sdk/examples/wallet-standard.ts
 * as recommended by the SDK README - this adapter is meant to be vendored
 * into consuming apps so it can be customized without forking the SDK.
 *
 * - `WalletStandardAdapter` (this file) implements morse-sdk's
 *   `WalletAdapter` interface. Wraps a wallet's `signAndExecuteTransaction`
 *   callback so morse-sdk ops (createPublication, addEntry, etc.) work in a
 *   browser without a private key.
 *
 * - `WalletStandardSigner` (shipped from `morse-sdk`) subclasses Sui's
 *   `Signer` abstract by wrapping a wallet's `signTransaction` and
 *   `signPersonalMessage` callbacks. Pass it to `@mysten/walrus`'s
 *   `WalrusClient` and to `@mysten/seal`'s `SessionKey.create`. The user's
 *   key never leaves the wallet.
 */

import {
  type SimulationReturnValues,
  type SuiAddress,
  type TransactionExecutor,
  TransportError,
  type TxCreatedObject,
  type TxDeletedObject,
  type TxReceipt,
  toSuiAddress,
  toSuiObjectId,
  type WalletAdapter,
} from "@arcadiasystems/morse-sdk";
import type { SuiClientTypes } from "@mysten/sui/client";
import type { Transaction } from "@mysten/sui/transactions";

export type WalletSignAndExecute = (input: {
  transaction: Transaction;
}) => Promise<{ digest: string }>;

export class WalletStandardAdapter implements WalletAdapter {
  readonly address: SuiAddress;

  constructor(
    address: string,
    private readonly signAndExecute: WalletSignAndExecute,
    private readonly client: TransactionExecutor,
  ) {
    this.address = toSuiAddress(address);
  }

  async signAndExecuteTransaction(
    tx: Transaction,
    signal?: AbortSignal,
  ): Promise<TxReceipt> {
    let digest: string;
    try {
      const result = await this.signAndExecute({ transaction: tx });
      digest = result.digest;
    } catch (cause) {
      throw new TransportError(
        `wallet sign-and-execute failed: ${
          cause instanceof Error ? cause.message : String(cause)
        }`,
        { cause },
      );
    }

    const final = await this.client.waitForTransaction({
      digest,
      include: { effects: true, objectTypes: true },
      ...(signal === undefined ? {} : { signal }),
    });

    if (final.$kind === "FailedTransaction") {
      throw new TransportError(
        failedTransactionMessage(final.FailedTransaction),
      );
    }
    return parseTxReceipt(final.Transaction);
  }

  async simulateTransaction(
    tx: Transaction,
    signal?: AbortSignal,
  ): Promise<SimulationReturnValues> {
    tx.setSenderIfNotSet(this.address);
    const result = await this.client.simulateTransaction({
      transaction: tx,
      include: { effects: true, commandResults: true },
      ...(signal === undefined ? {} : { signal }),
    });
    if (result.$kind === "FailedTransaction") {
      throw new TransportError(
        failedTransactionMessage(result.FailedTransaction),
      );
    }
    const commandResults = result.commandResults ?? [];
    return commandResults.map((cmd) => cmd.returnValues.map((rv) => rv.bcs));
  }
}

function parseTxReceipt(
  tx: SuiClientTypes.Transaction<{ effects: true; objectTypes: true }>,
): TxReceipt {
  const effects = tx.effects;
  if (!effects) {
    throw new TransportError(
      "transaction effects missing despite include flag",
    );
  }
  const objectTypes = tx.objectTypes ?? {};
  return {
    digest: tx.digest,
    gasUsedMist: computeGasUsedMist(effects.gasUsed),
    createdObjects: collectCreated(effects.changedObjects, objectTypes),
    deletedObjects: collectDeleted(effects.changedObjects),
  };
}

function computeGasUsedMist(gas: SuiClientTypes.GasCostSummary): bigint {
  return (
    BigInt(gas.computationCost) +
    BigInt(gas.storageCost) -
    BigInt(gas.storageRebate)
  );
}

function collectCreated(
  changes: readonly SuiClientTypes.ChangedObject[],
  objectTypes: Record<string, string>,
): TxCreatedObject[] {
  const out: TxCreatedObject[] = [];
  for (const change of changes) {
    if (change.idOperation !== "Created") continue;
    const objectType = objectTypes[change.objectId];
    if (objectType === undefined) continue;
    out.push({
      objectId: toSuiObjectId(change.objectId),
      objectType,
    });
  }
  return out;
}

function collectDeleted(
  changes: readonly SuiClientTypes.ChangedObject[],
): TxDeletedObject[] {
  const out: TxDeletedObject[] = [];
  for (const change of changes) {
    if (change.idOperation !== "Deleted") continue;
    out.push({ objectId: toSuiObjectId(change.objectId) });
  }
  return out;
}

function failedTransactionMessage(
  failed: SuiClientTypes.Transaction<{ effects: true }>,
): string {
  const error = failed.effects?.status?.error;
  if (error) {
    return `transaction failed: ${error.message}`;
  }
  return "transaction failed without effects status";
}
