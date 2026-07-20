"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { BalanceChips } from "@morse/shared/components/layout/BalanceChips";
import { WalletButton } from "@morse/shared/components/layout/WalletButton";
import { ThemeToggle } from "@morse/shared/components/layout/ThemeToggle";

export function Header() {
  const account = useCurrentAccount();
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background">
      <div className="mx-auto max-w-3xl px-4 h-14 flex items-center gap-6">
        <div className="flex items-baseline gap-2 min-w-0">
          <Link
            href="/"
            className="shrink-0"
            aria-label="morse editorial home"
          >
            <span className="font-serif text-lg font-semibold text-foreground">
              morse
            </span>
          </Link>
          <span className="text-xs text-muted-foreground tracking-wide">
            editorial
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
          <ThemeToggle />
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
