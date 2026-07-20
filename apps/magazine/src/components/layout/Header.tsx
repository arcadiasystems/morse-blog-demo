"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { BalanceChips } from "@morse/shared/components/layout/BalanceChips";
import { WalletButton } from "@morse/shared/components/layout/WalletButton";

export function Header() {
  const account = useCurrentAccount();
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 w-full">
      {/* Top gradient line */}
      <div className="h-px bg-gradient-to-r from-primary via-primary/60 to-transparent" />
      <div className="bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border/60">
        <div className="mx-auto max-w-6xl px-4 h-16 flex items-center gap-6">
          {/* Logo */}
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/"
              className="flex items-baseline gap-2 shrink-0"
              aria-label="morse magazine home"
            >
              <span className="font-heading text-xl font-bold uppercase tracking-widest text-foreground">
                MORSE
              </span>
              <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                Magazine
              </span>
            </Link>
            <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wide text-primary">
              <span className="size-1.5 rounded-full bg-primary animate-pulse" />
              Testnet
            </span>
          </div>

          {/* Nav */}
          <nav className="hidden md:flex items-center gap-1 ml-auto">
            {account ? (
              <NavLink
                href="/my-blogs"
                active={pathname.startsWith("/my-blogs")}
              >
                My blogs
              </NavLink>
            ) : null}
            <NavLink href="/about" active={pathname === "/about"}>
              About
            </NavLink>
          </nav>

          {/* Wallet area */}
          <div className="md:ml-2 ml-auto flex items-center gap-2">
            <BalanceChips />
            <WalletButton size="sm" />
          </div>
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
          ? "text-primary bg-primary/10"
          : "text-muted-foreground hover:text-foreground hover:bg-accent/30"
      }`}
    >
      {children}
    </Link>
  );
}
