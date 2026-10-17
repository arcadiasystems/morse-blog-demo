"use client";

import { ReactNode, useEffect, useRef, useState } from "react";
import {
  DAppKitProvider,
  createDAppKit,
  useCurrentAccount,
} from "@mysten/dapp-kit-react";
import { SuiGrpcClient } from "@mysten/sui/grpc";
import {
  QueryClient,
  QueryClientProvider,
  useQueryClient,
} from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { morseAppConfig } from "@/lib/morse-config";

// `mainnet` is listed so dapp-kit's network selector keeps the entry visible
// for forward compatibility, but morse-sdk@0.1.x is testnet-only. The
// MainnetBanner and the Testnet pill in Header make it explicit to users
// that mainnet wallets won't work end-to-end. Remove this comment + ship
// mainnet support once the morse contracts are deployed on mainnet.
const GRPC_URLS = {
  testnet: morseAppConfig.rpcUrl,
  mainnet: "https://fullnode.mainnet.sui.io:443",
  devnet: "https://fullnode.devnet.sui.io:443",
} as const;

const dAppKit = createDAppKit({
  networks: ["testnet", "mainnet", "devnet"],
  defaultNetwork: "testnet",
  createClient: (network) =>
    new SuiGrpcClient({ network, baseUrl: GRPC_URLS[network] }),
  autoConnect: true,
  // List only the wallets installed in this browser, so the connect dialog
  // keeps its "No Sui wallets detected" install prompt. dapp-kit otherwise
  // adds Slush's web wallet.
  slushWalletConfig: null,
});

declare module "@mysten/dapp-kit-react" {
  interface Register {
    dAppKit: typeof dAppKit;
  }
}

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
      <DAppKitProvider dAppKit={dAppKit}>
        <WalletCacheReset />
        {children}
        <Toaster position="bottom-right" />
      </DAppKitProvider>
    </QueryClientProvider>
  );
}

/**
 * Drops all cached query data when the wallet disconnects or switches, so a
 * fresh connection never renders the previous wallet's blogs/balances. Without
 * this, TanStack keeps prior-address results in memory; on reconnect they'd
 * flash before the new fetch settles. (Per-address query keys prevent wrong
 * data being shown long-term, but clearing on transition kills the flash.)
 */
function WalletCacheReset() {
  const account = useCurrentAccount();
  const queryClient = useQueryClient();
  const prevAddress = useRef<string | null>(null);

  useEffect(() => {
    const current = account?.address ?? null;
    const previous = prevAddress.current;
    // Clear only on a real transition away from a connected wallet
    // (disconnect or switch), not on the initial null -> address connect.
    if (previous !== null && previous !== current) {
      queryClient.clear();
    }
    prevAddress.current = current;
  }, [account?.address, queryClient]);

  return null;
}
