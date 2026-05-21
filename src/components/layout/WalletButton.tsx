"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  useConnectWallet,
  useCurrentAccount,
  useCurrentWallet,
  useDisconnectWallet,
  useWallets,
} from "@mysten/dapp-kit";
import {
  Check,
  ChevronDown,
  Copy,
  Loader2,
  LogOut,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
import { truncateAddress } from "@/utils/address";

type Props = {
  size?: "sm" | "default" | "lg";
  className?: string;
};

export function WalletButton({ size = "default", className }: Props) {
  const account = useCurrentAccount();
  const { currentWallet } = useCurrentWallet();
  const wallets = useWallets();
  const connect = useConnectWallet();
  const disconnect = useDisconnectWallet();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  if (account) {
    const onCopy = async () => {
      await navigator.clipboard.writeText(account.address);
      setCopied(true);
      toast.success("Address copied");
      setTimeout(() => setCopied(false), 1500);
    };

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size={size}
            className={`gap-2 font-mono text-xs border-primary/30 bg-primary/5 hover:bg-primary/10 hover:border-primary/50 ${className ?? ""}`}
          >
            <span className="grid place-items-center size-5 rounded-sm bg-primary/15 overflow-hidden">
              {currentWallet?.icon ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={currentWallet.icon}
                  alt=""
                  className="size-5 object-cover"
                />
              ) : (
                <Wallet className="size-3 text-primary" />
              )}
            </span>
            <span className="text-foreground">
              {truncateAddress(account.address)}
            </span>
            <ChevronDown className="size-3.5 opacity-60" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-60">
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
          <DropdownMenuItem onClick={onCopy}>
            {copied ? (
              <Check className="size-3.5 text-primary" />
            ) : (
              <Copy className="size-3.5" />
            )}
            <span>{copied ? "Copied" : "Copy address"}</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              disconnect.mutate(undefined, {
                onSuccess: () => toast.message("Wallet disconnected"),
              });
            }}
            className="text-destructive focus:text-destructive"
          >
            <LogOut className="size-3.5" />
            Disconnect
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size={size} className={`gap-2 ${className ?? ""}`}>
          <Wallet className="size-4" />
          Connect wallet
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Connect a wallet</DialogTitle>
          <DialogDescription>
            Choose a Sui wallet to continue. Make sure it&apos;s set to{" "}
            <span className="text-foreground font-medium">Sui Testnet</span>.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2 mt-2">
          {wallets.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border/70 p-6 text-center text-sm text-muted-foreground">
              <p>No Sui wallets detected in this browser.</p>
              <p className="mt-2">
                Install{" "}
                <a
                  className="text-primary hover:underline"
                  href="https://slush.app/"
                  target="_blank"
                  rel="noreferrer"
                >
                  Slush
                </a>{" "}
                or{" "}
                <a
                  className="text-primary hover:underline"
                  href="https://suiet.app/"
                  target="_blank"
                  rel="noreferrer"
                >
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
                  className="flex items-center gap-3 rounded-lg border border-border/60 px-3 py-2.5 hover:border-primary/40 hover:bg-accent/40 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  <span className="grid place-items-center size-9 rounded-md bg-muted overflow-hidden shrink-0">
                    {wallet.icon ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={wallet.icon}
                        alt=""
                        className="size-9 object-cover"
                      />
                    ) : (
                      <Wallet className="size-4 text-muted-foreground" />
                    )}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {wallet.name}
                    </p>
                  </div>
                  {isConnecting ? (
                    <Loader2 className="size-4 animate-spin text-muted-foreground" />
                  ) : (
                    <ChevronDown className="size-4 -rotate-90 opacity-0 group-hover:opacity-60 transition-opacity" />
                  )}
                </button>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
