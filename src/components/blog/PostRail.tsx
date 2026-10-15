import Link from "next/link";
import type { AccessPolicy } from "@arcadiasystems/morse-sdk";
import type {
  RevisionAnchor,
  RevisionOperation,
} from "@/services/publication-history.server";
import { suiscanObjectUrl, suiscanTxUrl } from "@/lib/explorer";
import { truncateAddress } from "@/utils/address";
import { formatChainDate, formatChainDateTime } from "@/utils/format";
import styles from "./PostRail.module.css";

const ACCESS_POLICY_LABEL: Record<AccessPolicy, string> = {
  public: "Public",
  publisher: "Publisher cap holders · Seal",
  subscription: "Subscribers · Seal",
};

const OPERATION_LABEL: Record<RevisionOperation, string> = {
  add: "first published",
  "append-draft": "draft saved",
  "publish-from-draft": "draft published",
  "publish-direct": "edit published",
};

export type RailRevision = {
  /** 1-based revision number. */
  number: number;
  anchor: RevisionAnchor | null;
  current: boolean;
  /** The revision rendered on this page. */
  viewing: boolean;
  /** Link to read this revision; null when it cannot be read publicly. */
  href: string | null;
};

type Props = {
  publicationId: string;
  entryId: number;
  /** The revision shown on the page. */
  revisionNumber: number;
  revisionCount: number;
  blob: { href: string; label: string };
  anchor: RevisionAnchor | null;
  accessPolicy: AccessPolicy;
  /** Newest first. */
  revisions: readonly RailRevision[];
};

/** The on-chain record panel and revision list beside a post. */
export function PostRail({
  publicationId,
  entryId,
  revisionNumber,
  revisionCount,
  blob,
  anchor,
  accessPolicy,
  revisions,
}: Props) {
  return (
    <aside className={styles.rail} aria-label="On-chain record">
      <section className={styles.record}>
        <div className={styles.hd}>
          <h2>On-chain record</h2>
          <span className="chip ok">
            <i aria-hidden="true" />
            Anchored
          </span>
        </div>
        <dl>
          <dt>Publication</dt>
          <dd>
            <ExternalId href={suiscanObjectUrl(publicationId)} id={publicationId} />
          </dd>
          <dt>Entry</dt>
          <dd>
            #{entryId} · revision {revisionNumber} of {revisionCount}
          </dd>
          <dt>Walrus blob</dt>
          <dd>
            <ExternalId href={blob.href} id={blob.label} />
          </dd>
          <dt>Sui transaction</dt>
          {anchor ? (
            <dd>
              <ExternalId href={suiscanTxUrl(anchor.digest)} id={anchor.digest} />
            </dd>
          ) : (
            <dd className={styles.unavailable}>Unavailable</dd>
          )}
          <dt>Anchored</dt>
          {anchor ? (
            <dd className={styles.t}>
              <time dateTime={new Date(anchor.timestampMs).toISOString()}>
                {formatChainDateTime(anchor.timestampMs)}
              </time>{" "}
              · epoch {anchor.epoch}
            </dd>
          ) : (
            <dd className={styles.unavailable}>Unavailable</dd>
          )}
          <dt>Access policy</dt>
          <dd className={styles.t}>{ACCESS_POLICY_LABEL[accessPolicy]}</dd>
        </dl>
        <p className={styles.ft}>
          Content served from Walrus and checked against the Sui record on
          every load. Nobody can edit this revision, including the author.
        </p>
      </section>

      <section className={styles.revs}>
        <div className={styles.hd}>
          <h2>Revisions</h2>
        </div>
        <ul className={styles.revList}>
          {revisions.map((revision) => (
            <li key={revision.number} className={styles.rev}>
              <span className={styles.v}>v{revision.number}</span>
              <span className={styles.d}>
                {revision.anchor
                  ? `${formatChainDate(revision.anchor.timestampMs)} · ${OPERATION_LABEL[revision.anchor.operation]}`
                  : "Anchor unavailable"}
              </span>
              <RevisionAction revision={revision} />
            </li>
          ))}
        </ul>
      </section>

      <p className={styles.railnote}>
        Revisions append. Earlier versions stay readable forever.
      </p>
    </aside>
  );
}

function RevisionAction({ revision }: { revision: RailRevision }) {
  if (revision.current) return <span className={styles.cur}>CURRENT</span>;
  if (revision.viewing) return <span className={styles.reading}>Reading</span>;
  if (revision.href) {
    return (
      <Link href={revision.href} aria-label={`View revision v${revision.number}`}>
        View
      </Link>
    );
  }
  return <span aria-hidden="true" />;
}

/** A truncated id (first 6, last 4) linking to its full record. */
function ExternalId({ href, id }: { href: string; id: string }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" title={id}>
      {truncateAddress(id)}
    </a>
  );
}
