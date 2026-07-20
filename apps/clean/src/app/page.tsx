import Link from "next/link";
import { Wallet, PencilLine, Lock } from "lucide-react";
import { ConnectCta } from "@morse/shared/components/layout/ConnectCta";
import { DEMO_PUBLICATION_ID } from "@morse/shared/lib/morse-config";
import { FEATURES } from "@morse/shared/lib/features";

const icons: Record<string, React.ReactNode> = {
  "wallet-native": <Wallet className="h-5 w-5 text-primary" />,
  "walrus-stored": <PencilLine className="h-5 w-5 text-primary" />,
  "seal-encrypted": <Lock className="h-5 w-5 text-primary" />,
};

export default function HomePage() {
  return (
    <div className="flex flex-col gap-16 pt-4 sm:pt-8">
      <section className="flex flex-col items-start gap-6 max-w-3xl">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-tight text-foreground">
          Decentralized Publishing, Simplified
        </h1>
        <p className="text-lg text-muted-foreground leading-relaxed">
          Create, publish, and monetize content on Sui. Your posts live on
          Walrus, encrypted with Seal, and owned entirely by you. No backend, no
          database, no middleman.
        </p>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-2">
          <ConnectCta />
          {DEMO_PUBLICATION_ID && (
            <Link
              href={`/${DEMO_PUBLICATION_ID}`}
              className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
            >
              Read demo blog &rarr;
            </Link>
          )}
          <Link
            href="/about"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            About morse &rarr;
          </Link>
        </div>
      </section>

      <section className="flex flex-col divide-y divide-border">
        {FEATURES.map((feature) => (
          <FeatureRow
            key={feature.key}
            icon={icons[feature.key]}
            title={feature.title}
            description={feature.description}
          />
        ))}
      </section>

      <section className="bg-primary/5 rounded-lg p-8 text-center">
        <p className="text-base text-foreground font-medium">
          Ready to start? Connect your wallet to create your first blog.
        </p>
        <div className="mt-4">
          <ConnectCta />
        </div>
      </section>
    </div>
  );
}

function FeatureRow({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-5 py-5">
      <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10 shrink-0">
        {icon}
      </div>
      <div>
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
}
