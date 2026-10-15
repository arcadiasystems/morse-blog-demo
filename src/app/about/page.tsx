import type { Metadata } from "next";
import styles from "./about.module.css";

export const metadata: Metadata = {
  title: "About",
  description: "What morse·blog is and what it runs on.",
};

export default function AboutPage() {
  return (
    <section>
      <div className={`wrap ${styles.inner}`}>
        <h1>About morse·blog</h1>
        <p>
          morse·blog is a reference application built to exercise{" "}
          <code>@arcadiasystems/morse-sdk</code> end to end. Every action,
          creating a publication, writing a post, gating premium content, runs
          against real Sui testnet contracts, with post bodies stored on Walrus
          and encrypted with Seal where applicable.
        </p>
        <p>
          The SDK is decentralized publishing infrastructure on Sui. This demo
          is the easiest way to see it work without writing code.
        </p>
        <div className={styles.links}>
          <a
            className="btn btn-ink"
            href="https://github.com/arcadiasystems/morse-dcms"
            target="_blank"
            rel="noreferrer"
          >
            GitHub repository
          </a>
          <a
            className="btn btn-soft"
            href="https://www.npmjs.com/package/@arcadiasystems/morse-sdk"
            target="_blank"
            rel="noreferrer"
          >
            npm package
          </a>
          <a
            className="btn btn-soft"
            href="https://docs.morsecms.xyz/quick-start.html"
            target="_blank"
            rel="noreferrer"
          >
            Quick start
          </a>
        </div>
      </div>
    </section>
  );
}
