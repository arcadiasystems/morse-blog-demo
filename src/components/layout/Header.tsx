"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { Radio } from "lucide-react";
import { BalanceChips } from "@/components/layout/BalanceChips";
import { WalletButton } from "@/components/layout/WalletButton";

export function Header() {
  const account = useCurrentAccount();
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-6xl px-4 h-16 flex items-center gap-6">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/"
            className="flex items-center gap-2 group shrink-0"
            aria-label="morse blog home"
          >
            <span className="grid place-items-center size-8 rounded-md bg-primary/15 text-primary border border-primary/30 group-hover:bg-primary/25 transition-colors">
              <Radio className="size-4" />
            </span>
            <span className="font-semibold tracking-tight text-base">
              morse<span className="text-primary">·</span>blog
            </span>
          </Link>
          <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wide text-primary">
            <span className="size-1.5 rounded-full bg-primary animate-pulse" />
            Testnet
          </span>
        </div>

        <nav className="hidden md:flex items-center gap-1 ml-auto">
          {account ? (
            <NavLink href="/my-blogs" active={pathname.startsWith("/my-blogs")}>
              My blogs
            </NavLink>
          ) : null}
          <NavLink href="/about" active={pathname === "/about"}>
            About
          </NavLink>
        </nav>

        <div className="md:ml-2 ml-auto flex items-center gap-2">
          <BalanceChips />
          <WalletButton size="sm" />
        </div>
      </div>
    </header>
  );
}

function NavLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
        active
          ? "text-foreground bg-accent/50"
          : "text-muted-foreground hover:text-foreground hover:bg-accent/30"
      }`}
    >
      {children}
    </Link>
  );
}
