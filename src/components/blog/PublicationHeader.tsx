import Link from "next/link";
import type { Publication } from "@arcadiasystems/morse-sdk";
import { PublicationActions } from "@/components/blog/PublicationActions";
import { suiscanObjectUrl } from "@/lib/explorer";
import { truncateAddress } from "@/utils/address";
import styles from "./PublicationHeader.module.css";

export function PublicationHeader({
  publication,
  entryCount,
  ownerAddress,
}: {
  publication: Publication;
  entryCount: number;
  /** Current OwnerCap holder; omitted from the card when unknown. */
  ownerAddress: string | null;
}) {
  return (
    <section>
      <div className={`wrap ${styles.inner}`}>
        <Link className={styles.back} href="/">
          <span aria-hidden="true">←</span> Home
        </Link>
        <div className={styles.pubcard}>
          <div>
            <span className="chip pub">Public blog</span>
            <h1>{publication.name}</h1>
            <div className={styles.ids}>
              <span>/{publication.slug}</span>
              <span>
                <b>{entryCount}</b> {entryCount === 1 ? "entry" : "entries"}
              </span>
              <span>
                publication{" "}
                <a
                  href={suiscanObjectUrl(publication.id)}
                  target="_blank"
                  rel="noreferrer"
                  title={publication.id}
                >
                  {truncateAddress(publication.id)}
                </a>
              </span>
              {ownerAddress ? (
                <span>
                  owner <b title={ownerAddress}>{truncateAddress(ownerAddress)}</b>
                </span>
              ) : null}
            </div>
          </div>
          <PublicationActions publicationId={publication.id} />
        </div>
      </div>
    </section>
  );
}
