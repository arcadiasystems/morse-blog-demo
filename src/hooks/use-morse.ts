"use client";

import { useEffect, useMemo, useState } from "react";
import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
  useSignPersonalMessage,
  useSignTransaction,
} from "@mysten/dapp-kit";
import { SuiGrpcClient } from "@mysten/sui/grpc";
import {
  BrowserStoragePubkeyCache,
  DefaultSealAdapter,
  HttpAggregatorReadAdapter,
  HttpPublisherWriteAdapter,
  RpcPublicationReader,
  WalletStandardSigner,
  type PubkeyCache,
} from "@arcadiasystems/morse-sdk";
import { WalletStandardAdapter } from "@/lib/wallet-standard";
import { DEFAULT_WALRUS_PUBLISHER, morseAppConfig } from "@/lib/morse-config";

export type MorseClient = {
  account: ReturnType<typeof useCurrentAccount>;
  adapter: WalletStandardAdapter;
  signer: WalletStandardSigner;
  reader: RpcPublicationReader;
  walrusRead: HttpAggregatorReadAdapter;
  walrusWrite: HttpPublisherWriteAdapter;
  seal: DefaultSealAdapter;
  config: typeof morseAppConfig;
  client: SuiGrpcClient;
};

// localStorage-backed cache provided by the SDK (morse-sdk 0.1.4+). On
// browsers `fromAccountAsync` reads cached bytes -> verifies they derive
// to `account.address` -> constructs the signer without firing a probe.
// On miss or stale cache it falls back to the probe and writes the
// recovered pubkey back. On SSR/Node we leave the cache undefined so the
// SDK skips persistence (no crash from a missing `globalThis.localStorage`).
function pickPubkeyCache(): PubkeyCache | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    return new BrowserStoragePubkeyCache();
  } catch {
    // localStorage disabled (privacy mode, etc.) - run without cache.
    return undefined;
  }
}

export function useMorse(): MorseClient | null {
  const account = useCurrentAccount();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
  const { mutateAsync: signTransaction } = useSignTransaction();
  const { mutateAsync: signPersonalMessage } = useSignPersonalMessage();

  const [client, setClient] = useState<MorseClient | null>(null);

  // Synchronous pieces that don't need the signer.
  const baseline = useMemo(() => {
    if (!account) return null;
    const config = morseAppConfig;
    const suiClient = new SuiGrpcClient({
      network: "testnet",
      baseUrl: config.rpcUrl,
    });
    const adapter = new WalletStandardAdapter(
      account.address,
      ({ transaction }) => signAndExecute({ transaction }),
      suiClient,
    );
    const reader = RpcPublicationReader.fromMorseConfig(config, suiClient);
    const walrusRead = HttpAggregatorReadAdapter.fromMorseConfig(
      config,
      suiClient,
    );
    const walrusWrite = HttpPublisherWriteAdapter.fromConfig({
      publisherUrl: DEFAULT_WALRUS_PUBLISHER,
      ownerAddress: adapter.address,
    });
    const seal = DefaultSealAdapter.fromMorseConfig(config, {}, suiClient);
    return {
      account,
      adapter,
      reader,
      walrusRead,
      walrusWrite,
      seal,
      config,
      suiClient,
    };
  }, [account, signAndExecute]);

  useEffect(() => {
    if (!baseline) {
      setClient(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const signer = await WalletStandardSigner.fromAccountAsync(
          baseline.account!,
          {
            signTransaction: ({ transaction }) =>
              signTransaction({ transaction }),
            signPersonalMessage: ({ message }) =>
              signPersonalMessage({ message }),
          },
          { pubkeyCache: pickPubkeyCache() },
        );
        if (cancelled) return;
        setClient({
          account: baseline.account,
          adapter: baseline.adapter,
          signer,
          reader: baseline.reader,
          walrusRead: baseline.walrusRead,
          walrusWrite: baseline.walrusWrite,
          seal: baseline.seal,
          config: baseline.config,
          client: baseline.suiClient,
        });
      } catch (err) {
        if (cancelled) return;
        console.error(
          "[useMorse] WalletStandardSigner.fromAccountAsync rejected this wallet account:",
          err,
        );
        setClient(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [baseline, signTransaction, signPersonalMessage]);

  return client;
}
