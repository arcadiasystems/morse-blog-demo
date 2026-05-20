import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border/60">
      <div className="mx-auto max-w-6xl px-4 py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-muted-foreground">
        <p>
          A demo of{" "}
          <Link
            href="https://www.npmjs.com/package/@arcadiasystems/morse-sdk"
            target="_blank"
            rel="noreferrer"
            className="text-foreground hover:text-primary transition-colors"
          >
            @arcadiasystems/morse-sdk
          </Link>
          {" - "}
          decentralized publishing on Sui.
        </p>
        <div className="flex items-center gap-4">
          <Link
            href="https://github.com/arcadiasystems/morse-dcms"
            target="_blank"
            rel="noreferrer"
            className="hover:text-foreground transition-colors"
          >
            GitHub
          </Link>
          <Link href="/about" className="hover:text-foreground transition-colors">
            About
          </Link>
        </div>
      </div>
    </footer>
  );
}
