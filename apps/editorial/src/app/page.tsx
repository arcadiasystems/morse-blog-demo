import { Fragment } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ConnectCta } from "@morse/shared/components/layout/ConnectCta";
import { DEMO_PUBLICATION_ID } from "@morse/shared/lib/morse-config";
import { FEATURES } from "@morse/shared/lib/features";

export default function HomePage() {
  return (
    <div className="flex flex-col gap-10 py-12 sm:py-20 max-w-2xl mx-auto">
      <section className="flex flex-col gap-4 text-center">
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight leading-[1.1] font-serif">
          Decentralized Publishing
        </h1>
        <p className="text-lg text-muted-foreground leading-relaxed">
          morse is a publishing toolkit on Sui. Write posts to Walrus, gate
          premium content with Seal, and own everything with your wallet. No
          backend, no middleman.
        </p>
      </section>

      <section className="flex flex-col text-sm leading-relaxed">
        <hr className="border-border" />
        {FEATURES.map((feature) => (
          <Fragment key={feature.key}>
            <p className="py-4">
              <span className="font-bold">{feature.title}</span>
              {" — "}
              {feature.description}
            </p>
            <hr className="border-border" />
          </Fragment>
        ))}
      </section>

      <div className="flex flex-col items-center gap-4">
        <ConnectCta />
        <div className="flex flex-col sm:flex-row items-center gap-4">
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
    </div>
  );
}
