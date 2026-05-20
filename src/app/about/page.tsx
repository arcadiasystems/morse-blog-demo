import Link from "next/link";
import { ExternalLink } from "lucide-react";

export default function AboutPage() {
  return (
    <article className="prose prose-invert max-w-2xl mx-auto py-8 flex flex-col gap-6">
      <h1 className="text-3xl font-semibold tracking-tight">About morse·blog</h1>
      <p className="text-muted-foreground leading-relaxed">
        morse·blog is a reference application built to exercise{" "}
        <code className="font-mono text-foreground">
          @arcadiasystems/morse-sdk
        </code>{" "}
        end-to-end. Every action - creating a publication, writing a post,
        gating premium content - runs against real Sui testnet contracts, with
        post bodies stored on Walrus and encrypted with Seal where applicable.
      </p>
      <p className="text-muted-foreground leading-relaxed">
        The SDK is decentralized publishing infrastructure on Sui. This demo is
        the easiest way to see it work without writing code.
      </p>
      <div className="flex flex-col gap-2 text-sm pt-2">
        <Link
          href="https://github.com/arcadiasystems/morse-dcms"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-foreground hover:text-primary transition-colors"
        >
          GitHub repository <ExternalLink className="size-3.5" />
        </Link>
        <Link
          href="https://www.npmjs.com/package/@arcadiasystems/morse-sdk"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-foreground hover:text-primary transition-colors"
        >
          npm package <ExternalLink className="size-3.5" />
        </Link>
      </div>
    </article>
  );
}
