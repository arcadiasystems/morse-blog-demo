"use client";

import Link from "next/link";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WalletButton } from "@/components/layout/WalletButton";

export function ConnectCta() {
  const account = useCurrentAccount();

  if (account) {
    return (
      <Button asChild size="lg" className="gap-2">
        <Link href="/my-blogs">
          Go to my blogs <ArrowRight className="size-4" />
        </Link>
      </Button>
    );
  }

  return <WalletButton size="lg" />;
}
