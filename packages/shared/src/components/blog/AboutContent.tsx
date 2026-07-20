import Link from "next/link";

export interface AboutContentProps {
  /** Display name, e.g. "morse" or "morse·blog" */
  appName?: string;
  headingClassName?: string;
  paragraphClassName?: string;
  codeClassName?: string;
  linksContainerClassName?: string;
  linkClassName?: string;
  /** Icon rendered after each link label, e.g. an ExternalLink icon or arrow */
  linkIcon?: React.ReactNode;
}

export function AboutContent({
  appName = "morse",
  headingClassName,
  paragraphClassName = "text-muted-foreground leading-relaxed",
  codeClassName = "font-mono text-foreground",
  linksContainerClassName,
  linkClassName,
  linkIcon,
}: AboutContentProps) {
  return (
    <>
      <h1 className={headingClassName}>About {appName}</h1>
      <p className={paragraphClassName}>
        {appName} is a reference application built to exercise{" "}
        <code className={codeClassName}>@arcadiasystems/morse-sdk</code>{" "}
        end-to-end. Every action &mdash; creating a publication, writing a post,
        gating premium content &mdash; runs against real Sui testnet contracts,
        with post bodies stored on Walrus and encrypted with Seal where
        applicable.
      </p>
      <p className={paragraphClassName}>
        The SDK is decentralized publishing infrastructure on Sui. This demo is
        the easiest way to see it work without writing code.
      </p>
      <div className={linksContainerClassName}>
        <Link
          href="https://github.com/arcadiasystems/morse-dcms"
          target="_blank"
          rel="noreferrer"
          className={linkClassName}
        >
          GitHub repository {linkIcon}
        </Link>
        <Link
          href="https://www.npmjs.com/package/@arcadiasystems/morse-sdk"
          target="_blank"
          rel="noreferrer"
          className={linkClassName}
        >
          npm package {linkIcon}
        </Link>
      </div>
    </>
  );
}
