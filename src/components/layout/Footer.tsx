import Link from "next/link";
import styles from "./Footer.module.css";

export function Footer() {
  return (
    <footer className={styles.foot}>
      <div className={`wrap ${styles.inner}`}>
        <span>
          A demo of{" "}
          <a
            href="https://www.npmjs.com/package/@arcadiasystems/morse-sdk"
            target="_blank"
            rel="noreferrer"
          >
            @arcadiasystems/morse-sdk
          </a>
          , decentralized publishing on Sui.
        </span>
        <span className={styles.links}>
          <a
            href="https://github.com/arcadiasystems/morse-dcms"
            target="_blank"
            rel="noreferrer"
          >
            GitHub
          </a>
          <Link href="/about">About</Link>
          <a href="https://www.morsecms.xyz" target="_blank" rel="noreferrer">
            morsecms.xyz
          </a>
          {/* "MORSE" in Morse code */}
          <span className={styles.sig} aria-hidden="true">
            -- --- .-. ... .
          </span>
        </span>
      </div>
    </footer>
  );
}
