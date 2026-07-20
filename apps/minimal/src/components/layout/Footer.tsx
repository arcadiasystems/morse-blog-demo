import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border">
      <div className="mx-auto max-w-[65ch] px-4 py-4 text-center text-xs text-muted-foreground font-mono">
        built with{" "}
        <Link
          href="https://www.npmjs.com/package/@arcadiasystems/morse-sdk"
          target="_blank"
          rel="noreferrer"
          className="text-primary hover:underline"
        >
          morse-sdk
        </Link>
        {" · "}
        <Link
          href="https://github.com/arcadiasystems/morse-dcms"
          target="_blank"
          rel="noreferrer"
          className="text-primary hover:underline"
        >
          github
        </Link>
      </div>
    </footer>
  );
}
