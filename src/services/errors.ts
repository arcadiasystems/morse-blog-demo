import {
  ConfigurationError,
  ContractAbortError,
  MorseError,
  NotFoundError,
  SealError,
  TransportError,
  UnauthorizedError,
  UncertifiedBlobError,
  ValidationError,
} from "@arcadiasystems/morse-sdk";

export type MappedError = {
  title: string;
  body: string;
  severity: "error" | "warning";
  /**
   * For form-level errors, the field name to attach to. Set by abort-code
   * mapping (e.g. ESlugAlreadyExists -> "slug").
   */
  field?: string;
  /** Stable abort reason for callers that want to branch on it. */
  reason?: string;
};

const ABORT_REASON_COPY: Record<
  string,
  { title: string; body: string; field?: string }
> = {
  ESlugAlreadyExists: {
    title: "That slug is taken",
    body: "Pick a different slug. Slugs must be unique across all active morse publications.",
    field: "slug",
  },
  ESlugInvalid: {
    title: "Invalid slug",
    body: "Use lowercase letters, numbers, and hyphens only.",
    field: "slug",
  },
  ENameEmpty: {
    title: "Name is required",
    body: "Give the publication a name before submitting.",
    field: "name",
  },
  EPublisherCapWrongHolder: {
    title: "Wrong wallet for this cap",
    body: "The publisher cap you're using belongs to a different address.",
  },
  EOwnerCapMismatch: {
    title: "Not the owner",
    body: "Your wallet doesn't hold the OwnerCap for this publication.",
  },
  ECollectionAlreadyExists: {
    title: "Collection already exists",
    body: "A collection with that name already exists on this publication.",
  },
  ECollectionNotFound: {
    title: "Collection not found",
    body: "The collection name does not exist on this publication.",
  },
  EEntryNotFound: {
    title: "Entry not found",
    body: "That entry no longer exists. It may have been deleted.",
  },
  ERevisionInvalid: {
    title: "Invalid revision",
    body: "The revision pointer references a non-existent revision.",
  },
  EPublisherCapRevoked: {
    title: "Publisher cap revoked",
    body: "Your cap was revoked by the publication owner.",
  },
};

const SEAL_COPY: Record<SealError["code"], { title: string; body: string }> = {
  "no-access": {
    title: "Locked",
    body: "You don't have permission to read this premium post.",
  },
  "decrypt-failed": {
    title: "Could not decrypt",
    body: "The post may have been tampered with or the key servers refused the request.",
  },
  "session-expired": {
    title: "Session expired",
    body: "Your decrypt session ran out. Connect again to read this post.",
  },
  "rate-limited": {
    title: "Rate limited",
    body: "Too many decrypt requests. Wait a moment and try again.",
  },
};

export function mapSdkError(err: unknown): MappedError {
  if (err instanceof ContractAbortError) {
    const copy = ABORT_REASON_COPY[err.reason];
    if (copy) {
      return {
        title: copy.title,
        body: copy.body,
        severity: "error",
        field: copy.field,
        reason: err.reason,
      };
    }
    return {
      title: "On-chain check failed",
      body: `${err.reason}: ${err.message}`,
      severity: "error",
      reason: err.reason,
    };
  }
  if (err instanceof ValidationError) {
    return {
      title: "Invalid input",
      body: err.message,
      severity: "error",
      field: err.field,
    };
  }
  if (err instanceof NotFoundError) {
    if (err.resource === "blob") {
      return {
        title: "Walrus blob not available yet",
        body: "The aggregator does not have this blob. Wait ~30s for testnet propagation and retry, or the blob may have expired (storage epochs elapsed).",
        severity: "warning",
      };
    }
    return {
      title: "Not found",
      body: `${err.resource}: ${err.identifier}`,
      severity: "error",
    };
  }
  if (err instanceof UnauthorizedError) {
    return {
      title: "Not authorized",
      body: err.message,
      severity: "error",
    };
  }
  if (err instanceof SealError) {
    const copy = SEAL_COPY[err.code];
    return {
      title: copy.title,
      body: copy.body,
      severity: "error",
    };
  }
  if (err instanceof UncertifiedBlobError) {
    return {
      title: "Upload finished, entry did not",
      body: `Your bytes are on Walrus (${err.blobId.slice(0, 12)}...) but the post wasn't attached. Retry to complete.`,
      severity: "warning",
    };
  }
  if (err instanceof ConfigurationError) {
    return {
      title: "Wallet not supported",
      body: err.message,
      severity: "error",
    };
  }
  if (err instanceof TransportError) {
    return {
      title: "Network hiccup",
      body: "Couldn't reach the chain. Check your connection and retry.",
      severity: "error",
    };
  }
  if (err instanceof MorseError) {
    return {
      title: "Morse SDK error",
      body: err.message,
      severity: "error",
    };
  }
  if (err instanceof Error) {
    return {
      title: "Unexpected error",
      body: err.message,
      severity: "error",
    };
  }
  return {
    title: "Unexpected error",
    body: String(err),
    severity: "error",
  };
}
