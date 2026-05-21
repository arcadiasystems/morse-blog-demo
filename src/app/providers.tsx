"use client";

import { ReactNode, useState } from "react";
import {
  SuiClientProvider,
  WalletProvider,
  createNetworkConfig,
} from "@mysten/dapp-kit";
import { getJsonRpcFullnodeUrl } from "@mysten/sui/jsonRpc";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import "@mysten/dapp-kit/dist/index.css";

// `mainnet` is listed so dapp-kit's network selector keeps the entry visible
// for forward compatibility, but morse-sdk@0.1.x is testnet-only. The
// MainnetBanner and the Testnet pill in Header make it explicit to users
// that mainnet wallets won't work end-to-end. Remove this comment + ship
// mainnet support once the morse contracts are deployed on mainnet.
const { networkConfig } = createNetworkConfig({
  testnet: { url: getJsonRpcFullnodeUrl("testnet"), network: "testnet" },
  mainnet: { url: getJsonRpcFullnodeUrl("mainnet"), network: "mainnet" },
  devnet: { url: getJsonRpcFullnodeUrl("devnet"), network: "devnet" },
});

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider networks={networkConfig} defaultNetwork="testnet">
        <WalletProvider autoConnect>
          {children}
          <Toaster position="bottom-right" richColors theme="dark" />
        </WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  );
}
