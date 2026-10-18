"use client";

import type { SuiGrpcClient } from "@mysten/sui/grpc";
import { queryOptions, skipToken, useQuery } from "@tanstack/react-query";
import { ExternalLink } from "lucide-react";
import {
  DropdownMenuItem,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { useMorseReader } from "@/hooks/use-morse-reader";
import { FAUCET_URLS, WAL_TESTNET_COIN_TYPE } from "@/lib/morse-config";
import { formatCoinBalance } from "@/utils/format";

const SUI_COIN_TYPE = "0x2::sui::SUI";

/** Total balance of `coinType` held by `owner`, in the coin's base units. */
function coinBalanceQuery(
  client: SuiGrpcClient,
  owner: string | null,
  coinType: string,
) {
  return queryOptions({
    queryKey: ["coin-balance", owner, coinType],
    queryFn: owner
      ? async ({ signal }) => {
          const { balance } = await client.getBalance({
            owner,
            coinType,
            signal,
          });
          return balance.balance;
        }
      : skipToken,
    refetchInterval: 30_000,
    staleTime: 20_000,
  });
}

/** Testnet SUI and WAL balances plus faucet links, for the wallet menu. */
export function WalletBalances() {
  const { address, client } = useMorseReader();

  const suiBalance = useQuery(coinBalanceQuery(client, address, SUI_COIN_TYPE));
  const walBalance = useQuery(
    coinBalanceQuery(client, address, WAL_TESTNET_COIN_TYPE),
  );

  const walMeta = useQuery({
    queryKey: ["coin-metadata", WAL_TESTNET_COIN_TYPE],
    queryFn: async ({ signal }) => {
      const { coinMetadata } = await client.getCoinMetadata({
        coinType: WAL_TESTNET_COIN_TYPE,
        signal,
      });
      return coinMetadata;
    },
    enabled: address !== null,
    staleTime: Infinity,
  });

  if (!address) return null;

  const walDecimals = walMeta.data?.decimals ?? 9;
  const walReady = !walBalance.isPending && !walMeta.isPending;

  return (
    <>
      <DropdownMenuLabel className="font-normal flex flex-col gap-1.5">
        <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
          Testnet balances
        </span>
        <BalanceRow
          symbol="SUI"
          value={
            suiBalance.isPending
              ? null
              : formatCoinBalance(suiBalance.data, 9)
          }
        />
        <BalanceRow
          symbol="WAL"
          value={
            walReady
              ? formatCoinBalance(walBalance.data, walDecimals)
              : null
          }
        />
        <span className="text-[11px] leading-snug text-muted-foreground">
          Uploads go through a Walrus publisher that pays for storage, so you
          rarely need WAL.
        </span>
      </DropdownMenuLabel>
      <DropdownMenuItem asChild>
        <a href={FAUCET_URLS.sui} target="_blank" rel="noreferrer">
          <ExternalLink className="size-3.5" />
          Sui testnet faucet
        </a>
      </DropdownMenuItem>
      <DropdownMenuItem asChild>
        <a href={FAUCET_URLS.wal} target="_blank" rel="noreferrer">
          <ExternalLink className="size-3.5" />
          Walrus testnet exchange
        </a>
      </DropdownMenuItem>
    </>
  );
}

function BalanceRow({ symbol, value }: { symbol: string; value: string | null }) {
  return (
    <span className="flex items-baseline justify-between gap-3 text-[13px]">
      <span className="text-muted-foreground">{symbol}</span>
      <span className="font-mono tabular-nums text-foreground">
        {value ?? "Loading"}
      </span>
    </span>
  );
}
