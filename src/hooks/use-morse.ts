"use client";

import { useMemo } from "react";
import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
  useSignPersonalMessage,
  useSignTransaction,
} from "@mysten/dapp-kit";
import { SuiGrpcClient } from "@mysten/sui/grpc";
import {
  DefaultSealAdapter,
  HttpAggregatorReadAdapter,
  HttpPublisherWriteAdapter,
  RpcPublicationReader,
  WalletStandardSigner,
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

export function useMorse(): MorseClient | null {
  const account = useCurrentAccount();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
  const { mutateAsync: signTransaction } = useSignTransaction();
  const { mutateAsync: signPersonalMessage } = useSignPersonalMessage();

  return useMemo(() => {
    if (!account) return null;

    const config = morseAppConfig;
    const client = new SuiGrpcClient({
      network: "testnet",
      baseUrl: config.rpcUrl,
    });

    const adapter = new WalletStandardAdapter(
      account.address,
      ({ transaction }) => signAndExecute({ transaction }),
      client,
    );

    const signer = WalletStandardSigner.fromAccount(account, {
      signTransaction: ({ transaction }) => signTransaction({ transaction }),
      signPersonalMessage: ({ message }) => signPersonalMessage({ message }),
    });

    const reader = RpcPublicationReader.fromMorseConfig(config, client);

    const walrusRead = HttpAggregatorReadAdapter.fromMorseConfig(
      config,
      client,
    );

    const walrusWrite = HttpPublisherWriteAdapter.fromConfig({
      publisherUrl: DEFAULT_WALRUS_PUBLISHER,
      ownerAddress: adapter.address,
    });

    const seal = DefaultSealAdapter.fromMorseConfig(config, {}, client);

    return {
      account,
      adapter,
      signer,
      reader,
      walrusRead,
      walrusWrite,
      seal,
      config,
      client,
    };
  }, [account, signAndExecute, signTransaction, signPersonalMessage]);
}
