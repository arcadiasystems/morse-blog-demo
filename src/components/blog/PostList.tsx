import Link from "next/link";
import type { Entry } from "@arcadiasystems/morse-sdk";
import { LockIcon } from "@/components/brand/icons";
import { formatChainDate } from "@/utils/format";
import styles from "./PostList.module.css";

export type PostRowData = {
  entry: Entry;
  premium: boolean;
  /** 1-based number of the revision readers see. */
  revisionNumber: number;
  /** When that revision was anchored on Sui; null if not resolved. */
  anchoredAtMs: number | null;
};

export function PostList({
  publicationId,
  rows,
}: {
  publicationId: string;
  rows: readonly PostRowData[];
}) {
  return (
    <ul className={styles.list}>
      {rows.map((row) => (
        <li key={row.entry.id}>
          <PostRow publicationId={publicationId} {...row} />
        </li>
      ))}
    </ul>
  );
}

function PostRow({
  publicationId,
  entry,
  premium,
  revisionNumber,
  anchoredAtMs,
}: PostRowData & { publicationId: string }) {
  return (
    <Link
      className={`${styles.post} ${premium ? styles.locked : ""}`}
      href={`/${publicationId}/${entry.id}`}
    >
      <div className={styles.n}>
        Entry<b>#{entry.id}</b>
      </div>
      <div>
        <h2>{entry.name || `Untitled (#${entry.id})`}</h2>
        <div className={styles.m}>
          {premium ? (
            <span className="chip prem">
              <LockIcon size={11} strokeWidth={2.4} />
              Premium
            </span>
          ) : (
            <span className="chip pub">Public</span>
          )}
          <span>
            <i className={styles.dot} aria-hidden="true" />v{revisionNumber}
          </span>
          {anchoredAtMs !== null ? (
            <time dateTime={new Date(anchoredAtMs).toISOString()}>
              {formatChainDate(anchoredAtMs)}
            </time>
          ) : null}
          {premium ? (
            <span>Connect a wallet holding a publisher cap to unlock.</span>
          ) : null}
        </div>
      </div>
      <div className={styles.r}>
        <span className={styles.arrow} aria-hidden="true">
          →
        </span>
      </div>
    </Link>
  );
}
