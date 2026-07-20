"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { Ban } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@morse/shared/components/ui/tooltip";
import { BalanceChips } from "@morse/shared/components/layout/BalanceChips";
import { WalletButton } from "@morse/shared/components/layout/WalletButton";

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
            <span className="flex flex-col items-start gap-[3px] border border-foreground px-2 py-1">
              <span className="font-heading text-[11px] font-bold uppercase leading-none tracking-[0.18em] text-foreground">
                Morse
              </span>
              <span aria-hidden className="flex items-center gap-[2px] text-primary">
                {/* M O R S E in morse code */}
                <i className="mc-dash" /><i className="mc-dash" /><i className="mc-gap" /><i className="mc-dash" /><i className="mc-dash" /><i className="mc-dash" /><i className="mc-gap" /><i className="mc-dot" /><i className="mc-dash" /><i className="mc-dot" /><i className="mc-gap" /><i className="mc-dot" /><i className="mc-dot" /><i className="mc-dot" /><i className="mc-gap" /><i className="mc-dot" />
              </span>
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
              Blog
            </span>
          </Link>
          <TooltipProvider delayDuration={150}>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wide text-primary cursor-default">
                  <span className="size-1.5 rounded-full bg-primary animate-pulse" />
                  Testnet
                  <span
                    aria-label="Mainnet disabled"
                    title="Mainnet disabled"
                    className="inline-flex items-center gap-0.5 text-muted-foreground/80 normal-case font-normal pl-1.5 ml-0.5 border-l border-primary/20"
                  >
                    <Ban className="size-2.5" />
                    <span className="text-[10px]">mainnet off</span>
                  </span>
                </span>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs">
                morse-sdk@0.1.x is testnet-only. Mainnet selection is
                intentionally disabled in this demo - connect a wallet on
                Sui Testnet for end-to-end flows to work.
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
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
