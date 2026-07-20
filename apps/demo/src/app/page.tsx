import Link from "next/link";
import { ArrowRight, Lock, PencilLine, Wallet } from "lucide-react";
import { Badge } from "@morse/shared/components/ui/badge";
import { ConnectCta } from "@morse/shared/components/layout/ConnectCta";
import { DEMO_PUBLICATION_ID } from "@morse/shared/lib/morse-config";
import { FEATURES } from "@morse/shared/lib/features";

export default function HomePage() {
  return (
    <div className="flex flex-col gap-20 sm:gap-24 pt-4 sm:pt-8">
      <section className="relative">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 -left-24 size-[420px] rounded-full bg-primary/20 blur-[120px] opacity-60"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -top-20 right-0 size-[320px] rounded-full bg-primary/10 blur-[120px] opacity-50"
        />
        <div className="relative flex flex-col items-start gap-6 max-w-3xl">
          <Badge
            variant="outline"
            className="border-primary/40 bg-primary/10 text-primary"
          >
            <span className="size-1.5 rounded-full bg-primary mr-2 animate-pulse" />
            Live testnet demo
          </Badge>
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight leading-[1.02]">
            Build a blog you{" "}
            <span className="text-primary">actually own</span>.
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed">
            morse·blog is a working demo of{" "}
            <code className="font-mono text-foreground/90 text-[0.95em] px-1.5 py-0.5 rounded bg-card/70 border border-border/60">
              @arcadiasystems/morse-sdk
            </code>
            . Connect a Sui wallet, create a publication, write posts to Walrus,
            and gate premium content with Seal. Everything on-chain, no backend.
          </p>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-3">
            <ConnectCta />
            {DEMO_PUBLICATION_ID && (
              <Link
                href={`/${DEMO_PUBLICATION_ID}`}
                className="text-sm font-medium text-primary hover:text-primary/80 transition-colors inline-flex items-center gap-1.5 group"
              >
                Read the demo blog
                <ArrowRight className="size-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            )}
            <Link
              href="/about"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1.5 group"
            >
              What is morse?
              <ArrowRight className="size-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:gap-4 sm:grid-cols-3">
        {FEATURES.map((feature) => {
          const icons: Record<string, React.ReactNode> = {
            "wallet-native": <Wallet className="size-5" />,
            "walrus-stored": <PencilLine className="size-5" />,
            "seal-encrypted": <Lock className="size-5" />,
          };
          return (
            <FeatureCard
              key={feature.key}
              icon={icons[feature.key]}
              title={feature.title}
              description={feature.description}
            />
          );
        })}
      </section>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-border/60 bg-card/40 p-5 hover:border-primary/40 hover:bg-card/70 transition-all">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-12 -right-12 size-32 rounded-full bg-primary/0 blur-2xl group-hover:bg-primary/15 transition-colors"
      />
      <div className="relative flex flex-col gap-3">
        <div className="grid place-items-center size-9 rounded-lg bg-primary/10 text-primary border border-primary/30">
          {icon}
        </div>
        <h3 className="text-base font-semibold tracking-tight">{title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
}
