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
    <header className="sticky top-0 z-40 w-full bg-card shadow-sm border-b border-border">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 h-16 flex items-center gap-6">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/"
            className="flex items-baseline gap-1.5 shrink-0"
            aria-label="morse blog home"
          >
            <span className="text-lg font-semibold text-foreground">
              morse
            </span>
            <span className="text-sm text-muted-foreground">clean</span>
          </Link>
          <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
            Testnet
          </span>
        </div>

        <nav className="hidden md:flex items-center gap-1 ml-auto">
          {account ? (
            <NavLink href="/my-blogs" active={pathname.startsWith("/my-blogs")}>
              My Blogs
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
      className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
        active
          ? "text-primary font-medium bg-accent"
          : "text-muted-foreground hover:text-foreground hover:bg-muted"
      }`}
    >
      {children}
    </Link>
  );
}
