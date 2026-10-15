"use client";

import { useCurrentAccount, useCurrentWallet } from "@mysten/dapp-kit";
import { WarnIcon } from "@/components/brand/icons";

export function MainnetBanner() {
  const account = useCurrentAccount();
  const { currentWallet } = useCurrentWallet();

  if (!account || !currentWallet) return null;

  const onMainnet = (account.chains ?? []).some((c) => c === "sui:mainnet");
  const onTestnet = (account.chains ?? []).some((c) => c === "sui:testnet");

  if (!onMainnet || onTestnet) return null;

  return (
    <div className="w-full bg-warn-bg border-b border-warn-line" role="status">
      <div className="wrap py-2.5 flex items-center gap-3 text-sm text-body">
        <WarnIcon size={18} className="text-warn shrink-0" />
        <p>
          <span className="font-semibold text-warn">
            Mainnet is disabled in this demo.
          </span>{" "}
          Morse is testnet-only for now. Switch your wallet network to{" "}
          <span className="font-semibold text-ink">Sui Testnet</span> to
          continue.
        </p>
      </div>
    </div>
  );
}
