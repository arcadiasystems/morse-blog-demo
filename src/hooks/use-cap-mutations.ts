"use client";

import {
  issuePublisherCap,
  revokePublisherCap,
  toOwnerCapId,
  toPublicationId,
  toPublisherCapId,
  toSuiAddress,
  transferOwnership,
  type IssuePublisherCapResult,
  type RevokePublisherCapResult,
  type TransferOwnershipResult,
} from "@arcadiasystems/morse-sdk";
import {
  type QueryClient,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useMorse } from "@/hooks/use-morse";
import {
  coauthoredPublicationsKey,
  myPublicationsKey,
} from "@/hooks/use-publications";
import { publisherCapsKey } from "@/hooks/use-publisher-cap";

/**
 * Re-reads what the connected wallet can write to after a cap was issued or
 * revoked. The cap may be one this wallet holds itself (an owner revoking
 * their own cap, or issuing one to their own address), so its "New post"
 * actions and "Shared with me" list must not keep the answer from before.
 */
function invalidateWriteAccess(
  queryClient: QueryClient,
  address: string | undefined,
): void {
  queryClient.invalidateQueries({ queryKey: publisherCapsKey(address) });
  queryClient.invalidateQueries({
    queryKey: coauthoredPublicationsKey(address),
  });
}

export type IssueInput = {
  publicationId: string;
  ownerCapId: string;
  holder: string;
};

export function useIssuePublisherCap() {
  const morse = useMorse();
  const queryClient = useQueryClient();

  return useMutation<IssuePublisherCapResult, Error, IssueInput>({
    mutationFn: async (input) => {
      if (!morse) throw new Error("Connect a wallet first.");
      return issuePublisherCap(morse.adapter, morse.config, {
        publicationId: toPublicationId(input.publicationId),
        ownerCapId: toOwnerCapId(input.ownerCapId),
        holder: toSuiAddress(input.holder),
      });
    },
    onSuccess: () => {
      invalidateWriteAccess(queryClient, morse?.account?.address);
    },
  });
}

export type RevokeInput = {
  publicationId: string;
  ownerCapId: string;
  publisherCapId: string;
};

export function useRevokePublisherCap() {
  const morse = useMorse();
  const queryClient = useQueryClient();

  return useMutation<RevokePublisherCapResult, Error, RevokeInput>({
    mutationFn: async (input) => {
      if (!morse) throw new Error("Connect a wallet first.");
      return revokePublisherCap(morse.adapter, morse.config, {
        publicationId: toPublicationId(input.publicationId),
        ownerCapId: toOwnerCapId(input.ownerCapId),
        publisherCapId: toPublisherCapId(input.publisherCapId),
      });
    },
    onSuccess: () => {
      invalidateWriteAccess(queryClient, morse?.account?.address);
    },
  });
}

export type TransferOwnershipInput = {
  ownerCapId: string;
  recipient: string;
};

export function useTransferOwnership() {
  const morse = useMorse();
  const queryClient = useQueryClient();

  return useMutation<TransferOwnershipResult, Error, TransferOwnershipInput>({
    mutationFn: async (input) => {
      if (!morse) throw new Error("Connect a wallet first.");
      return transferOwnership(morse.adapter, morse.config, {
        ownerCapId: toOwnerCapId(input.ownerCapId),
        recipient: toSuiAddress(input.recipient),
      });
    },
    onSuccess: () => {
      // Ownership transferred - this publication leaves the user's owned list.
      queryClient.invalidateQueries({
        queryKey: myPublicationsKey(morse?.account?.address),
      });
    },
  });
}
