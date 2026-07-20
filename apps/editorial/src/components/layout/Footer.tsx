import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border">
      <div className="mx-auto max-w-3xl px-4 py-6 flex items-center justify-center gap-4 text-xs text-muted-foreground">
        <span>
          Built with{" "}
          <Link
            href="https://www.npmjs.com/package/@arcadiasystems/morse-sdk"
            target="_blank"
            rel="noreferrer"
            className="text-foreground hover:text-primary transition-colors"
          >
            morse-sdk
          </Link>
        </span>
        <span>·</span>
        <Link
          href="https://github.com/arcadiasystems/morse-dcms"
          target="_blank"
          rel="noreferrer"
          className="hover:text-foreground transition-colors"
        >
          GitHub
        </Link>
        <span>·</span>
        <Link href="/about" className="hover:text-foreground transition-colors">
          About
        </Link>
      </div>
    </footer>
  );
}
