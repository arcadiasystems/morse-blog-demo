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
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useMorse } from "../hooks/use-morse";
import { myPublicationsKey } from "../hooks/use-publications";
import { publisherCapKey } from "../hooks/use-publisher-cap";

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
      queryClient.invalidateQueries({
        queryKey: publisherCapKey(morse?.account?.address, ""),
        exact: false,
      });
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
      queryClient.invalidateQueries({
        queryKey: publisherCapKey(morse?.account?.address, ""),
        exact: false,
      });
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
