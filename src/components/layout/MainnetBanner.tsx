"use client";

import { useCurrentAccount, useCurrentWallet } from "@mysten/dapp-kit";
import { TriangleAlert } from "lucide-react";

export function MainnetBanner() {
  const account = useCurrentAccount();
  const { currentWallet } = useCurrentWallet();

  if (!account || !currentWallet) return null;

  const onMainnet = (account.chains ?? []).some((c) => c === "sui:mainnet");
  const onTestnet = (account.chains ?? []).some((c) => c === "sui:testnet");

  if (!onMainnet || onTestnet) return null;

  return (
    <div className="w-full bg-destructive/15 border-b border-destructive/40 text-destructive-foreground">
      <div className="mx-auto max-w-6xl px-4 py-2.5 flex items-center gap-3 text-sm">
        <TriangleAlert className="size-4 text-destructive shrink-0" />
        <p className="text-foreground/90">
          Your wallet is on <span className="font-semibold">mainnet</span>.
          morse-sdk is testnet-only at v0.1.x - switch your wallet network to{" "}
          <span className="font-semibold">Sui Testnet</span> to use this demo.
        </p>
      </div>
    </div>
  );
}
