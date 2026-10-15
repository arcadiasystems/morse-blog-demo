"use client";

import Link from "next/link";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { WalletButton } from "@/components/layout/WalletButton";

export function ConnectCta() {
  const account = useCurrentAccount();

  if (account) {
    return (
      <Link className="btn btn-ultra lg" href="/my-blogs">
        Go to my blogs <span aria-hidden="true">→</span>
      </Link>
    );
  }

  return <WalletButton size="lg" />;
}
