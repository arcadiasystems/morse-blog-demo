import {
  ConfigurationError,
  ContractAbortError,
  MorseError,
  NotFoundError,
  SealError,
  TransportError,
  UnauthorizedError,
  UncertifiedBlobError,
  UnsupportedWalletSchemeError,
  ValidationError,
} from "@arcadiasystems/morse-sdk";

const UNSUPPORTED_SCHEME_COPY: Record<
  UnsupportedWalletSchemeError["code"],
  { title: string; body: string }
> = {
  "non-canonical-pubkey": {
    title: "Wallet account format not recognized",
    body: "This wallet returned a public key the SDK couldn't decode. Most common cause: Phantom on Sui returns an opaque pubkey. Try Slush or Suiet for a smooth flow.",
  },
  "malformed-zklogin": {
    title: "zkLogin account is malformed",
    body: "The zkLogin pubkey didn't decode cleanly. Reconnect or fall back to a keypair-backed wallet.",
  },
  "recovery-sig-length": {
    title: "Wallet sent an unexpected signature length",
    body: "The probe signature wasn't the expected 65 bytes. The wallet may not support Sui's signPersonalMessage format.",
  },
  "recovery-non-ed25519": {
    title: "Recovery only supports Ed25519",
    body: "The wallet's recovered key isn't Ed25519. Other schemes (Secp256k1, Passkey, etc.) need a wallet that returns a canonical Sui public key directly.",
  },
  "recovery-address-mismatch": {
    title: "Wallet identity check failed",
    body: "The recovered public key did not derive to the wallet's reported address. Reconnect, or try a different wallet.",
  },
};

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

/**
 * Friendlier copy for TransportError thrown by the SDK. `operation` (added in
 * morse-sdk 0.1.2) is a stable discriminator like `sui.getObject`,
 * `walrus.publisher.uploadBlob`, `walrus.aggregator.readBlob`, `seal.decrypt`,
 * etc. Switch on its prefix to tell the user which layer wobbled instead of
 * a generic "network hiccup".
 */
function mapTransportError(err: TransportError): MappedError {
  const op = err.operation;
  const baseBody = err.message
    ? `${err.message}`
    : "Couldn't reach the network. Check your connection and retry.";
  const opTag = op ? ` (${op})` : "";

  if (op?.startsWith("sui.")) {
    return {
      title: "Sui RPC hiccup",
      body: `Sui network call failed${opTag}. ${baseBody}`,
      severity: "error",
    };
  }
  if (op?.startsWith("walrus.publisher.")) {
    return {
      title: "Walrus publisher unavailable",
      body: `The publisher couldn't accept the upload${opTag}. Try again, or switch to a different publisher in src/lib/morse-config.ts.`,
      severity: "error",
    };
  }
  if (op?.startsWith("walrus.aggregator.")) {
    return {
      title: "Walrus aggregator unavailable",
      body: `The aggregator couldn't return the blob${opTag}. Fresh blobs can take ~30s to propagate on testnet - retry shortly.`,
      severity: "warning",
    };
  }
  if (op?.startsWith("walrus.")) {
    return {
      title: "Walrus storage hiccup",
      body: `Walrus call failed${opTag}. ${baseBody}`,
      severity: "error",
    };
  }
  if (op?.startsWith("seal.")) {
    return {
      title: "Seal call failed",
      body: `${baseBody}${opTag}`,
      severity: "error",
    };
  }
  return {
    title: "Network hiccup",
    body: baseBody + opTag,
    severity: "error",
  };
}

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
        title: "Walrus blob unavailable",
        body: "The aggregator does not have this blob. If it was just uploaded, wait ~30s for testnet propagation and retry. Otherwise its storage lease has expired (Walrus blobs are not permanent) - open the post and re-save to restore it with a fresh blob.",
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
  if (err instanceof UnsupportedWalletSchemeError) {
    const copy = UNSUPPORTED_SCHEME_COPY[err.code];
    return {
      title: copy.title,
      body: copy.body,
      severity: "error",
      reason: err.code,
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
    return mapTransportError(err);
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
