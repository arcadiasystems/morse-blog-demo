"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import {
  useConnectWallet,
  useCurrentAccount,
  useCurrentWallet,
  useDisconnectWallet,
  useWallets,
} from "@mysten/dapp-kit";
import { Check, Copy, ExternalLink, Loader2, LogOut } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { WalletIcon } from "@/components/brand/icons";
import { WalletBalances } from "@/components/layout/WalletBalances";
import { usePublisherCap } from "@/hooks/use-publisher-cap";
import { suiscanAccountUrl } from "@/lib/explorer";
import { truncateAddress } from "@/utils/address";
import styles from "./WalletButton.module.css";

type Props = {
  /** `sm` is the top-bar size, `lg` the hero size. */
  size?: "sm" | "default" | "lg";
  className?: string;
};

const SIZE_CLASS: Record<NonNullable<Props["size"]>, string> = {
  sm: "sm",
  default: "",
  lg: "lg",
};

export function WalletButton({ size = "default", className }: Props) {
  const account = useCurrentAccount();
  const { currentWallet } = useCurrentWallet();
  const wallets = useWallets();
  const connect = useConnectWallet();
  const disconnect = useDisconnectWallet();
  const router = useRouter();
  const pathname = usePathname();
  // Publication routes (`/[publicationId]`, `/my-blogs/[publicationId]`)
  // label the pill with the wallet's capability on that publication.
  const { publicationId } = useParams<{ publicationId?: string }>();
  const publisherCap = usePublisherCap(account ? publicationId : undefined);
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  if (account) {
    const onCopy = async () => {
      await navigator.clipboard.writeText(account.address);
      setCopied(true);
      toast.success("Address copied");
      setTimeout(() => setCopied(false), 1500);
    };

    const onDisconnect = () => {
      disconnect.mutate(undefined, {
        onSuccess: () => toast.message("Wallet disconnected"),
      });
    };

    return (
      <div className={`${styles.wallet} ${className ?? ""}`}>
        <DropdownMenu>
          <DropdownMenuTrigger
            className={styles.trigger}
            aria-label={`Wallet ${truncateAddress(account.address)}, open menu`}
          >
            <i aria-hidden="true" />
            <b>{truncateAddress(account.address)}</b>
            {publisherCap.data ? (
              <span className={styles.caps}>publisher cap</span>
            ) : null}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[264px]">
            <DropdownMenuLabel className="font-normal">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                Connected
              </p>
              <p className="text-sm font-medium mt-0.5">
                {currentWallet?.name ?? "Wallet"}
              </p>
              <p className="text-[11px] text-muted-foreground font-mono mt-1">
                {truncateAddress(account.address, 10, 8)}
              </p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <WalletBalances />
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/my-blogs">My blogs</Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onCopy}>
              {copied ? (
                <Check className="size-3.5 text-primary" />
              ) : (
                <Copy className="size-3.5" />
              )}
              <span>{copied ? "Copied" : "Copy address"}</span>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <a
                href={suiscanAccountUrl(account.address)}
                target="_blank"
                rel="noreferrer"
              >
                <ExternalLink className="size-3.5" />
                View on Suiscan
              </a>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={onDisconnect}>
              <LogOut className="size-3.5" />
              Disconnect
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <button
          type="button"
          className={styles.disconnect}
          onClick={onDisconnect}
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className={`btn btn-ultra ${SIZE_CLASS[size]} ${className ?? ""}`}
        >
          <WalletIcon size={size === "lg" ? 18 : 16} />
          Connect wallet
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md rounded-[20px] bg-paper">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl font-bold tracking-tight">
            Connect a wallet
          </DialogTitle>
          <DialogDescription>
            Choose a Sui wallet to continue. Make sure it&apos;s set to{" "}
            <span className="text-foreground font-medium">Sui Testnet</span>.
          </DialogDescription>
        </DialogHeader>
        <div className={styles.walletList}>
          {wallets.length === 0 ? (
            <div className={styles.noWallets}>
              <p>No Sui wallets detected in this browser.</p>
              <p className="mt-2">
                Install{" "}
                <a href="https://slush.app/" target="_blank" rel="noreferrer">
                  Slush
                </a>{" "}
                or{" "}
                <a href="https://suiet.app/" target="_blank" rel="noreferrer">
                  Suiet
                </a>{" "}
                to continue.
              </p>
            </div>
          ) : (
            wallets.map((wallet) => {
              const isConnecting =
                connect.isPending &&
                connect.variables?.wallet?.name === wallet.name;
              return (
                <button
                  type="button"
                  key={wallet.name}
                  onClick={() => {
                    connect.mutate(
                      { wallet },
                      {
                        onSuccess: () => {
                          setOpen(false);
                          toast.success(`Connected to ${wallet.name}`);
                          if (pathname === "/") {
                            router.push("/my-blogs");
                          }
                        },
                        onError: (err) => {
                          const msg = err?.message ?? "";
                          const looksRejected = /reject|deni|cancel/i.test(msg);
                          toast.error(
                            looksRejected
                              ? "Wallet connection rejected"
                              : `Could not connect to ${wallet.name}`,
                            {
                              description: msg
                                ? msg
                                : "The wallet did not respond. Make sure it's unlocked and try again.",
                            },
                          );
                        },
                      },
                    );
                  }}
                  disabled={connect.isPending}
                  className={styles.walletOption}
                >
                  {wallet.icon ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={wallet.icon} alt="" />
                  ) : (
                    <WalletIcon size={20} />
                  )}
                  <span className="flex-1 min-w-0 truncate">{wallet.name}</span>
                  {isConnecting ? (
                    <Loader2
                      className="size-4 animate-spin text-muted-foreground"
                      aria-label="Connecting"
                    />
                  ) : null}
                </button>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
