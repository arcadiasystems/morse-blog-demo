import Link from "next/link";
import { ConnectCta } from "@morse/shared/components/layout/ConnectCta";
import { DEMO_PUBLICATION_ID } from "@morse/shared/lib/morse-config";
import { FEATURES } from "@morse/shared/lib/features";

export default function HomePage() {
  return (
    <div className="flex flex-col gap-8 py-8">
      <section className="font-mono text-sm">
        <h1 className="text-lg font-bold mb-3">morse</h1>
        <p className="text-muted-foreground mb-4">
          Decentralized publishing on Sui. No backend, no middleman.
        </p>
        <ul className="flex flex-col gap-2">
          {FEATURES.map((feature) => (
            <li key={feature.key} className="text-muted-foreground">
              <span className="text-foreground">{feature.title}</span>
              {" — "}
              {feature.description}
            </li>
          ))}
        </ul>
      </section>

      <hr className="border-border" />

      <section className="flex flex-col gap-3">
        <ConnectCta />
        <div className="flex items-center gap-4 text-sm font-mono">
          {DEMO_PUBLICATION_ID && (
            <Link
              href={`/${DEMO_PUBLICATION_ID}`}
              className="text-primary hover:underline"
            >
              Read the demo blog →
            </Link>
          )}
          <Link
            href="/about"
            className="text-muted-foreground hover:text-foreground"
          >
            About →
          </Link>
        </div>
      </section>
    </div>
  );
}
