const FORMATTERS = new Map<number, Intl.NumberFormat>();

function nf(maxFractionDigits: number): Intl.NumberFormat {
  let f = FORMATTERS.get(maxFractionDigits);
  if (!f) {
    f = new Intl.NumberFormat("en-US", {
      maximumFractionDigits: maxFractionDigits,
      minimumFractionDigits: 0,
    });
    FORMATTERS.set(maxFractionDigits, f);
  }
  return f;
}

/**
 * Formats a raw on-chain balance string (in the smallest unit) into a
 * compact human-readable string. `decimals` is the coin's `decimals` field
 * from its CoinMetadata - always pass the on-chain value, do not guess.
 *
 * - "-" for missing data
 * - "0" for exactly zero
 * - "<0.001" below the visible precision
 * - 3 decimals under 1
 * - 2 decimals under 1000
 * - K / M / B suffix above 10K
 */
export function formatCoinBalance(
  rawMist: string | bigint | undefined,
  decimals = 9,
): string {
  if (rawMist === undefined || rawMist === null) return "-";
  const big = typeof rawMist === "bigint" ? rawMist : BigInt(rawMist);
  if (big === BigInt(0)) return "0";

  const divisor = Math.pow(10, decimals);
  const n = Number(big) / divisor;

  if (n < 0.001) return "<0.001";
  if (n < 1) return nf(3).format(n);
  if (n < 1000) return nf(2).format(n);
  if (n < 10_000) return nf(0).format(n);

  if (n < 1_000_000) return `${nf(1).format(n / 1000)}K`;
  if (n < 1_000_000_000) return `${nf(2).format(n / 1_000_000)}M`;
  return `${nf(2).format(n / 1_000_000_000)}B`;
}
