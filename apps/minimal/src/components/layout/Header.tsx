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
    <header className="w-full border-b border-border bg-background">
      <div className="mx-auto max-w-[65ch] px-4 h-12 flex items-center gap-4">
        <Link href="/" className="shrink-0 font-mono text-sm flex items-baseline gap-2" aria-label="morse minimal home">
          <span className="font-bold text-foreground">morse</span>
          <span className="text-muted-foreground">minimal</span>
        </Link>

        <nav className="hidden md:flex items-center gap-4 font-mono text-sm">
          <NavLink href="/" active={pathname === "/"}>
            home
          </NavLink>
          <NavLink href="/about" active={pathname === "/about"}>
            about
          </NavLink>
          {account ? (
            <NavLink href="/my-blogs" active={pathname.startsWith("/my-blogs")}>
              my-blogs
            </NavLink>
          ) : null}
        </nav>

        <div className="ml-auto flex items-center gap-2">
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
      className={
        active
          ? "text-foreground underline underline-offset-4"
          : "text-muted-foreground hover:text-foreground"
      }
    >
      {children}
    </Link>
  );
}
