import "server-only";
import { cache } from "react";
import type { Entry } from "@arcadiasystems/morse-sdk";
import { SuiGraphQLClient } from "@mysten/sui/graphql";
import { normalizeSuiAddress } from "@mysten/sui/utils";
import {
  MORSE_NETWORK,
  SUI_GRAPHQL_URL,
  morseAppConfig,
} from "@/lib/morse-config";

/** How a revision was created, from the Move call that appended it. */
export type RevisionOperation =
  | "add"
  | "append-draft"
  | "publish-from-draft"
  | "publish-direct";

/** The Sui transaction that appended a revision to its entry. */
export type RevisionAnchor = {
  digest: string;
  timestampMs: number;
  epoch: number;
  operation: RevisionOperation;
};

type RevisionTransaction = RevisionAnchor & {
  /** Normalized ids of every object the transaction created or changed. */
  changedObjectIds: ReadonlySet<string>;
};

export type PublicationHistory = {
  /** Revision-creating transactions, oldest first. */
  revisionTransactions: readonly RevisionTransaction[];
  /** OwnerCap created alongside the publication, if found. */
  ownerCapId: string | null;
};

const OPERATION_BY_FUNCTION: Readonly<Record<string, RevisionOperation>> = {
  add_entry_to_collection: "add",
  append_collection_entry_draft_revision: "append-draft",
  publish_collection_entry_from_draft: "publish-from-draft",
  publish_collection_entry_direct: "publish-direct",
};

const PAGE_SIZE = 50;
/** Bounds render time on very busy publications (1,000 transactions). */
const MAX_PAGES = 20;

const OWNER_CAP_TYPE = `${morseAppConfig.originalPackageId ?? morseAppConfig.packageId}::publication::OwnerCap`;

const HISTORY_QUERY = `
  query PublicationHistory($publication: SuiAddress!, $after: String) {
    transactions(filter: { affectedObject: $publication }, first: ${PAGE_SIZE}, after: $after) {
      pageInfo { hasNextPage endCursor }
      nodes {
        digest
        effects {
          timestamp
          epoch { epochId }
          objectChanges(first: 50) {
            nodes {
              address
              outputState { asMoveObject { contents { type { repr } } } }
            }
          }
        }
        kind {
          ... on ProgrammableTransaction {
            commands(first: 50) {
              nodes {
                ... on MoveCallCommand { function { name module { name } } }
              }
            }
          }
        }
      }
    }
  }
`;

type HistoryQueryResult = {
  transactions: {
    pageInfo: { hasNextPage: boolean; endCursor: string | null };
    nodes: {
      digest: string;
      effects: {
        timestamp: string;
        epoch: { epochId: number };
        objectChanges: {
          nodes: {
            address: string;
            outputState: {
              asMoveObject: { contents: { type: { repr: string } } } | null;
            } | null;
          }[];
        };
      };
      kind: {
        commands?: {
          nodes: {
            function?: { name: string; module: { name: string } };
          }[];
        };
      };
    }[];
  };
};

const OWNER_QUERY = `
  query ObjectOwner($id: SuiAddress!) {
    object(address: $id) {
      owner { ... on AddressOwner { address { address } } }
    }
  }
`;

type OwnerQueryResult = {
  object: { owner: { address?: { address: string } } | null } | null;
};

function graphqlClient(): SuiGraphQLClient {
  return new SuiGraphQLClient({ url: SUI_GRAPHQL_URL, network: MORSE_NETWORK });
}

async function runQuery<Result>(
  query: string,
  variables: Record<string, unknown>,
): Promise<Result> {
  const result = await graphqlClient().query<Result>({ query, variables });
  if (result.errors?.length) {
    throw new Error(result.errors.map((e) => e.message).join("; "));
  }
  if (!result.data) throw new Error("Sui GraphQL returned no data");
  return result.data;
}

function revisionOperation(
  node: HistoryQueryResult["transactions"]["nodes"][number],
): RevisionOperation | null {
  for (const command of node.kind.commands?.nodes ?? []) {
    const fn = command.function;
    if (fn?.module.name !== "publication") continue;
    const operation = OPERATION_BY_FUNCTION[fn.name];
    if (operation) return operation;
  }
  return null;
}

/**
 * Every transaction that touched a publication, reduced to the ones that
 * appended a revision, plus the publication's OwnerCap id.
 *
 * The morse contracts emit no per-entry events, so revisions are matched to
 * transactions through their Walrus blob object: each revision-creating Move
 * call takes the blob object as an argument, so the call's transaction lists
 * it among its changed objects (see `anchorEntryRevisions`).
 *
 * Returns null when the GraphQL service is unreachable; the page then renders
 * the record without transaction details instead of failing.
 */
export const loadPublicationHistory = cache(
  async (publicationId: string): Promise<PublicationHistory | null> => {
    try {
      const revisionTransactions: RevisionTransaction[] = [];
      let ownerCapId: string | null = null;
      let after: string | null = null;

      for (let page = 0; page < MAX_PAGES; page++) {
        const data: HistoryQueryResult = await runQuery<HistoryQueryResult>(
          HISTORY_QUERY,
          { publication: publicationId, after },
        );
        for (const node of data.transactions.nodes) {
          const changes = node.effects.objectChanges.nodes;
          ownerCapId ??=
            changes.find(
              (c) =>
                c.outputState?.asMoveObject?.contents.type.repr ===
                OWNER_CAP_TYPE,
            )?.address ?? null;

          const operation = revisionOperation(node);
          if (!operation) continue;
          revisionTransactions.push({
            digest: node.digest,
            timestampMs: Date.parse(node.effects.timestamp),
            epoch: node.effects.epoch.epochId,
            operation,
            changedObjectIds: new Set(
              changes.map((c) => normalizeSuiAddress(c.address)),
            ),
          });
        }
        const { hasNextPage, endCursor } = data.transactions.pageInfo;
        if (!hasNextPage || !endCursor) break;
        after = endCursor;
      }

      return { revisionTransactions, ownerCapId };
    } catch (err) {
      console.error(
        `[publication-history] Could not load history for ${publicationId}`,
        err,
      );
      return null;
    }
  },
);

/**
 * Current holder of a publication's OwnerCap, or null when the cap is not
 * address-owned (wrapped, deleted) or the lookup fails.
 */
export const loadPublicationOwner = cache(
  async (ownerCapId: string): Promise<string | null> => {
    try {
      const data = await runQuery<OwnerQueryResult>(OWNER_QUERY, {
        id: ownerCapId,
      });
      return data.object?.owner?.address?.address ?? null;
    } catch (err) {
      console.error(
        `[publication-history] Could not load owner of ${ownerCapId}`,
        err,
      );
      return null;
    }
  },
);

/**
 * Anchors each of an entry's revisions to the transaction that appended it,
 * index-aligned with `entry.revisions`.
 *
 * A revision's transaction is one that changed its blob object. When several
 * revisions share a blob (publishing a draft reuses the draft's blob), the
 * k-th revision using that blob maps to the k-th such transaction, since
 * both lists are chronological. Quilt-backed revisions have no blob object
 * to match on and resolve to null.
 */
export function anchorEntryRevisions(
  history: PublicationHistory,
  entry: Entry,
): (RevisionAnchor | null)[] {
  const uses = new Map<string, number>();
  return entry.revisions.map((revision) => {
    if (revision.blobRef.kind !== "blob") return null;
    const blobObjectId = normalizeSuiAddress(revision.blobRef.blobObjectId);
    const nth = uses.get(blobObjectId) ?? 0;
    uses.set(blobObjectId, nth + 1);

    const match = history.revisionTransactions.filter((tx) =>
      tx.changedObjectIds.has(blobObjectId),
    )[nth];
    if (!match) return null;
    return {
      digest: match.digest,
      timestampMs: match.timestampMs,
      epoch: match.epoch,
      operation: match.operation,
    };
  });
}
