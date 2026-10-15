import Link from "next/link";
import { LockIcon, PenIcon, WalletIcon } from "@/components/brand/icons";
import { ConnectCta } from "@/components/layout/ConnectCta";
import { DEMO_PUBLICATION_ID } from "@/lib/morse-config";
import styles from "./home.module.css";

const FEATURES = [
  {
    icon: <WalletIcon size={26} strokeWidth={1.8} />,
    title: "Wallet-native",
    body: "Slush, Suiet, or any Sui Wallet Standard wallet. Your keys, your blog, no backend.",
  },
  {
    icon: <PenIcon size={26} strokeWidth={1.8} />,
    title: "Walrus-stored",
    body: "Post content lives on Walrus. Append-only revisions, version history out of the box.",
  },
  {
    icon: <LockIcon size={26} strokeWidth={1.8} />,
    title: "Seal-gated premium",
    body: "Encrypt posts client-side. Readers decrypt with one signed message. No server in the middle.",
  },
] as const;

const STEPS = [
  {
    title: "Install a Sui wallet",
    body: "Slush or Suiet as a browser extension.",
  },
  {
    title: "Get testnet SUI and WAL",
    body: "SUI from the faucet, swap a little for WAL. Both free.",
  },
  {
    title: "Connect and create a publication",
    body: "One transaction. You receive the owner and publisher caps.",
  },
  {
    title: "Write a post, watch it anchor",
    body: "The body goes to Walrus, the record to Sui. Both links appear on the post.",
  },
] as const;

export default function HomePage() {
  return (
    <>
      <section className={styles.hero}>
        <div className={`wrap ${styles.heroInner}`}>
          <span className="chip ok">
            <i aria-hidden="true" />
            Live testnet demo
          </span>
          <h1>
            Build a blog you <em>actually own.</em>
          </h1>
          <p className={styles.lede}>
            morse·blog is a working demo of{" "}
            <code>@arcadiasystems/morse-sdk</code>. Connect a Sui wallet,
            create a publication, write posts to Walrus, and gate premium
            content with Seal. Everything on-chain, no backend.
          </p>
          <div className={styles.cta}>
            <ConnectCta />
            {DEMO_PUBLICATION_ID ? (
              <Link
                className="btn btn-ghost lg"
                href={`/${DEMO_PUBLICATION_ID}`}
              >
                Read the demo blog
              </Link>
            ) : null}
            <Link className={styles.txt} href="/about">
              What is Morse? <span aria-hidden="true">→</span>
            </Link>
          </div>
          <SignalWire />
        </div>
      </section>

      <section className={styles.feats} aria-label="Features">
        <div className={`wrap ${styles.featsInner}`}>
          {FEATURES.map((feature) => (
            <div key={feature.title} className={styles.feat}>
              {feature.icon}
              <h2>{feature.title}</h2>
              <p>{feature.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className={`wrap ${styles.howInner}`}>
          <h2>Four steps, about three minutes.</h2>
          <ol className={styles.steps}>
            {STEPS.map((step, index) => (
              <li key={step.title}>
                <b className={styles.stepNumber}>{index + 1}</b>
                <strong>{step.title}</strong>
                <span>{step.body}</span>
              </li>
            ))}
          </ol>
          <p className={styles.testnetNote}>
            Testnet data may reset. Testnet tokens have no value. Do not
            publish anything you cannot afford to lose.
          </p>
        </div>
      </section>
    </>
  );
}

/** A Morse pulse travelling along a wire, with three anchored records. */
function SignalWire() {
  return (
    <svg
      className={styles.wire}
      aria-hidden="true"
      viewBox="0 0 1064 56"
      preserveAspectRatio="none"
    >
      <path className={styles.wireLine} d="M0 28H1064" strokeWidth={1.5} />
      <g
        className={styles.pulse}
        fill="none"
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M0 28H30V6H60V28H90V6H120V28H150" />
      </g>
      <g className={styles.nodes}>
        <circle cx="300" cy="28" r="5" />
        <circle cx="640" cy="28" r="5" />
        <circle cx="930" cy="28" r="5" />
      </g>
    </svg>
  );
}
