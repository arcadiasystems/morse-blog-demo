"use client";

import Link from "next/link";
import {
  useCurrentAccount,
  useSuiClientQuery,
} from "@mysten/dapp-kit";
import { Droplets, ExternalLink, Waves } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { FAUCET_URLS, WAL_TESTNET_COIN_TYPE } from "@/lib/morse-config";
import { formatCoinBalance } from "@/utils/format";

const SUI_COIN_TYPE = "0x2::sui::SUI";

export function BalanceChips() {
  const account = useCurrentAccount();

  const suiBalance = useSuiClientQuery(
    "getBalance",
    { owner: account?.address ?? "", coinType: SUI_COIN_TYPE },
    {
      enabled: Boolean(account),
      refetchInterval: 30_000,
      staleTime: 20_000,
    },
  );

  const walBalance = useSuiClientQuery(
    "getBalance",
    { owner: account?.address ?? "", coinType: WAL_TESTNET_COIN_TYPE },
    {
      enabled: Boolean(account),
      refetchInterval: 30_000,
      staleTime: 20_000,
    },
  );

  const walMeta = useSuiClientQuery(
    "getCoinMetadata",
    { coinType: WAL_TESTNET_COIN_TYPE },
    {
      enabled: Boolean(account),
      staleTime: Infinity,
    },
  );

  if (!account) return null;

  const walDecimals = walMeta.data?.decimals ?? 9;
  const walReady = !walBalance.isPending && !walMeta.isPending;

  return (
    <TooltipProvider delayDuration={150}>
      <div className="hidden lg:inline-flex items-center gap-1.5">
        <BalanceChip
          symbol="SUI"
          icon={<Droplets className="size-3" />}
          loading={suiBalance.isPending}
          value={formatCoinBalance(suiBalance.data?.totalBalance, 9)}
          tooltip={
            <div className="flex flex-col gap-1.5">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Testnet SUI for gas. Refreshes every 30s.
              </p>
              <Link
                href={FAUCET_URLS.sui}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                Sui testnet faucet
                <ExternalLink className="size-3" />
              </Link>
            </div>
          }
        />
        <BalanceChip
          symbol="WAL"
          icon={<Waves className="size-3" />}
          loading={!walReady}
          value={formatCoinBalance(walBalance.data?.totalBalance, walDecimals)}
          tooltip={
            <div className="flex flex-col gap-1.5">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Testnet WAL balance ({walDecimals} decimals from on-chain
                metadata). This demo uploads via a Walrus HTTP publisher that
                absorbs the storage cost, so you typically don&apos;t need WAL.
              </p>
              <Link
                href={FAUCET_URLS.wal}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                Walrus testnet exchange
                <ExternalLink className="size-3" />
              </Link>
            </div>
          }
        />
      </div>
    </TooltipProvider>
  );
}

function BalanceChip({
  symbol,
  icon,
  loading,
  value,
  tooltip,
}: {
  symbol: string;
  icon: React.ReactNode;
  loading: boolean;
  value: string;
  tooltip: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex items-center gap-1.5 rounded-md border border-border/60 bg-card/50 hover:bg-card/80 hover:border-primary/40 px-2.5 py-1 text-xs transition-colors cursor-default">
          <span className="text-primary">{icon}</span>
          <span className="font-mono tabular-nums">
            {loading ? "..." : value}
          </span>
          <span className="text-muted-foreground text-[10px] uppercase tracking-wide">
            {symbol}
          </span>
        </span>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-xs">
        {tooltip}
      </TooltipContent>
    </Tooltip>
  );
}
