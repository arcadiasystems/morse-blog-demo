import Link from "next/link";
import { Lock, PencilLine, Wallet } from "lucide-react";
import { ConnectCta } from "@morse/shared/components/layout/ConnectCta";
import { DEMO_PUBLICATION_ID } from "@morse/shared/lib/morse-config";
import { FEATURES } from "@morse/shared/lib/features";

export default function HomePage() {
  const icons: Record<string, React.ReactNode> = {
    "wallet-native": <Wallet className="size-5" />,
    "walrus-stored": <PencilLine className="size-5" />,
    "seal-encrypted": <Lock className="size-5" />,
  };

  return (
    <div className="flex flex-col">
      {/* Full-width hero with gradient background */}
      <section className="relative flex flex-col items-center text-center gap-8 py-24 sm:py-36 -mx-4 sm:-mx-8 px-4 sm:px-8 bg-gradient-to-b from-background via-background to-card/80">
        <div
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[600px] rounded-full bg-primary/10 blur-[180px]"
        />
        <h1 className="relative text-5xl sm:text-7xl font-bold font-heading tracking-tight leading-[1.05]">
          Own{" "}
          <span className="gradient-text">
            Your Words
          </span>
        </h1>
        <p className="relative text-lg sm:text-xl text-muted-foreground max-w-2xl leading-relaxed">
          A decentralized publishing platform built on Sui.
        </p>
        <div className="relative flex flex-col sm:flex-row items-center gap-4 pt-2">
          <ConnectCta />
          {DEMO_PUBLICATION_ID && (
            <Link
              href={`/${DEMO_PUBLICATION_ID}`}
              className="text-sm font-medium text-primary hover:text-accent-foreground transition-colors inline-flex items-center gap-1.5"
            >
              Explore Demo &rarr;
            </Link>
          )}
        </div>
      </section>

      {/* Features — numbered magazine layout */}
      <section className="flex flex-col py-16 sm:py-24">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-10">
          How it works
        </h2>
        <div className="flex flex-col divide-y divide-border/60">
          {FEATURES.map((feature, index) => (
            <div
              key={feature.key}
              className="group flex items-start gap-6 sm:gap-10 py-8 first:pt-0 last:pb-0"
            >
              <span className="text-4xl sm:text-5xl font-heading font-bold text-muted-foreground/20 leading-none shrink-0 pt-1">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  <div className="grid place-items-center size-8 rounded-lg bg-primary/10 text-primary border border-primary/30">
                    {icons[feature.key]}
                  </div>
                  <h3 className="text-lg font-heading font-semibold tracking-tight">
                    {feature.title}
                  </h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-lg">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
