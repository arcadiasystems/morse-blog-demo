"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { MorseMark } from "@/components/brand/MorseMark";
import { WalletButton } from "@/components/layout/WalletButton";
import styles from "./Header.module.css";

export function Header() {
  const account = useCurrentAccount();
  const pathname = usePathname();

  return (
    <header className={styles.top}>
      <div className={`wrap ${styles.bar}`}>
        <Link className={styles.brand} href="/" aria-label="morse blog home">
          <MorseMark />
          <span>morse</span>
          <em>BLOG</em>
        </Link>
        <span
          className={`chip ${styles.net}`}
          title="morse-sdk is testnet-only. Mainnet is disabled in this demo."
        >
          <i aria-hidden="true" />
          <b>Testnet</b>
          <span className={styles.off}>mainnet off</span>
        </span>
        <nav className={styles.right} aria-label="Main">
          {account ? (
            <NavLink href="/my-blogs" active={pathname.startsWith("/my-blogs")}>
              My blogs
            </NavLink>
          ) : null}
          <NavLink href="/about" active={pathname === "/about"}>
            About
          </NavLink>
          <WalletButton size="sm" />
        </nav>
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
      className={styles.lnk}
      aria-current={active ? "page" : undefined}
    >
      {children}
    </Link>
  );
}
