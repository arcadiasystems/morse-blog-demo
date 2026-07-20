"use client";

import { useMemo } from "react";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { SuiGrpcClient } from "@mysten/sui/grpc";
import {
  HttpAggregatorReadAdapter,
  RpcPublicationReader,
} from "@arcadiasystems/morse-sdk";
import { morseAppConfig } from "../lib/morse-config";

export type MorseReader = {
  /** Connected address, or null when no wallet is connected. */
  address: string | null;
  reader: RpcPublicationReader;
  walrusRead: HttpAggregatorReadAdapter;
  client: SuiGrpcClient;
  config: typeof morseAppConfig;
};

/**
 * Synchronous, signer-free morse context for READ operations. Unlike
 * `useMorse` (which awaits `WalletStandardSigner.fromAccountAsync` - a
 * probe popup for Phantom-class wallets), the reader needs no signer, so
 * publication/entry/cap queries can run the instant a wallet connects.
 *
 * This decouples reads from the async signer construction, which fixes the
 * "infinite loading on first connect" and "stale data after wallet switch"
 * symptoms: the address comes straight from `useCurrentAccount`, so query
 * keys flip immediately on wallet change instead of lagging behind the
 * async client rebuild.
 *
 * The reader itself is account-independent (it's just an RPC client), so
 * it's stable; only `address` changes between wallets.
 */
export function useMorseReader(): MorseReader {
  const account = useCurrentAccount();

  const base = useMemo(() => {
    const config = morseAppConfig;
    const client = new SuiGrpcClient({
      network: "testnet",
      baseUrl: config.rpcUrl,
    });
    const reader = RpcPublicationReader.fromMorseConfig(config, client);
    const walrusRead = HttpAggregatorReadAdapter.fromMorseConfig(
      config,
      client,
    );
    return { reader, walrusRead, client, config };
  }, []);

  return {
    address: account?.address ?? null,
    ...base,
  };
}
